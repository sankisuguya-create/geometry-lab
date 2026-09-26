/* 共通の道具：論理座標の大きさ・計算・HTMLエスケープ */

/* 作業領域の論理座標。SVGのviewBoxと指の位置変換はこの大きさを正にする */
const BOX = { width: 700, height: 460 };

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function esc(s) {
  return String(s).replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[c]));
}
