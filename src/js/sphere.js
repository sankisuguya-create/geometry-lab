/* 球モジュール：模様つきの球を指で回し、向きごとの「かげ」を
   色違いスタンプとして集める実験。 */

/* 球面上の模様（単位球の方向ベクトル）。回転で見え方が変わる目印 */
const sphereFeatures = [
  [-0.72, -0.35, 0.60], [-0.28, -0.62, 0.73], [0.20, -0.48, 0.85], [0.64, -0.28, 0.72],
  [-0.54, 0.12, 0.83], [-0.08, 0.02, 0.99], [0.48, 0.12, 0.87], [-0.72, 0.48, 0.50],
  [-0.25, 0.54, 0.80], [0.28, 0.58, 0.76], [0.70, 0.40, 0.58], [0.05, 0.78, 0.55],
];

/* スタンプの色は回収順にぐるっと巡回する */
const stampColors = ['#ff4f87', '#6c5ce7', '#00a884', '#ff8a00', '#1687d9', '#d23fb8'];

function renderSphereWork() {
  const features = sphereFeatures
    .map((v, i) => `<circle class="sphere-feature sphere-feature--${i % 3}" data-vector="${v.join(',')}" r="18"/>`)
    .join('');
  const stamps = state.stamps
    .map((s, i) => `<div class="shadow-stamp" style="--stamp:${s.color}" aria-label="${i + 1}このかげ"><span>${i + 1}</span></div>`)
    .join('');
  return `<section class="app-shell work sphere-work">
    ${workHeader()}
    <div class="sphere-stage" id="stage">
      <svg class="sphere-svg" id="sphere-svg" viewBox="0 0 ${BOX.width} ${BOX.height}" role="img" aria-label="指で回せる、模様と陰影のある球">
        <defs>
          <radialGradient id="ball-light" cx="30%" cy="22%" r="78%">
            <stop offset="0" stop-color="#fff9c9"/>
            <stop offset=".2" stop-color="#71e1d0"/>
            <stop offset=".62" stop-color="#168fa2"/>
            <stop offset="1" stop-color="#073852"/>
          </radialGradient>
          <radialGradient id="shine" cx="32%" cy="25%" r="70%">
            <stop offset="0" stop-color="#fff" stop-opacity=".88"/>
            <stop offset=".25" stop-color="#fff" stop-opacity=".12"/>
            <stop offset=".75" stop-color="#001d35" stop-opacity="0"/>
            <stop offset="1" stop-color="#001322" stop-opacity=".72"/>
          </radialGradient>
          <filter id="blur"><feGaussianBlur stdDeviation="10"/></filter>
          <clipPath id="ball-clip"><circle cx="350" cy="208" r="142"/></clipPath>
        </defs>
        <ellipse class="ball-shadow" cx="370" cy="382" rx="150" ry="27" filter="url(#blur)"/>
        <circle class="ball-base" cx="350" cy="208" r="142"/>
        <g clip-path="url(#ball-clip)">${features}<path class="sphere-band" id="sphere-band"/></g>
        <circle class="ball-shading" cx="350" cy="208" r="142"/>
        <ellipse class="ball-glint" cx="304" cy="154" rx="34" ry="21" transform="rotate(-35 304 154)"/>
        <path class="turn-arrow" d="M190 100 C250 34 446 28 516 98"/>
        <path class="turn-arrow-head" d="m501 77 18 22-28 5"/>
      </svg>
      <p class="sphere-instruction"><strong>ゆびで ぐるぐる</strong><span>模様のうごきを見よう</span></p>
      <div class="stamp-tray">
        <p>あつめた かげ <strong>${state.stamps.length}こ</strong></p>
        <div class="stamp-list">${stamps || '<span class="stamp-empty">まだないよ</span>'}</div>
      </div>
    </div>
    <nav class="tool-dock">
      <button aria-pressed="true" data-action="tool" data-tool="move">まわす</button>
      <button class="stamp-action" data-action="stamp-shadow">かげをスタンプ</button>
      <button data-action="undo">もどす</button>
    </nav>
    ${helpDialog()}
  </section>`;
}

function setupSphere() {
  const svg = document.querySelector('#sphere-svg');
  updateSphereVisual();
  let last = null;
  let moved = false;
  svg.addEventListener('pointerdown', e => {
    e.preventDefault();
    remember();
    last = { x: e.clientX, y: e.clientY };
    moved = false;
    if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', e => {
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
    state.sphere.yaw += dx * 0.012;
    state.sphere.pitch = clamp(state.sphere.pitch - dy * 0.009, -1.15, 1.15);
    last = { x: e.clientX, y: e.clientY };
    updateSphereVisual();
  });
  const end = () => {
    last = null;
    if (moved) render();
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
}

function rotateVector([x, y, z]) {
  const cy = Math.cos(state.sphere.yaw);
  const sy = Math.sin(state.sphere.yaw);
  const cp = Math.cos(state.sphere.pitch);
  const sp = Math.sin(state.sphere.pitch);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}

function updateSphereVisual() {
  document.querySelectorAll('.sphere-feature').forEach(el => {
    const [x, y, z] = rotateVector(el.dataset.vector.split(',').map(Number));
    const depth = clamp((z + 1) / 2, 0, 1);
    el.setAttribute('cx', 350 + x * 132);
    el.setAttribute('cy', 208 + y * 132);
    el.setAttribute('r', 10 + depth * 16);
    el.style.opacity = z < -0.12 ? 0 : (0.35 + depth * 0.65);
  });
  const points = [];
  for (let i = 0; i <= 44; i++) {
    const a = i / 44 * Math.PI * 2;
    const v = rotateVector([Math.cos(a), 0, Math.sin(a)]);
    if (v[2] > -0.05) points.push(`${points.length ? 'L' : 'M'} ${350 + v[0] * 139} ${208 + v[1] * 139}`);
  }
  const band = document.querySelector('#sphere-band');
  if (band) band.setAttribute('d', points.join(' '));
}

function stampShadow() {
  remember();
  const color = stampColors[state.stamps.length % stampColors.length];
  state.stamps.push({ yaw: state.sphere.yaw, pitch: state.sphere.pitch, color });
  if (state.stamps.length > 12) state.stamps.shift();
  render();
}
