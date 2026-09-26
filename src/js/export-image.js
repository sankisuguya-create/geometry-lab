/* 図形と手書きを1枚のPNGとして保存。いま出ているSVGをそのまま写すので、
   点・棒・球の見た目が紙そのまま残る（docs/spec にある Phase 3 の保存）。 */
function savePng() {
  const svg = document.querySelector('#stage svg');
  if (!svg) return;
  const ink = document.querySelector('#ink-canvas');
  const r = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true);
  clone.setAttribute('width', r.width);
  clone.setAttribute('height', r.height);
  /* 単体の画像にするので、CSSから計算した色・線を属性として書き写す */
  const src = svg.querySelectorAll('*');
  const dst = clone.querySelectorAll('*');
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    for (const p of ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap',
      'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'filter']) {
      dst[i].setAttribute(p, cs.getPropertyValue(p));
    }
  });
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    const sc = 2;
    cv.width = r.width * sc;
    cv.height = r.height * sc;
    const x = cv.getContext('2d');
    const bg = getComputedStyle(svg.parentElement).backgroundColor;
    x.fillStyle = (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') ? '#f7f5ef' : bg;
    x.fillRect(0, 0, cv.width, cv.height);
    x.drawImage(img, 0, 0, cv.width, cv.height);
    if (ink) x.drawImage(ink, 0, 0, cv.width, cv.height);
    cv.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = state.lesson.id + '.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    });
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
}
