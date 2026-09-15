const BOX = { width: 700, height: 460 };
const lessons = [{
  id: 'circle-01',
  title: '円のひみつ 1',
  meta: '中心からの長さを見つけよう',
  prompt: '円の上の点は、中心からどんなところにあるかな。',
  reflectionPrompt: '円の上の点について、分かったことを書こう。',
}];
const initialGeometry = () => ({
  center: { x: 350, y: 230 },
  radiusPoint: { x: 500, y: 230 },
  probe: { x: 350, y: 100 },
});
const app = document.querySelector('#app');
const state = {
  screen: 'home', lesson: lessons[0], activeTool: 'move', reflection: '', helpOpen: false,
  geometry: initialGeometry(), strokes: [], history: [], pointerSession: null, resizeObserver: null,
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
    <span class="lesson-card__icon" aria-hidden="true">○</span><span class="lesson-card__title">${lesson.title}</span><span class="lesson-card__meta">${lesson.meta}</span>
  </button>`).join('');
  return `<section class="app-shell home"><div><p class="eyebrow">さんすう</p><h1>図形のへんしん<br>実験室</h1><p class="lead">うごかして、みつけよう。</p></div><div aria-label="学習をえらぶ">${cards}</div></section>`;
}

function renderIntro() {
  return `<section class="app-shell intro"><div class="topbar"><button class="back" data-action="go-home">← もどる</button></div><div class="intro__body"><p class="eyebrow">さんすう　円</p><h2>${state.lesson.title}</h2><p class="prompt">${state.lesson.prompt}</p></div><button class="primary" data-action="start-work">はじめる</button></section>`;
}

function renderWork() {
  const radius = distance(state.geometry.center, state.geometry.radiusPoint);
  const onCircle = Math.abs(distance(state.geometry.center, state.geometry.probe) - radius) < 12;
  const pressed = (tool) => tool === state.activeTool ? 'true' : 'false';
  const { center, radiusPoint, probe } = state.geometry;
  return `<section class="app-shell work">
    <div class="topbar"><button class="back" data-action="go-intro">← もどる</button><div class="topbar__actions"><button class="next" data-action="go-summary">まとめへ</button><button class="help" aria-label="つかいかた" data-action="open-help">?</button></div></div>
    <p class="work__question">${state.lesson.prompt}</p>
    <div class="stage stage--${state.activeTool}" id="stage" aria-label="図形をためす場所">
      <svg class="stage__svg" id="geometry-svg" viewBox="0 0 ${BOX.width} ${BOX.height}" role="img" aria-label="円を動かして試す図">
        <line class="guide-line" x1="${center.x}" y1="${center.y}" x2="${radiusPoint.x}" y2="${radiusPoint.y}"></line>
        <circle class="circle-line" data-drag="circle" cx="${center.x}" cy="${center.y}" r="${radius}"></circle>
        <circle class="handle handle--centre" data-drag="center" cx="${center.x}" cy="${center.y}" r="16"></circle>
        <circle class="handle handle--radius" data-drag="radius" cx="${radiusPoint.x}" cy="${radiusPoint.y}" r="16"></circle>
        <circle class="probe ${onCircle ? 'probe--on-circle' : ''}" data-drag="probe" cx="${probe.x}" cy="${probe.y}" r="15"></circle>
      </svg>
      <canvas class="stage__ink" id="ink-canvas" aria-label="考えを書き込む場所"></canvas>
      <p class="stage__hint">${state.activeTool === 'move' ? '黄・青・緑の点を うごかしてみよう。' : 'ペンで しるしや ことばを かこう。'}</p>
    </div>
    <nav class="tool-dock" aria-label="つかうどうぐ"><button aria-pressed="${pressed('move')}" data-action="tool" data-tool="move">うごかす</button><button aria-pressed="${pressed('pen')}" data-action="tool" data-tool="pen">かく</button><button data-action="undo">もどす</button></nav>
    ${state.helpOpen ? renderHelpDialog() : ''}
  </section>`;
}

function renderHelpDialog() {
  return `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"><div class="dialog__panel"><h2 id="help-title">つかいかた</h2><p>「うごかす」で、色のついた点を動かしてみよう。円の大きさや、中心からの長さに目を向けよう。</p><p>見つけたことは、「かく」でしるしや言葉にしよう。</p><button class="primary" data-action="close-help">わかった</button></div></div>`;
}

function renderSummary() {
  return `<section class="app-shell summary"><div class="topbar"><button class="back" data-action="go-work">← もどる</button></div><div class="summary__body"><p class="eyebrow">まとめ</p><h2>分かったことを<br>書こう</h2><p class="prompt">${state.lesson.reflectionPrompt}</p><textarea id="reflection" maxlength="240" placeholder="たとえば、中心から…">${escapeHtml(state.reflection)}</textarea></div><button class="primary" data-action="finish">おわる</button></section>`;
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
  resizeAndDrawInk(canvas);
  state.resizeObserver = new ResizeObserver(() => resizeAndDrawInk(canvas));
  state.resizeObserver.observe(stage);
  if (state.activeTool === 'move') {
    svg.querySelectorAll('[data-drag]').forEach((target) => target.addEventListener('pointerdown', (event) => beginGeometryDrag(event, target.dataset.drag, svg)));
  } else {
    canvas.addEventListener('pointerdown', (event) => beginInkStroke(event, canvas));
  }
}

function pointInBox(event, svg) {
  const rect = svg.getBoundingClientRect();
  return { x: clamp((event.clientX - rect.left) * BOX.width / rect.width, 0, BOX.width), y: clamp((event.clientY - rect.top) * BOX.height / rect.height, 0, BOX.height) };
}

function remember() {
  state.history.push({ geometry: copyGeometry(), strokeCount: state.strokes.length });
  if (state.history.length > 20) state.history.shift();
}

function beginGeometryDrag(event, target, svg) {
  event.preventDefault();
  remember();
  state.pointerSession = { type: 'geometry', target, svg, start: pointInBox(event, svg), geometry: copyGeometry() };
  svg.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', movePointer);
  window.addEventListener('pointerup', endPointer, { once: true });
}

function movePointer(event) {
  const session = state.pointerSession;
  if (!session) return;
  if (session.type === 'ink') { addInkPoint(event, session.canvas); return; }
  const point = pointInBox(event, session.svg);
  const { start, geometry: before } = session;
  if (session.target === 'center' || session.target === 'circle') {
    const vector = { x: before.radiusPoint.x - before.center.x, y: before.radiusPoint.y - before.center.y };
    const radius = Math.hypot(vector.x, vector.y);
    const x = clamp(before.center.x + point.x - start.x, radius + 24, BOX.width - radius - 24);
    const y = clamp(before.center.y + point.y - start.y, radius + 24, BOX.height - radius - 24);
    state.geometry.center = { x, y };
    state.geometry.radiusPoint = { x: x + vector.x, y: y + vector.y };
  } else if (session.target === 'radius') {
    const dx = point.x - before.center.x;
    const dy = point.y - before.center.y;
    const raw = Math.hypot(dx, dy) || 1;
    const max = Math.max(55, Math.min(before.center.x - 24, BOX.width - before.center.x - 24, before.center.y - 24, BOX.height - before.center.y - 24, 250));
    const radius = clamp(raw, 55, max);
    state.geometry.radiusPoint = { x: before.center.x + dx / raw * radius, y: before.center.y + dy / raw * radius };
  } else {
    state.geometry.probe = { x: clamp(point.x, 18, BOX.width - 18), y: clamp(point.y, 18, BOX.height - 18) };
  }
  updateGeometrySvg();
}

function updateGeometrySvg() {
  const svg = document.querySelector('#geometry-svg');
  if (!svg) return;
  const { center, radiusPoint, probe } = state.geometry;
  const radius = distance(center, radiusPoint);
  const onCircle = Math.abs(distance(center, probe) - radius) < 12;
  const guide = svg.querySelector('.guide-line');
  guide.setAttribute('x1', center.x); guide.setAttribute('y1', center.y);
  guide.setAttribute('x2', radiusPoint.x); guide.setAttribute('y2', radiusPoint.y);
  const circle = svg.querySelector('.circle-line');
  circle.setAttribute('cx', center.x); circle.setAttribute('cy', center.y); circle.setAttribute('r', radius);
  const centreHandle = svg.querySelector('.handle--centre');
  centreHandle.setAttribute('cx', center.x); centreHandle.setAttribute('cy', center.y);
  const radiusHandle = svg.querySelector('.handle--radius');
  radiusHandle.setAttribute('cx', radiusPoint.x); radiusHandle.setAttribute('cy', radiusPoint.y);
  const probeElement = svg.querySelector('.probe');
  probeElement.setAttribute('cx', probe.x); probeElement.setAttribute('cy', probe.y);
  probeElement.classList.toggle('probe--on-circle', onCircle);
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
  if (session?.type === 'ink' && session.stroke.length) state.strokes.push(session.stroke);
  state.pointerSession = null;
  window.removeEventListener('pointermove', movePointer);
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
  state.strokes = state.strokes.slice(0, previous.strokeCount);
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
    case 'open-help': state.helpOpen = true; break;
    case 'close-help': state.helpOpen = false; break;
    case 'finish': localStorage.setItem(`geometry-lab:${state.lesson.id}:reflection`, state.reflection); window.alert('まとめを この端末に 保存したよ。'); state.screen = 'home'; break;
    default: return;
  }
  render();
}
render();
