import * as THREE from 'three';
let s = 99;
const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
const mk = n => { const c = document.createElement('canvas'); c.width = c.height = n; return c; };
const hex = (h, v = 0) => { const c = new THREE.Color(h); c.offsetHSL(0, 0, v); return '#' + c.getHexString(); };
const g = v => { const k = Math.max(0, Math.min(255, v | 0)); return `rgb(${k},${k},${k})`; };

function wrapRect(ctx, n, x, y, w, h) { for (const ox of [0, -n, n]) for (const oy of [0, -n, n]) ctx.fillRect(x + ox, y + oy, w, h); }
function wrapEllipse(ctx, n, x, y, rx, ry, rot = 0) { for (const ox of [0, -n, n]) for (const oy of [0, -n, n]) { ctx.beginPath(); ctx.ellipse(x + ox, y + oy, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); } }
function noise(ctx, n, count, size, col, alpha) { ctx.globalAlpha = alpha; for (let i = 0; i < count; i++) { ctx.fillStyle = typeof col === 'function' ? col() : col; const z = size * (0.3 + r()); wrapRect(ctx, n, r() * n, r() * n, z, z); } ctx.globalAlpha = 1; }
function blobs(ctx, n, count, rad, col, alpha) { ctx.globalAlpha = alpha; for (let i = 0; i < count; i++) { ctx.fillStyle = typeof col === 'function' ? col() : col; const q = rad * (0.4 + r()); wrapEllipse(ctx, n, r() * n, r() * n, q, q * (0.5 + r() * 0.8), r() * 3); } ctx.globalAlpha = 1; }
function streaks(ctx, n, count, col, alpha, len = 0.3) { ctx.globalAlpha = alpha; ctx.fillStyle = col; for (let i = 0; i < count; i++) { const x = r() * n, y = r() * n, w = 1 + r() * 3, h = n * len * (0.3 + r()); wrapRect(ctx, n, x, y, w, h); } ctx.globalAlpha = 1; }

function toNormal(hc, str) {
  const n = hc.width, d = hc.getContext('2d').getImageData(0, 0, n, n).data, out = mk(n), oc = out.getContext('2d'), im = oc.createImageData(n, n), o = im.data;
  const H = (x, y) => d[(((y + n) % n) * n + ((x + n) % n)) * 4] / 255;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * str, dy = (H(x, y + 1) - H(x, y - 1)) * str, l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
    o[i] = (-dx / l * 0.5 + 0.5) * 255; o[i + 1] = (dy / l * 0.5 + 0.5) * 255; o[i + 2] = (1 / l * 0.5 + 0.5) * 255; o[i + 3] = 255;
  }
  oc.putImageData(im, 0, 0); return out;
}
function finish(C, H, Rg, str, aniso) {
  const t = (c, srgb) => { const x = new THREE.CanvasTexture(c); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = aniso; if (srgb) x.colorSpace = THREE.SRGBColorSpace; return x; };
  return { map: t(C, true), normalMap: t(toNormal(H, str)), roughnessMap: t(Rg) };
}
function set(n, draw, str = 3) {
  const C = mk(n), H = mk(n), Rg = mk(n); const c = C.getContext('2d'), h = H.getContext('2d'), rg = Rg.getContext('2d');
  draw(c, h, rg, n); return finish(C, H, Rg, str, 8);
}
// rows of blocks (ashlar, brick, slate, planks, tiles)
function bond(c, h, rg, n, o) {
  const rows = o.rows; let y = 0;
  for (let ri = 0; ri < rows; ri++) {
    const rh = n / rows; let xs = []; let sum = 0;
    while (sum < n) { const w = o.minL + r() * (o.maxL - o.minL); xs.push(w); sum += w; }
    const k = n / sum; xs = xs.map(v => v * k); let x = o.stagger ? (ri % 2) * (xs[0] / 2) : r() * n;
    for (const w of xs) {
      const v = (r() - 0.5) * o.var; c.fillStyle = typeof o.col === 'function' ? o.col(v) : hex(o.col, v);
      wrapRect(c, n, x + o.gap / 2, y + o.gap / 2, w - o.gap, rh - o.gap);
      h.fillStyle = g(200 + r() * 40); wrapRect(h, n, x + o.gap / 2, y + o.gap / 2, w - o.gap, rh - o.gap);
      if (o.bevel) { h.fillStyle = g(235); wrapRect(h, n, x + o.gap, y + o.gap, w - o.gap * 2, rh - o.gap * 2); }
      if (o.shade) { c.globalAlpha = 0.35; c.fillStyle = '#000'; wrapRect(c, n, x + o.gap / 2, y + rh - o.gap / 2 - rh * o.shade, w - o.gap, rh * o.shade); c.globalAlpha = 1; h.fillStyle = g(150); wrapRect(h, n, x + o.gap / 2, y + rh - o.gap / 2 - rh * o.shade * 0.6, w - o.gap, rh * o.shade * 0.6); }
      rg.fillStyle = g(o.rough * 255 + (r() - 0.5) * 50); wrapRect(rg, n, x, y, w, rh);
      x += w;
    }
    y += rh;
  }
}
function base(c, h, rg, n, col, hv, rv) { c.fillStyle = col; c.fillRect(0, 0, n, n); h.fillStyle = g(hv); h.fillRect(0, 0, n, n); rg.fillStyle = g(rv); rg.fillRect(0, 0, n, n); }

export function buildTextures() {
  const T = {};
  T.ashlar = set(1024, (c, h, rg, n) => {
    base(c, h, rg, n, '#55524c', 60, 230);
    bond(c, h, rg, n, { rows: 8, minL: 180, maxL: 360, gap: 6, col: 0x7c786f, var: 0.09, rough: 0.55, bevel: true });
    noise(c, n, 9000, 3, () => r() < 0.5 ? '#3f3d39' : '#a29d92', 0.12); noise(h, n, 9000, 3, () => g(r() * 255), 0.08);
    streaks(c, n, 140, '#2a2d2c', 0.12, 0.4); blobs(c, n, 40, 60, '#3d4a35', 0.06);
  }, 4);
  T.rubble = set(1024, (c, h, rg, n) => {
    base(c, h, rg, n, '#2c2a27', 40, 240);
    let y = 0; while (y < n) { const rh = 60 + r() * 70; let x = 0; while (x < n) { const w = 70 + r() * 150; c.fillStyle = hex(0x4c4740, (r() - 0.5) * 0.12); wrapEllipse(c, n, x + w / 2, y + rh / 2, w / 2 - 4, rh / 2 - 4, (r() - 0.5) * 0.2); h.fillStyle = g(190 + r() * 60); wrapEllipse(h, n, x + w / 2, y + rh / 2, w / 2 - 6, rh / 2 - 6, 0); rg.fillStyle = g(120 + r() * 60); wrapEllipse(rg, n, x + w / 2, y + rh / 2, w / 2 - 4, rh / 2 - 4, 0); x += w; } y += rh; }
    noise(c, n, 12000, 3, () => r() < 0.5 ? '#26241f' : '#6c665c', 0.15); blobs(c, n, 70, 50, '#3c5230', 0.12); streaks(c, n, 120, '#1c1f1e', 0.15, 0.5);
  }, 6);
  T.brick = set(512, (c, h, rg, n) => {
    base(c, h, rg, n, '#6e665c', 50, 235);
    bond(c, h, rg, n, { rows: 16, minL: 60, maxL: 64, gap: 4, col: 0x5d3a2f, var: 0.12, rough: 0.6, stagger: true });
    noise(c, n, 5000, 2, '#2b1a16', 0.15); streaks(c, n, 60, '#1f1a18', 0.12);
  }, 4);
  T.clap = set(512, (c, h, rg, n) => {
    base(c, h, rg, n, '#7e8a86', 128, 120);
    for (let i = 0; i < 12; i++) { const y = i * n / 12; const gr = c.createLinearGradient(0, y, 0, y + n / 12); gr.addColorStop(0, '#8a9692'); gr.addColorStop(0.85, '#76827e'); gr.addColorStop(1, '#4a5452'); c.fillStyle = gr; c.fillRect(0, y, n, n / 12); const hg = h.createLinearGradient(0, y, 0, y + n / 12); hg.addColorStop(0, g(90)); hg.addColorStop(0.9, g(200)); hg.addColorStop(1, g(40)); h.fillStyle = hg; h.fillRect(0, y, n, n / 12); }
    streaks(c, n, 80, '#3a4442', 0.08, 0.5); noise(c, n, 1500, 2, '#c8cfcb', 0.05);
  }, 3);
  const slate = moss => set(1024, (c, h, rg, n) => {
    base(c, h, rg, n, '#15181b', 40, 90);
    bond(c, h, rg, n, { rows: 16, minL: 60, maxL: 90, gap: 3, col: v => hex(0x2b3138, v), var: 0.1, rough: 0.28, shade: 0.12 });
    noise(c, n, 4000, 2, '#4a525a', 0.1);
    if (moss) { blobs(c, n, 220, 28, () => r() < 0.5 ? '#3c5530' : '#566a35', 0.35); blobs(rg, n, 220, 28, g(230), 0.4); }
  }, 3);
  T.slate = slate(false); T.slateMoss = slate(true);
  const planks = (col, w, rough) => set(1024, (c, h, rg, n) => {
    base(c, h, rg, n, '#1a120c', 50, 160);
    const cols = Math.round(n / w); for (let i = 0; i < cols; i++) { let y = r() * n; const x = i * w; for (let k = 0; k < 3; k++) { const L = n / 3; c.fillStyle = hex(col, (r() - 0.5) * 0.1); wrapRect(c, n, x + 1, y, w - 2, L - 2); h.fillStyle = g(200); wrapRect(h, n, x + 1, y, w - 2, L - 2); y += L; } c.globalAlpha = 0.18; for (let j = 0; j < 14; j++) { c.fillStyle = r() < 0.5 ? '#000' : '#d8b080'; wrapRect(c, n, x + 2 + r() * (w - 4), 0, 1, n); } c.globalAlpha = 1; }
    noise(rg, n, 3000, 4, () => g(rough * 255 + (r() - 0.5) * 60), 0.5);
  }, 2);
  T.parquet = planks(0x6a4126, 64, 0.35); T.floorboard = planks(0x5c4a38, 96, 0.6); T.attic = planks(0x6b5a46, 110, 0.8);
  T.oak = set(512, (c, h, rg, n) => {
    base(c, h, rg, n, '#3a281b', 120, 110);
    c.globalAlpha = 0.25; for (let i = 0; i < 260; i++) { c.fillStyle = r() < 0.5 ? '#1f150e' : '#5a3e28'; const x = r() * n; wrapRect(c, n, x, 0, 1 + r() * 2, n); } c.globalAlpha = 1;
    const pw = n / 2; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { h.fillStyle = g(90); h.fillRect(i * pw, j * pw, pw, pw); h.fillStyle = g(150); h.fillRect(i * pw + 24, j * pw + 24, pw - 48, pw - 48); c.globalAlpha = 0.2; c.fillStyle = '#000'; c.fillRect(i * pw + 20, j * pw + 20, pw - 40, 5); c.globalAlpha = 1; }
  }, 4);
  T.wood = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#4a3424', 128, 100); c.globalAlpha = 0.3; for (let i = 0; i < 220; i++) { c.fillStyle = r() < 0.5 ? '#2a1b10' : '#6b4b33'; wrapRect(c, n, r() * n, 0, 1 + r() * 2, n); } c.globalAlpha = 1; noise(h, n, 2000, 2, () => g(100 + r() * 60), 0.2); }, 1.5);
  T.weathered = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#4b4640', 128, 200); c.globalAlpha = 0.35; for (let i = 0; i < 260; i++) { c.fillStyle = r() < 0.5 ? '#2a2622' : '#6d675e'; wrapRect(c, n, r() * n, 0, 1 + r() * 2, n); } c.globalAlpha = 1; for (let x = 0; x < n; x += 64) { c.fillStyle = '#1a1714'; c.fillRect(x, 0, 3, n); h.fillStyle = g(30); h.fillRect(x, 0, 3, n); } }, 3);
  T.plaster = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#cbc3b2', 128, 220); blobs(c, n, 80, 60, () => r() < 0.5 ? '#bdb4a2' : '#d6cfbf', 0.2); noise(h, n, 6000, 2, () => g(110 + r() * 40), 0.3); }, 1);
  const paper = (bg, fg, kind) => set(512, (c, h, rg, n) => {
    base(c, h, rg, n, bg, 128, 210); c.fillStyle = fg;
    if (kind === 'stripe') { for (let x = 0; x < n; x += 64) { c.globalAlpha = 0.5; c.fillRect(x, 0, 18, n); c.globalAlpha = 0.25; c.fillRect(x + 26, 0, 4, n); } }
    else if (kind === 'damask') { c.globalAlpha = 0.45; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 128 + (j % 2) * 64 + 64, y = j * 128 + 64; c.beginPath(); c.moveTo(x, y - 46); c.quadraticCurveTo(x + 40, y, x, y + 46); c.quadraticCurveTo(x - 40, y, x, y - 46); c.fill(); c.beginPath(); c.arc(x, y, 10, 0, 7); c.fill(); } }
    else { c.globalAlpha = 0.5; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const x = i * 64 + (j % 2) * 32 + 16, y = j * 64 + 32; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); c.fillRect(x - 1, y + 6, 2, 12); } }
    c.globalAlpha = 1; noise(c, n, 2000, 3, '#000', 0.04); blobs(c, n, 10, 80, '#5a4a30', 0.05);
  }, 0.6);
  T.paperGreen = paper('#3e4f40', '#6e7f60', 'damask'); T.paperRed = paper('#5a2424', '#7e3a32', 'damask'); T.paperBlue = paper('#3a4a5a', '#5f7385', 'stripe');
  T.paperRose = paper('#8a6a64', '#a68680', 'floral'); T.paperCream = paper('#b8ab8c', '#9a8d6e', 'floral'); T.paperOchre = paper('#8a7340', '#a68d55', 'stripe'); T.paperTeal = paper('#2f4a4a', '#4e6a66', 'damask');
  T.marble = set(1024, (c, h, rg, n) => {
    const k = 8, w = n / k; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { const dark = (i + j) % 2; c.fillStyle = dark ? '#1b1c1e' : '#d8d4cb'; c.fillRect(i * w, j * w, w, w); h.fillStyle = g(200); h.fillRect(i * w + 2, j * w + 2, w - 4, w - 4); rg.fillStyle = g(30 + r() * 30); rg.fillRect(i * w, j * w, w, w); }
    c.globalAlpha = 0.25; c.strokeStyle = '#7d7a74'; for (let i = 0; i < 60; i++) { c.lineWidth = 1 + r() * 2; c.beginPath(); let x = r() * n, y = r() * n; c.moveTo(x, y); for (let t = 0; t < 6; t++) { x += (r() - 0.5) * 120; y += r() * 80; c.lineTo(x, y); } c.stroke(); } c.globalAlpha = 1;
    h.fillStyle = g(60); for (let i = 0; i <= k; i++) { h.fillRect(i * w - 1, 0, 2, n); h.fillRect(0, i * w - 1, n, 2); }
  }, 2);
  T.quarry = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#3a2a22', 60, 200); bond(c, h, rg, n, { rows: 8, minL: 64, maxL: 64, gap: 5, col: 0x8a4a32, var: 0.12, rough: 0.5 }); noise(c, n, 3000, 3, '#2a1a12', 0.12); }, 3);
  T.whiteTile = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#9a978e', 60, 120); bond(c, h, rg, n, { rows: 16, minL: 64, maxL: 64, gap: 3, col: 0xdedbd2, var: 0.03, rough: 0.12, stagger: true }); }, 2);
  T.flag = set(1024, (c, h, rg, n) => { base(c, h, rg, n, '#2e2d2a', 50, 200); bond(c, h, rg, n, { rows: 5, minL: 150, maxL: 320, gap: 8, col: 0x5a5852, var: 0.12, rough: 0.35 }); noise(c, n, 9000, 3, () => r() < 0.5 ? '#3b3a35' : '#77746b', 0.15); blobs(c, n, 50, 50, '#33402c', 0.12); blobs(rg, n, 60, 50, g(30), 0.5); }, 4);
  T.gravel = set(1024, (c, h, rg, n) => { base(c, h, rg, n, '#4a4741', 120, 170); for (let i = 0; i < 26000; i++) { const v = r(); c.fillStyle = hex(v < 0.3 ? 0x6e6a62 : v < 0.6 ? 0x56524b : v < 0.85 ? 0x7b766c : 0x3a3732, 0); h.fillStyle = g(150 + r() * 100); const x = r() * n, y = r() * n, z = 2 + r() * 4; wrapEllipse(c, n, x, y, z, z * 0.7); wrapEllipse(h, n, x, y, z * 0.8, z * 0.6); } blobs(rg, n, 50, 70, g(40), 0.5); }, 3);
  T.grass = set(1024, (c, h, rg, n) => { base(c, h, rg, n, '#33452b', 120, 200); c.globalAlpha = 0.5; for (let i = 0; i < 30000; i++) { c.fillStyle = r() < 0.5 ? '#2a3a24' : r() < 0.5 ? '#46593a' : '#56683f'; const x = r() * n, y = r() * n; c.fillRect(x, y, 1.5, 4 + r() * 6); } c.globalAlpha = 1; blobs(c, n, 30, 120, '#3d4a2a', 0.15); blobs(c, n, 20, 60, '#5a5a32', 0.1); noise(h, n, 20000, 2, () => g(r() * 255), 0.3); }, 1.5);
  T.mud = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#352c22', 120, 120); blobs(c, n, 200, 30, () => r() < 0.5 ? '#2a221a' : '#43382b', 0.4); blobs(rg, n, 120, 40, () => g(r() < 0.5 ? 20 : 200), 0.6); blobs(h, n, 150, 30, () => g(r() * 255), 0.4); }, 3);
  T.concrete = set(1024, (c, h, rg, n) => { base(c, h, rg, n, '#6c6a65', 128, 180); noise(c, n, 20000, 2, () => r() < 0.5 ? '#5a5853' : '#7d7a74', 0.25); blobs(c, n, 18, 90, '#26221d', 0.35); blobs(rg, n, 18, 90, g(40), 0.6); c.fillStyle = '#4a4844'; for (let i = 1; i < 4; i++) { c.fillRect(i * n / 4, 0, 2, n); c.fillRect(0, i * n / 4, n, 2); h.fillStyle = g(60); h.fillRect(i * n / 4, 0, 2, n); h.fillRect(0, i * n / 4, n, 2); } }, 2);
  T.copper = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#4f8f80', 128, 110); blobs(c, n, 160, 40, () => ['#5fa392', '#3f7a6c', '#6a5a3a', '#7ab3a2'][(r() * 4) | 0], 0.35); streaks(c, n, 90, '#2f5a50', 0.25, 0.6); for (let y = 0; y < n; y += 64) { h.fillStyle = g(60); h.fillRect(0, y, n, 3); } }, 3);
  T.bark = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#3a2c24', 128, 230); for (let i = 0; i < 300; i++) { const x = r() * n, w = 3 + r() * 8; c.fillStyle = r() < 0.5 ? '#271d18' : '#4d3b30'; wrapRect(c, n, x, 0, w, n); h.fillStyle = g(r() * 255); wrapRect(h, n, x, 0, w, n); } blobs(c, n, 30, 40, '#3e5230', 0.2); }, 6);
  T.soil = set(512, (c, h, rg, n) => { base(c, h, rg, n, '#231b15', 120, 230); noise(c, n, 15000, 3, () => r() < 0.5 ? '#16100c' : '#3a2c20', 0.4); noise(h, n, 15000, 3, () => g(r() * 255), 0.5); }, 4);
  T.carpetRed = rug('#5a1e1e', '#2a1a1e', '#b08a4a'); T.carpetBlue = rug('#1e2e4a', '#141a28', '#a89060'); T.carpetGreen = rug('#2a3a2a', '#1a2418', '#9a8a5a');
  return T;
}
function rug(a, b, cg) {
  const n = 512, C = mk(n), H = mk(n), Rg = mk(n), c = C.getContext('2d');
  c.fillStyle = b; c.fillRect(0, 0, n, n); c.fillStyle = a; c.fillRect(30, 30, n - 60, n - 60); c.strokeStyle = cg; c.lineWidth = 6; c.strokeRect(44, 44, n - 88, n - 88); c.lineWidth = 2; c.strokeRect(60, 60, n - 120, n - 120);
  c.fillStyle = cg; c.globalAlpha = 0.6; c.beginPath(); c.ellipse(n / 2, n / 2, 110, 70, 0, 0, 7); c.fill(); c.fillStyle = b; c.beginPath(); c.ellipse(n / 2, n / 2, 80, 48, 0, 0, 7); c.fill();
  for (let i = 0; i < 10; i++) { c.fillStyle = cg; c.fillRect(70 + i * 38, 70, 14, 14); c.fillRect(70 + i * 38, n - 84, 14, 14); }
  c.globalAlpha = 0.1; for (let i = 0; i < 4000; i++) { c.fillStyle = r() < 0.5 ? '#000' : '#fff'; c.fillRect(r() * n, r() * n, 2, 2); } c.globalAlpha = 1;
  const h = H.getContext('2d'); h.fillStyle = g(128); h.fillRect(0, 0, n, n); const rg = Rg.getContext('2d'); rg.fillStyle = g(250); rg.fillRect(0, 0, n, n);
  const t = finish(C, H, Rg, 0.5, 8); t.map.wrapS = t.map.wrapT = THREE.ClampToEdgeWrapping; t.rugUV = true; return t;
}
// special-purpose textures
export function canvasTex(n, draw, srgb = true, w) { const c = document.createElement('canvas'); c.width = w || n; c.height = n; draw(c.getContext('2d'), c.width, c.height); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
export function painting(kind) {
  return canvasTex(256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, kind === 'land' ? '#4a5560' : '#2a2018'); gr.addColorStop(1, kind === 'land' ? '#2a3020' : '#120c08'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    if (kind === 'land') { c.fillStyle = '#1e2618'; c.beginPath(); c.moveTo(0, h * 0.7); for (let x = 0; x <= w; x += 16) c.lineTo(x, h * (0.55 + 0.1 * Math.sin(x * 0.05) + r() * 0.05)); c.lineTo(w, h); c.lineTo(0, h); c.fill(); c.fillStyle = '#c8b890'; c.globalAlpha = 0.3; c.beginPath(); c.arc(w * 0.7, h * 0.3, 20, 0, 7); c.fill(); }
    else { c.fillStyle = kind === 'lady' ? '#3a2830' : '#1c1814'; c.beginPath(); c.ellipse(w / 2, h * 0.95, w * 0.38, h * 0.4, 0, Math.PI, 0); c.fill(); c.fillStyle = '#a08068'; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(w / 2, h * 0.38, w * 0.13, h * 0.17, 0, 0, 7); c.fill(); c.globalAlpha = 1; c.fillStyle = kind === 'lady' ? '#2a1a14' : '#3a3632'; c.beginPath(); c.ellipse(w / 2, h * 0.27, w * 0.15, h * 0.1, 0, Math.PI, 0); c.fill(); }
    c.globalAlpha = 0.15; for (let i = 0; i < 2000; i++) { c.fillStyle = r() < 0.5 ? '#000' : '#a08a60'; c.fillRect(r() * w, r() * h, 1, 1); } c.globalAlpha = 1;
  });
}
export function chart() { return canvasTex(256, (c, w, h) => { c.fillStyle = '#c9b88e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#4a3a20'; c.globalAlpha = 0.6; c.beginPath(); c.arc(w / 2, h / 2, w * 0.42, 0, 7); c.stroke(); for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(i / 12 * 6.283) * w * 0.42, h / 2 + Math.sin(i / 12 * 6.283) * h * 0.42); c.stroke(); } c.fillStyle = '#2a2010'; for (let i = 0; i < 90; i++) { c.beginPath(); c.arc(r() * w, r() * h, r() * 2 + 0.5, 0, 7); c.fill(); } c.globalAlpha = 1; }); }
export function grime() { return canvasTex(64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(15,14,10,0)'); gr.addColorStop(1, 'rgba(15,14,10,0.75)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }, true); }
export function rainStreak() { return canvasTex(128, (c, w, h) => { for (let i = 0; i < 26; i++) { const x = r() * w, ww = 1 + r() * 4; const gr = c.createLinearGradient(0, 0, 0, h * (0.4 + r() * 0.6)); gr.addColorStop(0, 'rgba(10,12,12,0.55)'); gr.addColorStop(1, 'rgba(10,12,12,0)'); c.fillStyle = gr; c.fillRect(x, 0, ww, h); } }, true, 64); }
export function paneDirt() { return canvasTex(128, (c, w, h) => { c.fillStyle = 'rgba(200,215,210,0.16)'; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(70,72,60,0.65)'); gr.addColorStop(0.3, 'rgba(90,95,85,0.2)'); gr.addColorStop(1, 'rgba(200,215,210,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(60,62,55,0.5)'; c.lineWidth = 6; c.strokeRect(0, 0, w, h); for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(230,240,240,${0.1 + r() * 0.2})`; c.beginPath(); c.arc(r() * w, r() * h, r() * 2.5, 0, 7); c.fill(); } for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(230,240,240,0.18)'; c.fillRect(r() * w, r() * h * 0.6, 1.5, 10 + r() * 40); } }, true); }
export function flowTex() { return canvasTex(64, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(220,235,240,${0.15 + r() * 0.4})`; c.fillRect(r() * w, r() * h, 1 + r() * 2, 6 + r() * 20); } }, true); }
export function sheet() { return canvasTex(128, (c, w, h) => { c.fillStyle = '#cfcabc'; c.fillRect(0, 0, w, h); c.globalAlpha = 0.2; for (let i = 0; i < 20; i++) { c.fillStyle = '#8a8474'; c.fillRect(r() * w, 0, 2 + r() * 6, h); } c.globalAlpha = 1; }); }
