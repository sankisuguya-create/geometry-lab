/* 画面シェル：遷移（ホーム→導入→実験→まとめ）、共通の頭・操作帯、
   ボタンの data-action の振り分け。モジュール固有の中身は circle.js / sphere.js。 */

const app = () => document.querySelector('#app');

function render() {
  app().innerHTML = {
    home: renderHome,
    intro: renderIntro,
    work: renderWork,
    summary: renderSummary,
  }[state.screen]();
  bindEvents();
}

function renderHome() {
  return `<section class="app-shell home">
    <div>
      <p class="eyebrow">さんすう</p>
      <h1>図形のへんしん<br>実験室</h1>
      <p class="lead">うごかして、みつけよう。</p>
    </div>
    <div class="lesson-grid">${lessons.map(l => `
      <button class="lesson-card" data-action="open-lesson" data-lesson-id="${l.id}">
        <span class="lesson-card__icon">${l.module === 'sphere' ? '●' : '○'}</span>
        <span class="lesson-card__title">${l.title}</span>
        <span class="lesson-card__meta">${l.meta}</span>
      </button>`).join('')}
    </div>
  </section>`;
}

function renderIntro() {
  return `<section class="app-shell intro">
    <div class="topbar"><button class="back" data-action="go-home">← もどる</button></div>
    <div class="intro__body">
      <p class="eyebrow">さんすう　円と球</p>
      <h2>${state.lesson.title}</h2>
      <p class="prompt">${state.lesson.prompt}</p>
    </div>
    <button class="primary" data-action="start-work">はじめる</button>
  </section>`;
}

function workHeader() {
  return `<div class="topbar">
      <button class="back" data-action="go-intro">← もどる</button>
      <div class="topbar__actions">
        <button class="next" data-action="save-png">ほぞん</button>
        <button class="next" data-action="go-summary">まとめへ</button>
        <button class="help" data-action="open-help">?</button>
      </div>
    </div>
    <p class="work__question">${state.lesson.prompt}</p>`;
}

function renderWork() {
  return state.lesson.module === 'sphere' ? renderSphereWork() : renderCircleWork();
}

function helpDialog() {
  return state.helpOpen
    ? `<div class="dialog"><div class="dialog__panel">
        <h2>つかいかた</h2>
        <p>${state.lesson.help}</p>
        <button class="primary" data-action="close-help">わかった</button>
      </div></div>`
    : '';
}

function renderSummary() {
  return `<section class="app-shell summary">
    <div class="topbar"><button class="back" data-action="go-work">← もどる</button></div>
    <div class="summary__body">
      <p class="eyebrow">まとめ</p>
      <h2>分かったことを<br>書こう</h2>
      <p class="prompt">${state.lesson.reflectionPrompt}</p>
      <textarea id="reflection" maxlength="240" placeholder="たとえば、中心から…">${esc(state.reflection)}</textarea>
    </div>
    <div class="summary__actions"><button class="primary" data-action="finish">おわる</button></div>
  </section>`;
}

function bindEvents() {
  app().querySelectorAll('[data-action]').forEach(el =>
    el.addEventListener('click', () => handleAction(el.dataset)));
  const r = document.querySelector('#reflection');
  if (r) r.addEventListener('input', e => { state.reflection = e.target.value; });
  if (state.screen === 'work') setupWorkSurface();
}

function setupWorkSurface() {
  if (state.lesson.module === 'sphere') {
    setupSphere();
    return;
  }
  setupCircle();
}

function handleAction(d) {
  switch (d.action) {
    case 'open-lesson':
      resetWorkState(lessons.find(l => l.id === d.lessonId) || lessons[0]);
      state.screen = 'intro';
      break;
    case 'go-home': state.screen = 'home'; break;
    case 'go-intro': state.screen = 'intro'; break;
    case 'start-work': state.screen = 'work'; break;
    case 'go-work': state.screen = 'work'; break;
    case 'go-summary': state.screen = 'summary'; break;
    case 'tool': state.activeTool = d.tool; break;
    case 'stamp-shadow': stampShadow(); return;
    case 'save-png': savePng(); return;
    case 'undo': undo(); return;
    case 'open-help': state.helpOpen = true; break;
    case 'close-help': state.helpOpen = false; break;
    case 'finish': state.screen = 'home'; break;
    default: return;
  }
  render();
}
