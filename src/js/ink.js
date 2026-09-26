/* 手書きレイヤー（Canvas）。図形のSVGの上に重ねるだけで、
   書いた線を図形として認識・補正はしない（引き継ぎ書§5.2）。 */

function beginInkStroke(e, c) {
  e.preventDefault();
  remember();
  const st = [];
  const add = x => {
    const r = c.getBoundingClientRect();
    st.push({ x: x.clientX - r.left, y: x.clientY - r.top });
    drawInk(c, st);
  };
  add(e);
  if (c.setPointerCapture) c.setPointerCapture(e.pointerId);
  const move = x => add(x);
  const up = () => {
    state.strokes.push(st);
    window.removeEventListener('pointermove', move);
    render();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up, { once: true });
}

function resizeAndDrawInk(c) {
  const s = devicePixelRatio || 1;
  const r = c.getBoundingClientRect();
  c.width = Math.max(1, r.width * s);
  c.height = Math.max(1, r.height * s);
  c.getContext('2d').setTransform(s, 0, 0, s, 0, 0);
  drawInk(c);
}

function drawInk(c, current = []) {
  const x = c.getContext('2d');
  const r = c.getBoundingClientRect();
  x.clearRect(0, 0, r.width, r.height);
  x.lineCap = 'round';
  x.lineWidth = 4;
  x.strokeStyle = '#24343b';
  [...state.strokes, current].forEach(st => {
    if (!st.length) return;
    x.beginPath();
    st.forEach((p, i) => (i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)));
    x.stroke();
  });
}
