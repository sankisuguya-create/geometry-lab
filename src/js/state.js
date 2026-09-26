/* 状態の唯一の正（引き継ぎ書§5.3）と、最大20件の「もどす」履歴。
   DOMから状態を逆算しない。画面側は render() でここを描くだけ。 */

const state = {
  screen: 'home',           // home | intro | work | summary
  lesson: lessons[0],
  activeTool: 'move',       // move | pen
  reflection: '',
  helpOpen: false,
  geometry: initialGeometry(),
  dots: [],                 // 円：置いた点
  strokes: [],              // 手書きの線（座標列の配列）
  history: [],
  palette: circlePalettes[0],
  completionTimer: null,    // 円がそろった後の色替えタイマー
  lastPlacedAt: 0,
  sphere: { yaw: 0.25, pitch: -0.18 },
  stamps: [],               // 球：集めたかげ
};

function initialGeometry() {
  return { center: { x: 350, y: 230 }, radiusPoint: { x: 500, y: 230 } };
}

const copyGeometry = () => JSON.parse(JSON.stringify(state.geometry));

/* 課題カードを開き直すたびに実験状態を初期値へ戻す */
function resetWorkState(lesson) {
  state.lesson = lesson;
  state.activeTool = 'move';
  state.reflection = '';
  state.helpOpen = false;
  state.history = [];
  state.dots = [];
  state.strokes = [];
  state.stamps = [];
  state.geometry = initialGeometry();
  state.palette = circlePalettes[0];
  state.sphere = { yaw: 0.25, pitch: -0.18 };
  if (state.completionTimer) {
    clearTimeout(state.completionTimer);
    state.completionTimer = null;
  }
}

function remember() {
  state.history.push({
    geometry: copyGeometry(),
    dots: state.dots.map(d => ({ ...d })),
    strokes: state.strokes.length,
    sphere: { ...state.sphere },
    stamps: state.stamps.map(s => ({ ...s })),
  });
  if (state.history.length > 20) state.history.shift();
}

function undo() {
  const p = state.history.pop();
  if (!p) return;
  state.geometry = p.geometry;
  state.dots = p.dots;
  state.strokes = state.strokes.slice(0, p.strokes);
  state.sphere = p.sphere || state.sphere;
  state.stamps = p.stamps || state.stamps;
  render();
}
