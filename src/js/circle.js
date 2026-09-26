/* 円モジュール：棒を動かして等距離の点を集める実験。
   18こ前後・方位が16区分以上そろうと「円になった」とみなし、
   少し待ってから配色と半径を変えて次の試行を促す。 */

const circlePalettes = [
  { bg: '#16002f', point: '#ffe600', arm: '#21f3c4', text: '#fff' },
  { bg: '#ff145b', point: '#00ffe1', arm: '#1700ff', text: '#fff' },
  { bg: '#00d9a6', point: '#5c00ff', arm: '#ffea00', text: '#102a2b' },
  { bg: '#ff6a00', point: '#00eaff', arm: '#1900ff', text: '#fff' },
];

let armDrag = null; // 'centre' | 'radius' | 'rotate'（ドラッグ中の役割）

function renderCircleWork() {
  const c = state.geometry.center;
  const p = state.geometry.radiusPoint;
  const dots = state.dots
    .map(d => `<circle class="placed-dot" cx="${d.x}" cy="${d.y}" r="9"/>`)
    .join('');
  const hint = state.activeTool === 'move'
    ? `<div class="enter-hint"><strong>ENTER</strong><span>で 点をうつ</span></div>
       <p class="stage__count">${state.dots.length}こ</p>`
    : '<p class="stage__hint">ペンで しるしや ことばを かこう。</p>';
  return `<section class="app-shell work psychedelic" style="--psy-bg:${state.palette.bg};--psy-point:${state.palette.point};--psy-arm:${state.palette.arm};--psy-text:${state.palette.text}">
    ${workHeader()}
    <div class="stage stage--${state.activeTool}" id="stage">
      <svg class="stage__svg" id="geometry-svg" viewBox="0 0 ${BOX.width} ${BOX.height}">
        ${dots}
        <line class="radius-arm" x1="${c.x}" y1="${c.y}" x2="${p.x}" y2="${p.y}"/>
        <circle class="handle handle--centre" cx="${c.x}" cy="${c.y}" r="16"/>
        <circle class="handle handle--radius" cx="${p.x}" cy="${p.y}" r="17"/>
      </svg>
      <canvas class="stage__ink" id="ink-canvas"></canvas>
      ${hint}
    </div>
    <nav class="tool-dock">
      <button aria-pressed="${state.activeTool === 'move'}" data-action="tool" data-tool="move">うごかす</button>
      <button aria-pressed="${state.activeTool === 'pen'}" data-action="tool" data-tool="pen">かく</button>
      <button data-action="undo">もどす</button>
    </nav>
    ${helpDialog()}
  </section>`;
}

function setupCircle() {
  const svg = document.querySelector('#geometry-svg');
  const canvas = document.querySelector('#ink-canvas');
  resizeAndDrawInk(canvas);
  if (state.activeTool !== 'move') {
    canvas.addEventListener('pointerdown', e => beginInkStroke(e, canvas));
    return;
  }
  svg.addEventListener('pointerdown', e => {
    e.preventDefault();
    const q = svgPoint(e, svg);
    armDrag = distance(q, state.geometry.center) < 34 ? 'centre'
      : distance(q, state.geometry.radiusPoint) < 34 ? 'radius' : 'rotate';
    armMove(q, svg);
    if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', e => {
    if (armDrag || !e.buttons) armMove(svgPoint(e, svg), svg);
  });
  svg.addEventListener('pointerup', () => {
    if (armDrag) {
      armDrag = null;
      placeDot();
    }
  });
  svg.addEventListener('pointercancel', () => { armDrag = null; });
}

/* 指・マウスの位置をSVGの論理座標へ。viewBox は等比（meet）で拡大縮小＋余白が
   出るので、実スケールと余白を引いてから変換する（x/y を別々に伸ばすと
   指と棒がずれる） */
function svgPoint(e, svg) {
  const r = svg.getBoundingClientRect();
  const s = Math.min(r.width / BOX.width, r.height / BOX.height);
  const ox = (r.width - BOX.width * s) / 2;
  const oy = (r.height - BOX.height * s) / 2;
  return {
    x: clamp((e.clientX - r.left - ox) / s, 0, BOX.width),
    y: clamp((e.clientY - r.top - oy) / s, 0, BOX.height),
  };
}

/* 押した場所で役割を分ける：黄色（中心）はそのまま動かす、青（先）は半径を
   伸ばし縮め、それ以外は棒をその方向へ向ける。 */
function armMove(q, svg) {
  const c = state.geometry.center;
  const p = state.geometry.radiusPoint;
  if (armDrag === 'centre') {
    state.geometry.radiusPoint = { x: p.x + q.x - c.x, y: p.y + q.y - c.y };
    state.geometry.center = { x: q.x, y: q.y };
  } else if (armDrag === 'radius') {
    const dx = q.x - c.x;
    const dy = q.y - c.y;
    const l = Math.hypot(dx, dy) || 1;
    const rad = clamp(l, 40, 330);
    state.geometry.radiusPoint = { x: c.x + dx / l * rad, y: c.y + dy / l * rad };
  } else {
    const dx = q.x - c.x;
    const dy = q.y - c.y;
    const l = Math.hypot(dx, dy);
    if (l < 10) return;
    const rad = distance(c, p);
    state.geometry.radiusPoint = { x: c.x + dx / l * rad, y: c.y + dy / l * rad };
  }
  const nc = state.geometry.center;
  const np = state.geometry.radiusPoint;
  const a = svg.querySelector('.radius-arm');
  const hr = svg.querySelector('.handle--radius');
  const hc = svg.querySelector('.handle--centre');
  a.setAttribute('x1', nc.x);
  a.setAttribute('y1', nc.y);
  a.setAttribute('x2', np.x);
  a.setAttribute('y2', np.y);
  hr.setAttribute('cx', np.x);
  hr.setAttribute('cy', np.y);
  hc.setAttribute('cx', nc.x);
  hc.setAttribute('cy', nc.y);
}

function placeDot() {
  const now = performance.now();
  if (now - state.lastPlacedAt < 80) return;
  state.lastPlacedAt = now;
  const p = state.geometry.radiusPoint;
  if (state.dots.some(d => distance(d, p) < 22)) return;
  remember();
  state.dots.push({ x: p.x, y: p.y });
  if (state.dots.length >= 18 && new Set(state.dots.map(d => Math.floor(
    (((Math.atan2(d.y - state.geometry.center.y, d.x - state.geometry.center.x) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * 18
  ))).size >= 16) {
    schedulePaletteChange();
  }
  render();
}

function schedulePaletteChange() {
  if (state.completionTimer) return;
  state.completionTimer = setTimeout(() => {
    state.completionTimer = null;
    if (state.screen !== 'work' || state.lesson.module !== 'circle') return;
    const choices = circlePalettes.filter(p => p.bg !== state.palette.bg);
    state.palette = choices[Math.floor(Math.random() * choices.length)];
    const r = 95 + Math.random() * 75;
    state.geometry.radiusPoint = { x: state.geometry.center.x + r, y: state.geometry.center.y };
    state.dots = [];
    render();
  }, 700);
}

/* 円の実験中は Enter・スペース・文字キーでも点を打てる（連打しやすさのため） */
function circleKeydown(e) {
  if (state.screen !== 'work' || state.lesson.module !== 'circle'
      || state.activeTool !== 'move' || state.helpOpen || e.repeat) return;
  const safe = e.key === 'Enter' || e.key === ' ' || e.code === 'NumpadEnter'
    || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey);
  if (safe) {
    e.preventDefault();
    placeDot();
  }
}
