// src/js をブラウザなしで読み、純粋な計算・状態遷移・課題データを検査する。
//   node tests/check.mjs
// （先に python3 build.py --check が通っている前提。npm test でまとめて動く）

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// src/index.html の @include と同じ順でつなぐ（main.js の起動処理は除く）
const html = readFileSync(path.join(root, 'src/index.html'), 'utf8');
const files = [...html.matchAll(/@include (js\/[\w.-]+)/g)]
  .map(m => m[1])
  .filter(f => f !== 'js/main.js');
const source = files
  .map(f => readFileSync(path.join(root, 'src', f), 'utf8'))
  .join('\n;\n');

const context = {
  performance: { now: () => context.__now },
  setTimeout: () => 0,
  clearTimeout: () => {},
  document: { addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [] },
  __now: 0,
};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'src/js (concat)' });
const run = code => vm.runInContext(code, context);
run('render = () => {};'); // 描画はDOMが要るので黙らせる

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log('ok  ', name);
  } else {
    failed++;
    console.log('NG  ', name);
  }
}
function near(a, b) { return Math.abs(a - b) < 1e-9; }

// 課題データ（引き継ぎ書§5.4の必須項目）
check('課題が2つある', run('lessons.length') === 2);
check(
  '各課題に id/module/title/prompt/help/reflectionPrompt がある',
  run(`lessons.every(l => l.id && l.module && l.title && l.prompt && l.help && l.reflectionPrompt)`),
);
check('module は circle か sphere', run(`lessons.every(l => ['circle','sphere'].includes(l.module))`));

// 計算の道具
check('distance は三平方', run(`distance({x:0,y:0},{x:3,y:4})`) === 5);
check('clamp は上下にはさむ', run('clamp(5,0,3)') === 3 && run('clamp(-1,0,3)') === 0);
check('esc はHTMLを逃がす', run(`esc('<a href="x">&</a>')`) === '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');

// 球の回転
run('state.sphere = { yaw: 0, pitch: 0 };');
check('yaw=pitch=0 ならベクトルは変わらない',
  run('const v = rotateVector([1,2,3]); v.every((x,i) => Math.abs(x - [1,2,3][i]) < 1e-9)'));

// 円：点を打つ
run(`state.screen='work'; state.lesson=lessons[0]; state.activeTool='move';
    state.dots=[]; state.history=[]; state.lastPlacedAt=-1e9;
    state.geometry={center:{x:100,y:100},radiusPoint:{x:200,y:100}};`);
run('__now=1000; placeDot();');
check('点が1つ置ける', run('state.dots.length') === 1);
run('placeDot();');
check('80ms以内の連打は置かない', run('state.dots.length') === 1);
run('__now=2000; placeDot();');
check('同じ場所（22px未満）は重ねない', run('state.dots.length') === 1);
run(`state.geometry.radiusPoint={x:100,y:200}; __now=3000; placeDot();`);
check('別の場所には置ける', run('state.dots.length') === 2);

// もどす：上限20、直前の状態へ戻る
run('state.history=[]; for(let i=0;i<25;i++) remember();');
check('履歴は20件で止まる', run('state.history.length') === 20);
/* strokes は「本数」だけ記録する設計：戻すと現在の配列をその本数に切る */
run('state.dots=[{x:1,y:1}]; state.strokes=[]; remember();');
run('state.dots=[]; state.strokes=[[{x:0,y:0}]]; undo();');
check('undo で点が戻り手書きが消える', run('state.dots.length === 1 && state.strokes.length === 0'));

// 課題の開き直しで実験状態が初期化される
run(`state.dots=[{x:1,y:1}]; state.stamps=[{yaw:0,pitch:0,color:'#fff'}];
    state.reflection='x'; resetWorkState(lessons[1]);`);
check('課題の切替で実験状態が戻る',
  run(`state.dots.length===0 && state.stamps.length===0 && state.reflection===''
      && state.lesson.id==='sphere-01'`));

// 生成物が src と一致しているか
import { execFileSync } from 'node:child_process';
try {
  execFileSync('python3', ['build.py', '--check'], { cwd: root, stdio: 'pipe' });
  check('build.py --check（生成物は最新）', true);
} catch {
  check('build.py --check（生成物は最新）', false);
}

if (failed) {
  console.log(`\n${failed} 件だめだった`);
  process.exit(1);
}
console.log('\n全部とおった');
