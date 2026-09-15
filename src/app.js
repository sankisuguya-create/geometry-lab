const lessons = [
  {
    id: 'circle-01',
    title: '円のひみつ 1',
    meta: '中心からの長さを見つけよう',
    prompt: '円の上の点は、中心からどんなところにあるかな。',
    reflectionPrompt: '円の上の点について、分かったことを書こう。',
  },
];

const app = document.querySelector('#app');
const state = {
  screen: 'home',
  lesson: lessons[0],
  activeTool: 'move',
  reflection: '',
  helpOpen: false,
};

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function render() {
  const view = {
    home: renderHome,
    intro: renderIntro,
    work: renderWork,
    summary: renderSummary,
  }[state.screen];
  app.innerHTML = view();
  bindEvents();
}

function renderHome() {
  const cards = lessons.map((lesson) => `
    <button class="lesson-card" data-action="open-lesson" data-lesson-id="${lesson.id}">
      <span class="lesson-card__icon" aria-hidden="true">○</span>
      <span class="lesson-card__title">${lesson.title}</span>
      <span class="lesson-card__meta">${lesson.meta}</span>
    </button>`).join('');

  return `
    <section class="app-shell home">
      <div>
        <p class="eyebrow">さんすう</p>
        <h1>図形のへんしん<br>実験室</h1>
        <p class="lead">うごかして、みつけよう。</p>
      </div>
      <div aria-label="学習をえらぶ">${cards}</div>
    </section>`;
}

function renderIntro() {
  return `
    <section class="app-shell intro">
      <div class="topbar">
        <button class="back" data-action="go-home">← もどる</button>
      </div>
      <div class="intro__body">
        <p class="eyebrow">さんすう　円</p>
        <h2>${state.lesson.title}</h2>
        <p class="prompt">${state.lesson.prompt}</p>
      </div>
      <button class="primary" data-action="start-work">はじめる</button>
    </section>`;
}

function renderWork() {
  const pressed = (tool) => tool === state.activeTool ? 'true' : 'false';
  return `
    <section class="app-shell work">
      <div class="topbar">
        <button class="back" data-action="go-intro">← もどる</button>
        <div class="topbar__actions">
          <button class="next" data-action="go-summary">まとめへ</button>
          <button class="help" aria-label="つかいかた" data-action="open-help">?</button>
        </div>
      </div>
      <p class="work__question">${state.lesson.prompt}</p>
      <div class="stage" aria-label="図形をためす場所">
        <div class="stage__circle" aria-hidden="true"></div>
        <div class="stage__centre" aria-hidden="true"></div>
        <p class="stage__note">ここで図形をうごかして、見つけたことを考えるよ。</p>
      </div>
      <nav class="tool-dock" aria-label="つかうどうぐ">
        <button aria-pressed="${pressed('move')}" data-action="tool" data-tool="move">うごかす</button>
        <button aria-pressed="${pressed('pen')}" data-action="tool" data-tool="pen">かく</button>
        <button data-action="reset">もどす</button>
      </nav>
      ${state.helpOpen ? renderHelpDialog() : ''}
    </section>`;
}

function renderHelpDialog() {
  return `
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class="dialog__panel">
        <h2 id="help-title">つかいかた</h2>
        <p>下の「うごかす」をえらんで、図形をさわってみよう。分かったことは「かく」でしるしをつけよう。</p>
        <button class="primary" data-action="close-help">わかった</button>
      </div>
    </div>`;
}

function renderSummary() {
  return `
    <section class="app-shell summary">
      <div class="topbar">
        <button class="back" data-action="go-work">← もどる</button>
      </div>
      <div class="summary__body">
        <p class="eyebrow">まとめ</p>
        <h2>分かったことを<br>書こう</h2>
        <p class="prompt">${state.lesson.reflectionPrompt}</p>
        <textarea id="reflection" maxlength="240" placeholder="たとえば、中心から…">${escapeHtml(state.reflection)}</textarea>
      </div>
      <button class="primary" data-action="finish">おわる</button>
    </section>`;
}

function bindEvents() {
  app.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', () => handleAction(element.dataset));
  });
  const reflection = document.querySelector('#reflection');
  if (reflection) reflection.addEventListener('input', (event) => { state.reflection = event.target.value; });
}

function handleAction(dataset) {
  switch (dataset.action) {
    case 'open-lesson':
      state.lesson = lessons.find((lesson) => lesson.id === dataset.lessonId) ?? lessons[0];
      state.screen = 'intro';
      break;
    case 'go-home': state.screen = 'home'; break;
    case 'go-intro': state.screen = 'intro'; break;
    case 'start-work': state.screen = 'work'; break;
    case 'go-work': state.screen = 'work'; break;
    case 'go-summary': state.screen = 'summary'; break;
    case 'tool': state.activeTool = dataset.tool; break;
    case 'reset': state.activeTool = 'move'; break;
    case 'open-help': state.helpOpen = true; break;
    case 'close-help': state.helpOpen = false; break;
    case 'finish':
      window.alert('まとめを保存しました。');
      state.screen = 'home';
      break;
    default: return;
  }
  render();
}

render();
