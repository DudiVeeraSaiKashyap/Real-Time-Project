/* ── qr.js — simple QR-style code generator on Canvas ── */

function drawQR(canvas, text, size) {
  size = size || canvas.width;
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const CELLS = 21;
  const cell  = size / CELLS;

  /* deterministic grid from text */
  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h;
  }

  function bit(r, c) {
    /* finder pattern corners */
    function inFinder(r, c) {
      if (r < 7 && c < 7)             return true;
      if (r < 7 && c >= CELLS - 7)    return true;
      if (r >= CELLS - 7 && c < 7)    return true;
      return false;
    }
    function finderDark(r, c) {
      const nr = r < 7 ? r : (r >= CELLS-7 ? r-(CELLS-7) : -1);
      const nc = c < 7 ? c : (c >= CELLS-7 ? c-(CELLS-7) : -1);
      if (nr < 0 || nc < 0) return false;
      return nr===0||nr===6||nc===0||nc===6||(nr>=2&&nr<=4&&nc>=2&&nc<=4);
    }
    if (inFinder(r, c)) return finderDark(r, c);
    /* timing strip */
    if (r === 6 || c === 6) return (r + c) % 2 === 0;
    /* data cells */
    const h1 = hash(text + r);
    const h2 = hash(text + c + 'x');
    return ((h1 ^ h2 ^ (r * 73856093) ^ (c * 19349663)) & 1) === 1;
  }

  /* background */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  /* cells */
  ctx.fillStyle = '#0f1420';
  for (let r = 0; r < CELLS; r++) {
    for (let c = 0; c < CELLS; c++) {
      if (bit(r, c)) {
        ctx.fillRect(
          Math.round(c * cell), Math.round(r * cell),
          Math.ceil(cell), Math.ceil(cell)
        );
      }
    }
  }

  /* quiet zone border hint */
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
}

/* Show QR modal for a book */
function showQRModal(bookId) {
  const book = DB.findBook(bookId);
  if (!book) return;
  document.getElementById('qr-modal-title').textContent = 'QR Code — ' + book.id;
  document.getElementById('qr-modal-name').textContent  = book.title;
  document.getElementById('qr-modal-id').textContent    = book.id;
  const canvas = document.getElementById('qr-canvas');
  drawQR(canvas, book.id, 180);
  openModal('qr-modal');
}

window.drawQR      = drawQR;
window.showQRModal = showQRModal;
