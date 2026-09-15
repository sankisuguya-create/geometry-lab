const BOX = { width: 700, height: 460 };
const lessons = [{
  id: 'circle-01',
  title: '円のひみつ 1',
  meta: '同じ長さの点を集めよう',
  prompt: '黄色の点から、青い棒と同じ長さのところに 点をうとう。',
  reflectionPrompt: '黄色の点から同じ長さのところに点を打つと、どんな形になった？',
}];

const initialGeometry = () => ({
  center: { x: 350, y: 230 },
  radiusPoint: { x: 500, y: 230 },
});

const app = document.querySelector('#app');
const state = {
  screen: 'home', lesson: lessons[0], activeTool: 'move', reflection: '', helpOpen: false,
  geometry: initialGeometry(), dots: [], revealed: false, strokes: [], history: [],
  pointerSession: null, resizeObserver: null, stageSize: null,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const copyGeometry = () => JSON.parse(JSON.stringify(state.geometry));
const escapeHtml = (value) => value.replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

function render() {
  state.resizeObserver?.disconnect();
  state.resizeObserver = null;
  const views = { home: renderHome, intro: renderIntro, work: renderWork, summary: renderSummary };
  app.innerHTML = views[state.screen]();
  bindEvents();
}

function renderHome() {
  const cards = lessons.map((lesson) => `<button class="lesson-card" data-action="open-lesson" data-lesson-id="${lesson.id}">
    <span class="lesson-card__icon" aria-hidden="true">○</span>
    <span class="lesson-card__title">${lesson.title}</span>
    <span class="lesson-card__meta">${lesson.meta}</span>
  </button>`).join('');
  return `<section class="app-shell home"><div><p class="eyebrow">さんすう</p><h1>図形のへんしん<br>実験室</h1><p class="lead">うごかして、みつけよう。</p></div><div aria-label="学習をえらぶ">${cards}</div></section>`;
}

function renderIntro() {
  return `<section class="app-shell intro"><div class="topbar"><button class="back" data-action="go-home">← もどる</button></div><div class="intro__body"><p class="eyebrow">さんすう　円</p><h2>${state.lesson.title}</h2><p class="prompt">${state.lesson.prompt}</p></div><button class="primary" data-action="start-work">はじめる</button></section>`;
}

function renderWork() {
  const { center, radiusPoint } = state.geometry;
  const pressed = (tool) => tool === state.activeTool ? 'true' : 'false';
  const dots = state.dots.map((dot) => `<circle class="placed-dot" cx="${dot.x}" cy="${dot.y}" r="9"></circle>`).join('');
  const radius = distance(center, radiusPoint);
  const revealAction = state.dots.length >= 6 && !state.revealed
    ? '<button class="discover-button" data-action="connect-dots">点を つないでみる</button>'
    : '';
  const hint = revealAction ? '' : `<p class="stage__hint">${state.activeTool === 'move' ? `青い棒を ぐるっと動かして、先に点をうとう。　${state.dots.length}こ` : 'ペンで しるしや ことばを かこう。'}</p>`;
  const revealedCircle = state.revealed
    ? `<circle class="revealed-circle" cx="${center.x}" cy="${center.y}" r="${radius}"></circle>`
    : '';
  return `<section class="app-shell work">
    <div class="topbar"><button class="back" data-action="go-intro">← もどる</button><div class="topbar__actions"><button class="next" data-action="go-summary">まとめへ</button><button class="help" aria-label="つかいかた" data-action="open-help">?</button></div></div>
    <p class="work__question">${state.lesson.prompt}</p>
    <div class="stage stage--${state.activeTool}" id="stage" aria-label="点を打って形をつくる場所">
      <svg class="stage__svg" id="geometry-svg" viewBox="0 0 ${BOX.width} ${BOX.height}" role="img" aria-label="黄色の中心から同じ長さの点を集める図">
        ${revealedCircle}
        ${dots}
        <line class="radius-arm" data-drag="radius" x1="${center.x}" y1="${center.y}" x2="${radiusPoint.x}" y2="${radiusPoint.y}"></line>
        <circle class="handle handle--centre" cx="${center.x}" cy="${center.y}" r="16"></circle>
        <circle class="handle handle--radius" data-drag="radius" cx="${radiusPoint.x}" cy="${radiusPoint.y}" r="17"></circle>
      </svg>
      <canvas class="stage__ink" id="ink-canvas" aria-label="考えを書き込む場所"></canvas>
      ${hint}
      ${revealAction}
    </div>
    <nav class="tool-dock" aria-label="つかうどうぐ"><button aria-pressed="${pressed('move')}" data-action="tool" data-tool="move">うごかす</button><button aria-pressed="${pressed('pen')}" data-action="tool" data-tool="pen">かく</button><button data-action="undo">もどす</button></nav>
    ${state.helpOpen ? renderHelpDialog() : ''}
  </section>`;
}

function renderHelpDialog() {
  return `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"><div class="dialog__panel"><h2 id="help-title">つかいかた</h2><p>黄色の点は動かないよ。青い棒の先を、いろいろな向きへ動かしてはなすと、点が打てるよ。</p><p>点がふえてきたら、どんな形になりそうか考えてみよう。</p><button class="primary" data-action="close-help">わかった</button></div></div>`;
}

function renderSummary() {
  return `<section class="app-shell summary"><div class="topbar"><button class="back" data-action="go-work">← もどる</button></div><div class="summary__body"><p class="eyebrow">まとめ</p><h2>分かったことを<br>書こう</h2><p class="prompt">${state.lesson.reflectionPrompt}</p><textarea id="reflection" maxlength="240" placeholder="たとえば、中心から…">${escapeHtml(state.reflection)}</textarea></div><div class="summary__actions"><button class="secondary" data-action="save-image">えを保存</button><button class="primary" data-action="finish">おわる</button></div></section>`;
}

function bindEvents() {
  app.querySelectorAll('[data-action]').forEach((element) => element.addEventListener('click', () => handleAction(element.dataset)));
  const reflection = document.querySelector('#reflection');
  if (reflection) reflection.addEventListener('input', (event) => { state.reflection = event.target.value; });
  if (state.screen === 'work') setupWorkSurface();
}

function setupWorkSurface() {
  const stage = document.querySelector('#stage');
  const svg = document.querySelector('#geometry-svg');
  const canvas = document.querySelector('#ink-canvas');
  const stageRect = stage.getBoundingClientRect();
  state.stageSize = { width: stageRect.width, height: stageRect.height };
  resizeAndDrawInk(canvas);
  state.resizeObserver = new ResizeObserver(() => resizeAndDrawInk(canvas));
  state.resizeObserver.observe(stage);
  if (state.activeTool === 'move') {
    svg.querySelectorAll('[data-drag="radius"]').forEach((target) => target.addEventListener('pointerdown', (event) => beginRadiusDrag(event, svg)));
  } else {
    canvas.addEventListener('pointerdown', (event) => beginInkStroke(event, canvas));
  }
}

function pointInBox(event, svg) {
  const rect = svg.getBoundingClientRect();
  return { x: clamp((event.clientX - rect.left) * BOX.width / rect.width, 0, BOX.width), y: clamp((event.clientY - rect.top) * BOX.height / rect.height, 0, BOX.height) };
}

function remember() {
  state.history.push({ geometry: copyGeometry(), dots: state.dots.map((dot) => ({ ...dot })), revealed: state.revealed, strokeCount: state.strokes.length });
  if (state.history.length > 20) state.history.shift();
}

function beginRadiusDrag(event, svg) {
  event.preventDefault();
  remember();
  state.pointerSession = { type: 'radius', svg, geometry: copyGeometry() };
  svg.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', movePointer);
  window.addEventListener('pointerup', endPointer, { once: true });
}

function movePointer(event) {
  const session = state.pointerSession;
  if (!session) return;
  if (session.type === 'ink') { addInkPoint(event, session.canvas); return; }
  const point = pointInBox(event, session.svg);
  const { center, radiusPoint } = session.geometry;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const length = Math.hypot(dx, dy) || 1;
  const radius = distance(center, radiusPoint);
  state.geometry.radiusPoint = { x: center.x + dx / length * radius, y: center.y + dy / length * radius };
  updateArm();
}

function updateArm() {
  const svg = document.querySelector('#geometry-svg');
  if (!svg) return;
  const { center, radiusPoint } = state.geometry;
  const arm = svg.querySelector('.radius-arm');
  arm.setAttribute('x1', center.x); arm.setAttribute('y1', center.y);
  arm.setAttribute('x2', radiusPoint.x); arm.setAttribute('y2', radiusPoint.y);
  const handle = svg.querySelector('.handle--radius');
  handle.setAttribute('cx', radiusPoint.x); handle.setAttribute('cy', radiusPoint.y);
}

function placeDot() {
  const point = state.geometry.radiusPoint;
  if (state.dots.some((dot) => distance(dot, point) < 22)) return;
  state.dots.push({ x: point.x, y: point.y });
}

function beginInkStroke(event, canvas) {
  event.preventDefault();
  remember();
  state.pointerSession = { type: 'ink', canvas, stroke: [] };
  addInkPoint(event, canvas);
  canvas.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', movePointer);
  window.addEventListener('pointerup', endPointer, { once: true });
}

function addInkPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  state.pointerSession.stroke.push({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  drawInk(canvas);
}

function endPointer() {
  const session = state.pointerSession;
  if (session?.type === 'radius') placeDot();
  if (session?.type === 'ink' && session.stroke.length) state.strokes.push(session.stroke);
  state.pointerSession = null;
  window.removeEventListener('pointermove', movePointer);
  if (session?.type === 'radius') render();
}

function resizeAndDrawInk(canvas) {
  const scale = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * scale));
  canvas.height = Math.max(1, Math.floor(rect.height * scale));
  canvas.getContext('2d').scale(scale, scale);
  drawInk(canvas);
}

function drawInk(canvas) {
  const context = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  context.clearRect(0, 0, rect.width, rect.height);
  context.lineCap = 'round'; context.lineJoin = 'round'; context.lineWidth = 4; context.strokeStyle = '#24343b';
  const lines = state.pointerSession?.type === 'ink' ? [...state.strokes, state.pointerSession.stroke] : state.strokes;
  lines.forEach((stroke) => {
    if (!stroke.length) return;
    context.beginPath();
    stroke.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.stroke();
  });
}

function undo() {
  const previous = state.history.pop();
  if (!previous) return;
  state.geometry = previous.geometry;
  state.dots = previous.dots;
  state.revealed = previous.revealed;
  state.strokes = state.strokes.slice(0, previous.strokeCount);
}

function exportImage() {
  const { center, radiusPoint } = state.geometry;
  const radius = distance(center, radiusPoint);
  const dots = state.dots.map((dot) => `<circle class="dot" cx="${dot.x}" cy="${dot.y}" r="9"/>`).join('');
  const revealed = state.revealed ? `<circle class="reveal" cx="${center.x}" cy="${center.y}" r="${radius}"/>` : '';
  const style = '<style>.arm{stroke:#4b7c8c;stroke-width:8;stroke-linecap:round}.center{fill:#f3bf51;stroke:#fff;stroke-width:4}.tip{fill:#4b7c8c;stroke:#fff;stroke-width:4}.dot{fill:#db8a4e;stroke:#fff;stroke-width:3}.reveal{fill:none;stroke:#4b7c8c;stroke-width:4;stroke-dasharray:10 9}</style>';
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX.width} ${BOX.height}">${style}<rect width="700" height="460" fill="white"/>${revealed}${dots}<line class="arm" x1="${center.x}" y1="${center.y}" x2="${radiusPoint.x}" y2="${radiusPoint.y}"/><circle class="center" cx="${center.x}" cy="${center.y}" r="16"/><circle class="tip" cx="${radiusPoint.x}" cy="${radiusPoint.y}" r="17"/></svg>`;
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  const image = new Image();
  image.onload = () => {
    const output = document.createElement('canvas');
    output.width = 1400; output.height = 920;
    const context = output.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, output.width, output.height);
    context.drawImage(image, 0, 0, output.width, output.height);
    const size = state.stageSize ?? { width: output.width, height: output.height };
    context.lineCap = 'round'; context.lineJoin = 'round'; context.lineWidth = 8; context.strokeStyle = '#24343b';
    state.strokes.forEach((stroke) => { context.beginPath(); stroke.forEach((point, index) => index ? context.lineTo(point.x * output.width / size.width, point.y * output.height / size.height) : context.moveTo(point.x * output.width / size.width, point.y * output.height / size.height)); context.stroke(); });
    const link = document.createElement('a');
    link.download = 'enno-himitsu.png'; link.href = output.toDataURL('image/png'); link.click();
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

function handleAction(dataset) {
  switch (dataset.action) {
    case 'open-lesson': state.lesson = lessons.find((lesson) => lesson.id === dataset.lessonId) ?? lessons[0]; state.screen = 'intro'; break;
    case 'go-home': state.screen = 'home'; break;
    case 'go-intro': state.screen = 'intro'; break;
    case 'start-work': state.screen = 'work'; break;
    case 'go-work': state.screen = 'work'; break;
    case 'go-summary': state.screen = 'summary'; break;
    case 'tool': state.activeTool = dataset.tool; break;
    case 'undo': undo(); break;
    case 'connect-dots': state.revealed = true; break;
    case 'save-image': exportImage(); return;
    case 'open-help': state.helpOpen = true; break;
    case 'close-help': state.helpOpen = false; break;
    case 'finish': localStorage.setItem(`geometry-lab:${state.lesson.id}:reflection`, state.reflection); window.alert('まとめを この端末に 保存したよ。'); state.screen = 'home'; break;
    default: return;
  }
  render();
}
render();
