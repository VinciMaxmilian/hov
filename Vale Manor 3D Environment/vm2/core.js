import * as THREE from 'three';
import { buildTextures } from './tex.js';
export { THREE };
export const PI = Math.PI;
let seed = 1874;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const R = (a, b) => a + (b - a) * rnd();
export const pick = a => a[(rnd() * a.length) | 0];
const counts = {};
export const uniq = n => { counts[n] = (counts[n] || 0) + 1; return counts[n] === 1 ? n : n + '_' + counts[n]; };
export const colliders = [], walkables = [], rooms = [], voids = [], outdoorMats = [], glassMeshes = [], trunks = [], animators = [], interiorGroups = [];
export const IA = { value: 0.25 };

// ---------- materials ----------
export const M = {};
let T;
function interiorize(m) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uIA = IA;
    sh.fragmentShader = 'uniform float uIA;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>', 'irradiance *= uIA;\n#if defined( RE_IndirectSpecular )\nradiance *= uIA;\n#endif\n#include <lights_fragment_end>');
  };
  m.customProgramCacheKey = () => 'interior'; m.userData.interior = true; return m;
}
export function mat(name, o = {}) {
  const p = { color: o.color ?? 0xffffff, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0 };
  if (o.tex) {
    const t = T[o.tex], rep = 1 / (o.tile || 1);
    for (const k of ['map', 'normalMap', 'roughnessMap']) { const c = t[k].clone(); c.needsUpdate = true; if (!t.rugUV) c.repeat.set(rep, rep); p[k] = c; }
    if (o.color === undefined) p.color = 0xffffff;
    p.normalScale = new THREE.Vector2(o.ns ?? 1, o.ns ?? 1);
  }
  Object.assign(p, o.extra || {});
  const m = new THREE.MeshStandardMaterial(p); m.name = name;
  if (o.tex) m.userData.tex = o.tex, m.userData.rugUV = !!T[o.tex].rugUV;
  if (o.interior) interiorize(m);
  if (o.outdoor) { m.userData.base = { r: m.roughness, c: m.color.clone() }; m.userData.wet = o.wet ?? 1; outdoorMats.push(m); }
  if (o.roof) m.userData.roof = true;
  M[name] = m; return m;
}
export function initMaterials() {
  T = buildTextures();
  const out = (n, o) => mat(n, { ...o, outdoor: true }), ins = (n, o) => mat(n, { ...o, interior: true });
  out('basalt_rubble_1874', { tex: 'rubble', tile: 4, rough: 1 });
  out('basalt_dressed', { tex: 'ashlar', tile: 3, color: 0x6a655c, rough: 1 });
  out('ashlar_1911', { tex: 'ashlar', tile: 4, rough: 1 });
  out('limestone_trim', { tex: 'ashlar', tile: 2.5, color: 0xd4cfc2, rough: 0.9, ns: 0.4 });
  out('clapboard_1926', { tex: 'clap', tile: 2, rough: 1 });
  out('trim_paint_white', { color: 0xc2c0b6, rough: 0.35 });
  out('slate_wet', { tex: 'slate', tile: 4, rough: 1, roof: true, metal: 0.05 });
  out('slate_mossy', { tex: 'slateMoss', tile: 4, rough: 1, roof: true });
  out('lead_flashing', { color: 0x4f5558, rough: 0.3, metal: 0.35 });
  out('moss', { color: 0x3e5a2c, rough: 0.85, wet: 0.3 });
  out('ivy', { color: 0x22351f, rough: 0.55, extra: { side: THREE.DoubleSide } });
  out('copper_verdigris', { tex: 'copper', tile: 2, rough: 0.9, metal: 0.35 });
  out('wrought_iron', { color: 0x1b1d1f, rough: 0.34, metal: 0.45 });
  out('brass_oxidised', { color: 0x8a7440, rough: 0.35, metal: 0.4 });
  out('brick_service', { tex: 'brick', tile: 2, rough: 1 });
  out('board_batten_oxblood', { tex: 'weathered', tile: 2, color: 0x8a4a40, rough: 1 });
  out('door_green', { tex: 'wood', tile: 1.2, color: 0x3a5a4a, rough: 0.6 });
  out('oak_door_ext', { tex: 'oak', tile: 1.2, color: 0x8a6a50, rough: 0.6 });
  out('cedar_shingle', { tex: 'weathered', tile: 1.5, rough: 1 });
  out('gravestone', { tex: 'ashlar', tile: 1.5, color: 0x8a8c84, rough: 1, ns: 0.5 });
  out('gravel_wet', { tex: 'gravel', tile: 3, rough: 1, extra: { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } });
  out('grass_lawn', { tex: 'grass', tile: 6, rough: 1, extra: { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, wet: 0.6 });
  out('grass_long', { tex: 'grass', tile: 5, color: 0x8f9a70, rough: 1, extra: { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, wet: 0.5 });
  out('mud', { tex: 'mud', tile: 3, rough: 1, extra: { polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: -1.5 } });
  out('forest_floor', { tex: 'soil', tile: 6, color: 0x7a8a6a, rough: 1, wet: 0.5 });
  out('flagstone_wet', { tex: 'flag', tile: 4, rough: 1, extra: { polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 } });
  out('puddle', { color: 0x0e1417, rough: 0.02, metal: 0.3, extra: { polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5, transparent: true, opacity: 0.85 }, wet: 0 });
  out('tire_track', { color: 0x1c1b18, rough: 0.25, extra: { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, transparent: true, opacity: 0.55 }, wet: 0 });
  out('water_surface', { color: 0x152226, rough: 0.03, metal: 0.3, extra: { transparent: true, opacity: 0.9 }, wet: 0 });
  out('soil_bed', { tex: 'soil', tile: 2, rough: 1 });
  out('bark', { tex: 'bark', tile: 1.5, rough: 1, wet: 0.4 });
  out('douglas_fir', { color: 0x1c3026, rough: 0.8, wet: 0.3 });
  out('red_cedar', { color: 0x223a33, rough: 0.8, wet: 0.3 });
  out('fern', { color: 0x2f4a26, rough: 0.6, extra: { side: THREE.DoubleSide }, wet: 0.4 });
  out('salal', { color: 0x24382a, rough: 0.5, wet: 0.4 });
  out('rhododendron', { color: 0x1f3326, rough: 0.45, wet: 0.4 });
  out('yew_hedge', { color: 0x1b2c21, rough: 0.6, wet: 0.3 });
  out('maple_autumn', { color: 0x8a6a2e, rough: 0.7, wet: 0.3 });
  out('maple_rust', { color: 0x76432a, rough: 0.7, wet: 0.3 });
  out('fallen_leaves', { color: 0x6e4a24, rough: 0.5, extra: { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }, wet: 0.5 });
  out('hydrangea', { color: 0x6a6a8a, rough: 0.7 });
  out('aster', { color: 0x6a4a7a, rough: 0.7 });
  out('mushroom', { color: 0xb8a078, rough: 0.6 });
  out('lichen_stone', { tex: 'flag', tile: 2, color: 0x9aa08a, rough: 1 });
  out('chrome', { color: 0xc4cacd, rough: 0.18, metal: 0.45 });
  out('rubber', { color: 0x121212, rough: 0.75 });
  out('paint_1934_black', { color: 0x14161a, rough: 0.18, metal: 0.25 });
  out('paint_1957_sage', { color: 0x56654f, rough: 0.45, metal: 0.1 });
  out('paint_1966_maroon', { color: 0x5a1f22, rough: 0.25, metal: 0.15 });
  out('paint_1966_cream', { color: 0xc6bda3, rough: 0.28 });
  out('paint_1988_navy', { color: 0x1c2a3d, rough: 0.25, metal: 0.15 });
  out('wagon_wood_panel', { tex: 'wood', tile: 0.8, color: 0xb08a60, rough: 0.35 });
  out('car_glass', { color: 0x182024, rough: 0.05, metal: 0.4, extra: { transparent: true, opacity: 0.55 } });
  out('headlamp_glass', { color: 0xd8d4c0, rough: 0.05, metal: 0.2 });
  out('terracotta', { color: 0x9a5a3a, rough: 0.8 });
  mat('glass_window', { color: 0x9fb0b8, rough: 0.04, metal: 0.15, extra: { transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide } });
  mat('greenhouse_pane', { color: 0xc8d8d4, rough: 0.35, metal: 0.05, extra: { transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide } });
  // interiors
  ins('plaster', { tex: 'plaster', tile: 2 }); ins('ceiling_plaster', { tex: 'plaster', tile: 2, color: 0xe6e0d2 });
  ins('panel_oak', { tex: 'oak', tile: 1.4 }); ins('panel_walnut', { tex: 'oak', tile: 1.4, color: 0x8a6e58 });
  ins('paper_green_damask', { tex: 'paperGreen', tile: 1 }); ins('paper_red_damask', { tex: 'paperRed', tile: 1 }); ins('paper_blue_stripe', { tex: 'paperBlue', tile: 1 });
  ins('paper_rose_floral', { tex: 'paperRose', tile: 1 }); ins('paper_cream_floral', { tex: 'paperCream', tile: 1 }); ins('paper_ochre_stripe', { tex: 'paperOchre', tile: 1 }); ins('paper_teal_damask', { tex: 'paperTeal', tile: 1 });
  ins('tile_white', { tex: 'whiteTile', tile: 2 }); ins('quarry_tile', { tex: 'quarry', tile: 2 }); ins('marble_checker', { tex: 'marble', tile: 4 });
  ins('parquet', { tex: 'parquet', tile: 4 }); ins('floorboards', { tex: 'floorboard', tile: 4 }); ins('attic_boards', { tex: 'attic', tile: 4 });
  ins('flags_interior', { tex: 'flag', tile: 4 }); ins('cellar_stone', { tex: 'ashlar', tile: 3, color: 0x9a948a, ns: 0.7 }); ins('concrete_garage', { tex: 'concrete', tile: 6 });
  ins('wood_furniture', { tex: 'wood', tile: 1, rough: 0.8 }); ins('wood_mahogany', { tex: 'wood', tile: 1, color: 0x8a4a3a, rough: 0.5 }); ins('wood_pine', { tex: 'wood', tile: 1, color: 0xc8a888, rough: 0.8 });
  ins('beam_timber', { tex: 'weathered', tile: 1.5, color: 0xa08870 }); ins('raw_planks', { tex: 'weathered', tile: 2, color: 0xb09a80 });
  ins('fabric_red', { color: 0x5a1e1e, rough: 0.9 }); ins('fabric_green', { color: 0x2e3e2e, rough: 0.9 }); ins('fabric_blue', { color: 0x26324a, rough: 0.9 }); ins('fabric_cream', { color: 0xb8ad94, rough: 0.9 });
  ins('leather_brown', { color: 0x4a2a1a, rough: 0.5 }); ins('linen_white', { color: 0xd8d2c4, rough: 0.9 }); ins('dust_sheet', { color: 0xb8b2a2, rough: 1 });
  ins('rug_red', { tex: 'carpetRed', tile: 1 }); ins('rug_blue', { tex: 'carpetBlue', tile: 1 }); ins('rug_green', { tex: 'carpetGreen', tile: 1 });
  ins('brass', { color: 0xb08a48, rough: 0.3, metal: 0.45 }); ins('iron_int', { color: 0x222426, rough: 0.4, metal: 0.4 }); ins('steel_aged', { color: 0x5a5e60, rough: 0.45, metal: 0.4 });
  ins('copper_pan', { color: 0xa0603a, rough: 0.3, metal: 0.45 }); ins('enamel_cream', { color: 0xd0c8b0, rough: 0.25 }); ins('enamel_green', { color: 0x3a5a4a, rough: 0.3 });
  ins('porcelain', { color: 0xe8e6e0, rough: 0.1 }); ins('book_red', { color: 0x5a1e1a, rough: 0.7 }); ins('book_green', { color: 0x223a2a, rough: 0.7 }); ins('book_brown', { color: 0x4a3020, rough: 0.7 }); ins('book_blue', { color: 0x1e2a40, rough: 0.7 }); ins('book_tan', { color: 0x9a8058, rough: 0.7 });
  ins('paper_sheet', { color: 0xd8ceb4, rough: 0.9 }); ins('soot', { color: 0x0a0908, rough: 1 }); ins('ember', { color: 0x200800, extra: { emissive: 0xff5a10, emissiveIntensity: 2 } });
  ins('bulb_warm', { color: 0x302010, extra: { emissive: 0xffb060, emissiveIntensity: 3 } }); ins('shade_silk', { color: 0xc8a878, rough: 0.8, extra: { emissive: 0xffa040, emissiveIntensity: 0.6, side: THREE.DoubleSide } });
  ins('mirror', { color: 0x8a9090, rough: 0.02, metal: 1 }); ins('glass_bottle', { color: 0x2a4a2a, rough: 0.1, metal: 0.2, extra: { transparent: true, opacity: 0.7 } });
  ins('dome_interior_wood', { tex: 'wood', tile: 1, color: 0x9a7a5a, extra: { side: THREE.BackSide } });
  ins('plant_green', { color: 0x3f6a36, rough: 0.6, extra: { side: THREE.DoubleSide } }); ins('plant_dark', { color: 0x24402a, rough: 0.5, extra: { side: THREE.DoubleSide } }); ins('plant_yellow', { color: 0x7a7a30, rough: 0.6, extra: { side: THREE.DoubleSide } });
  ins('cactus', { color: 0x4a6a3a, rough: 0.7 }); ins('flower_red', { color: 0x9a2a2a, rough: 0.6 }); ins('flower_white', { color: 0xd8d0c0, rough: 0.6 }); ins('orange_fruit', { color: 0xc8701a, rough: 0.5 });
  ins('terracotta_int', { color: 0x9a5a3a, rough: 0.8 }); ins('sacking', { color: 0x8a7a5a, rough: 1 }); ins('canvas_board', { color: 0xc9b88e, rough: 0.9 });
  ins('oil_drum', { color: 0x3a4a3a, rough: 0.5, metal: 0.3 }); ins('red_can', { color: 0x7a1a14, rough: 0.4, metal: 0.2 }); ins('pegboard', { tex: 'weathered', tile: 1, color: 0xb09878 });
  ins('telescope_brass', { color: 0xc09850, rough: 0.25, metal: 0.5 }); ins('telescope_black', { color: 0x15171a, rough: 0.3, metal: 0.3 });
  ins('tile_service', { tex: 'whiteTile', tile: 2, color: 0xc8d0c4 }); ins('boiler_iron', { color: 0x2a2826, rough: 0.6, metal: 0.4 }); ins('pipe_copper', { color: 0x8a5a3a, rough: 0.4, metal: 0.4 });
  return T;
}

// ---------- geometry helpers ----------
export function mesh(p, name, geo, m, x = 0, y = 0, z = 0, ry = 0) { const o = new THREE.Mesh(geo, m); o.name = uniq(name); o.position.set(x, y, z); o.rotation.y = ry; p.add(o); return o; }
export const box = (p, name, m, w, h, d, x, y, z, ry = 0) => mesh(p, name, new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, ry);
export const cyl = (p, name, m, rt, rb, h, seg, x, y, z, ry = 0) => mesh(p, name, new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z, ry);
export function grp(p, name, x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.Group(); g.name = uniq(name); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; }
export const bx = (w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };
export const cg = (rt, rb, h, s, x, y, z, rx = 0, rz = 0) => { const g = new THREE.CylinderGeometry(rt, rb, h, s); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); g.translate(x, y, z); return g; };
export const sg = (r, x, y, z, ws = 12, hs = 8, sx = 1, sy = 1, sz = 1) => { const g = new THREE.SphereGeometry(r, ws, hs); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
export function merge(list, keepUV = false) {
  list = list.filter(Boolean); if (!list.length) return new THREE.BufferGeometry();
  let n = 0; const gs = list.map(g => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return q; });
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = keepUV ? new Float32Array(n * 2) : null; let o = 0;
  for (const g of gs) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); if (U && g.attributes.uv) U.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); if (U) out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  out.computeBoundingSphere(); return out;
}
export const mm = (p, name, list, m, keepUV) => mesh(p, name, merge(list, keepUV), m);
export const col = o => (colliders.push(o), o);
export const walk = o => (walkables.push(o), o);
export function proxy(p, name, geo, isWalk) { const o = new THREE.Mesh(geo, M.plaster); o.name = uniq(name); o.visible = false; o.userData.proxy = true; p.add(o); (isWalk ? walkables : colliders).push(o); return o; }
export function flatRect(p, name, m, w, d, x, z, y, ry = 0) { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-PI / 2); return mesh(p, name, g, m, x, y, z, ry); }
export function flatDisc(p, name, m, r, x, z, y, seg = 64, sx = 1, sz = 1, ry = 0) { const g = new THREE.CircleGeometry(r, seg); g.rotateX(-PI / 2); g.scale(sx, 1, sz); return mesh(p, name, g, m, x, y, z, ry); }
export function pyr(p, name, m, sx, sz, h, x, y, z) { const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g.rotateY(PI / 4); g.scale(sx, h, sz); g.translate(0, h / 2, 0); return mesh(p, name, g, m, x, y, z); }
export function ribbon(p, name, m, pts, width, y, opts = {}) {
  const c = new THREE.CatmullRomCurve3(pts), len = c.getLength(), n = Math.max(8, Math.ceil(len / 1.2));
  const pos = [], nor = [], idx = [], samples = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, q = c.getPointAt(t), tg = c.getTangentAt(t), l = Math.hypot(tg.x, tg.z), ox = -tg.z / l * width / 2, oz = tg.x / l * width / 2;
    const off = opts.offset || 0;
    pos.push(q.x + ox + (-tg.z / l) * off, y, q.z + oz + (tg.x / l) * off, q.x - ox + (-tg.z / l) * off, y, q.z - oz + (tg.x / l) * off); nor.push(0, 1, 0, 0, 1, 0); samples.push(q);
    if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const o = mesh(p, name, g, m); o.userData.flat = true; return { curve: c, samples, mesh: o };
}

// ---------- rooms ----------
export function room(frame, id, label, boxes, y0, y1, o = {}) {
  const r = { frame, id, label, boxes, y0, y1, wm: o.wm || M.plaster, fm: o.fm, on: o.on ?? true, col: o.col ?? 0xffb46a, i: o.i ?? 18, dist: o.dist ?? 14, flicker: !!o.flicker, glass: null, building: o.building || '', floor: o.floor || '' };
  const b = boxes[0]; r.lp = new THREE.Vector3(...(o.light || [(b[0] + b[1]) / 2, Math.min(y1 - 0.45, y0 + 2.9), (b[2] + b[3]) / 2]));
  rooms.push(r);
  if (o.slab !== false && o.fm) for (const bb of boxes) slab(frame, id + '_floor', bb[0], bb[1], bb[2], bb[3], y0, o.th ?? 0.3, o.fm, o.cm || M.ceiling_plaster, o.holes || []);
  return r;
}
export function lookupRoom(frame, x, y, z) {
  for (const r of rooms) { if (r.frame !== frame) continue; if (y < r.y0 - 0.05 || y > r.y1 + 0.05) continue; for (const b of r.boxes) if (x >= b[0] - 0.01 && x <= b[1] + 0.01 && z >= b[2] - 0.01 && z <= b[3] + 0.01) return r; }
  return null;
}
function rectSub(rect, holes) {
  let out = [rect];
  for (const h of holes) {
    const nxt = [];
    for (const [x0, x1, z0, z1] of out) {
      if (h[0] >= x1 || h[1] <= x0 || h[2] >= z1 || h[3] <= z0) { nxt.push([x0, x1, z0, z1]); continue; }
      const hx0 = Math.max(x0, h[0]), hx1 = Math.min(x1, h[1]), hz0 = Math.max(z0, h[2]), hz1 = Math.min(z1, h[3]);
      if (z0 < hz0) nxt.push([x0, x1, z0, hz0]); if (hz1 < z1) nxt.push([x0, x1, hz1, z1]);
      if (x0 < hx0) nxt.push([x0, hx0, hz0, hz1]); if (hx1 < x1) nxt.push([hx1, x1, hz0, hz1]);
    }
    out = nxt;
  }
  return out.filter(r => r[1] - r[0] > 0.01 && r[3] - r[2] > 0.01);
}
export function slab(p, name, x0, x1, z0, z1, yTop, th, topM, botM, holes = []) {
  const parts = rectSub([x0, x1, z0, z1], holes); const T1 = [], B1 = [];
  for (const [a, b, c, d] of parts) { T1.push(bx(b - a, 0.03, d - c, (a + b) / 2, yTop - 0.015, (c + d) / 2)); B1.push(bx(b - a, th - 0.03, d - c, (a + b) / 2, yTop - 0.03 - (th - 0.03) / 2, (c + d) / 2)); }
  walk(mm(p, name, T1, topM)); if (botM) mm(p, name + '_under', B1, botM);
}

export function shapeSlab(p, name, pts, yTop, th, topM, botM) {
  const sh = new THREE.Shape(); pts.forEach(([x, z], i) => i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)); sh.closePath();
  const mk = (d, y) => { const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.rotateX(-PI / 2); g.translate(0, y, 0); return g; };
  walk(mesh(p, name, mk(0.03, yTop - 0.03), topM)); if (botM) mesh(p, name + '_under', mk(th - 0.03, yTop - th), botM);
}
export function sectorSlab(p, name, cx, cz, r, yTop, th, a0, len, topM, botM) {
  const g = new THREE.CylinderGeometry(r, r, 0.03, 48, 1, false, a0, len); g.translate(cx, yTop - 0.015, cz); walk(mesh(p, name, g, topM));
  if (botM) { const b = new THREE.CylinderGeometry(r, r, th - 0.03, 48, 1, false, a0, len); b.translate(cx, yTop - 0.03 - (th - 0.03) / 2, cz); mesh(p, name + '_under', b, botM); }
}
export function balus(p, name, x1, z1, x2, z2, y, m, h = 0.95) {
  const L = [], dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), a = Math.atan2(dx, dz), n = Math.max(1, Math.floor(len / 0.16));
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; L.push(cg(0.02, 0.024, h - 0.1, 6, x1 + dx * t, y + h / 2, z1 + dz * t)); }
  L.push(bx(0.08, 0.07, len, (x1 + x2) / 2, y + h - 0.035, (z1 + z2) / 2, a), bx(0.06, 0.05, len, (x1 + x2) / 2, y + 0.04, (z1 + z2) / 2, a));
  mm(p, name, L, m); proxy(p, name + '_proxy', bx(0.12, 1.6, len, (x1 + x2) / 2, y + 0.8, (z1 + z2) / 2, a), false);
}

// ---------- walls with openings ----------
const SKIN = 0.035;
export function wall(p, s) {
  const [ax, az] = s.a, [bx2, bz] = s.b, dx = bx2 - ax, dz = bz - az, len0 = Math.hypot(dx, dz), d = [dx / len0, dz / len0], n = [-d[1], d[0]];
  const eA = s.extA ?? 0, eB = s.extB ?? 0, len = len0 + eA + eB, t = s.t, y0 = s.y0, y1 = s.y0 + s.h, part = s.kind === 'part';
  const U = u => u - eA; // u in [-eA, len0+eB]
  const W = (u, v) => [ax + d[0] * u + n[0] * v, az + d[1] * u + n[1] * v];
  const toU = at => { const k = Math.abs(dx) > Math.abs(dz) ? 0 : 1; return (at - s.a[k]) / (s.b[k] - s.a[k]) * len0; };
  const ops = (s.open || []).map(o => ({ ...o, uc: o.u ?? toU(o.at), }));
  ops.forEach(o => { o.u0 = o.uc - o.w / 2; o.u1 = o.uc + o.w / 2; o.y1 = o.y + o.h; });
  // breakpoints
  const ub = new Set([-eA, len0 + eB]); ops.forEach(o => { ub.add(o.u0); ub.add(o.u1); });
  const axisK = Math.abs(dx) > Math.abs(dz) ? 0 : 1, ys = new Set([y0, y1]);
  if (s.auto !== false) for (const r of rooms) { if (r.frame !== p.userData.frameRef && r.frame !== p) continue; for (const b of r.boxes) { for (const c of axisK ? [b[2], b[3]] : [b[0], b[1]]) { const u = toU(c); if (u > -eA + 0.05 && u < len0 + eB - 0.05) ub.add(u); } } if (r.y0 > y0 + 0.05 && r.y0 < y1 - 0.05) ys.add(r.y0 - 0.3); }
  const us = [...ub].sort((a, b) => a - b), yl = [...ys].sort((a, b) => a - b);
  const layers = part ? [[t / 2 - SKIN, t / 2, 'A'], [-t / 2 + SKIN, t / 2 - SKIN, 'C'], [-t / 2, -t / 2 + SKIN, 'B']] : (s.int === null ? [[-t / 2, t / 2, 'E']] : [[-t / 2 + SKIN, t / 2, 'E'], [-t / 2, -t / 2 + SKIN, 'B']]);
  const buckets = new Map(); const add = (m, g) => { if (!buckets.has(m)) buckets.set(m, []); buckets.get(m).push(g); };
  const frame = p.userData.frameRef || p;
  const matFor = (side, uc, yc) => {
    if (side === 'E') { if (s.auto !== false && s.int === 'auto') { const [wx, wz] = W(uc, t / 2 + 0.4), r = lookupRoom(frame, wx, yc, wz); if (r) return r.wm; } return s.ext; } if (side === 'C') return s.core || M.plaster;
    if (side === 'A' && s.matA) return s.matA; if (side === 'B' && s.int && s.int !== 'auto' && !part) return s.int; if (side === 'B' && s.matB) return s.matB;
    const v = side === 'A' ? t / 2 + 0.4 : -t / 2 - 0.4, [wx, wz] = W(uc, v), r = lookupRoom(frame, wx, yc, wz); return r ? r.wm : (s.fallback || M.plaster);
  };
  const ang = Math.atan2(-d[1], d[0]);
  for (let i = 0; i < us.length - 1; i++) {
    const ua = us[i], ubb = us[i + 1]; if (ubb - ua < 0.005) continue; const uc = (ua + ubb) / 2;
    let segs = [[y0, y1]];
    for (const o of ops) if (o.u0 <= ua + 0.001 && o.u1 >= ubb - 0.001) { const nx = []; for (const [a, b] of segs) { if (o.y1 <= a || o.y >= b) { nx.push([a, b]); continue; } if (o.y > a) nx.push([a, o.y]); if (o.y1 < b) nx.push([o.y1, b]); } segs = nx; }
    const fine = []; for (const [a, b] of segs) { let cur = a; for (const yy of yl) if (yy > a + 0.01 && yy < b - 0.01) { fine.push([cur, yy]); cur = yy; } fine.push([cur, b]); }
    for (const [ya, yb] of fine) { if (yb - ya < 0.005) continue;
      for (const [v0, v1, side] of layers) { const g = new THREE.BoxGeometry(ubb - ua, yb - ya, v1 - v0); g.translate(uc, (ya + yb) / 2, (v0 + v1) / 2); g.rotateY(ang); g.translate(ax, 0, az); add(matFor(side, uc, (ya + yb) / 2), g); }
    }
  }
  const out = [];
  for (const [m, gs] of buckets) { const o = mm(p, (s.name || 'wall') + '_' + m.name, gs, m); out.push(o); if (s.col !== false && (m === s.ext || m === (s.core || M.plaster))) col(o); }
  if (part && s.col !== false) out.forEach(o => col(o));
  // fittings
  const ry = Math.atan2(n[0], n[1]);
  if (!s.noFit) for (const o of ops) {
    const [cx, cz] = W(o.uc, 0); const G = grp(p, (o.kind || 'opening'), cx, 0, cz, ry);
    if (o.kind === 'win') windowUnit(G, o, t, part);
    else if (o.kind === 'door') doorUnit(G, o, t, s);
    else if (o.kind === 'blind') { box(G, 'blind_panel', s.ext, o.w, o.h, t * 0.5, 0, o.y, -t * 0.25); sillAndHead(G, o, t, s.trim || M.limestone_trim); }
    else if (o.kind === 'arch' && o.trim) { mm(G, 'arch_trim', [bx(o.w + 0.24, 0.12, t + 0.04, 0, o.y1 + 0.06, 0), bx(0.12, o.h, t + 0.04, -o.w / 2 - 0.06, o.y + o.h / 2, 0), bx(0.12, o.h, t + 0.04, o.w / 2 + 0.06, o.y + o.h / 2, 0)], o.trim); }
  }
  return out;
}
function sillAndHead(G, o, t, trim) {
  const L = [bx(o.w + 0.34, 0.12, 0.26, 0, o.y - 0.06, t / 2 + 0.05)];
  if ((o.style || '').includes('heavy')) L.push(bx(o.w + 0.7, 0.42, 0.18, 0, o.y1 + 0.21, t / 2 + 0.06));
  if ((o.style || '').includes('hood')) L.push(bx(o.w + 0.5, 0.14, 0.2, 0, o.y1 + 0.1, t / 2 + 0.07), bx(0.12, 0.35, 0.18, -o.w / 2 - 0.19, o.y1 - 0.08, t / 2 + 0.07), bx(0.12, 0.35, 0.18, o.w / 2 + 0.19, o.y1 - 0.08, t / 2 + 0.07));
  if ((o.style || '').includes('great')) { const sh = new THREE.Shape(); sh.moveTo(-o.w / 2 - 0.3, 0); sh.lineTo(o.w / 2 + 0.3, 0); sh.lineTo(0, o.w * 0.45); sh.closePath(); const tri = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false }); tri.translate(0, o.y1 + 0.02, t / 2 - 0.04); L.push(tri); }
  if ((o.style || '').includes('surround')) L.push(bx(0.14, o.h, 0.08, -o.w / 2 - 0.07, o.y + o.h / 2, t / 2 + 0.03), bx(0.14, o.h, 0.08, o.w / 2 + 0.07, o.y + o.h / 2, t / 2 + 0.03), bx(o.w + 0.28, 0.14, 0.08, 0, o.y1 + 0.07, t / 2 + 0.03));
  mm(G, 'sill_head', L, trim);
}
export const decals = { rain: null, grime: null };
export function windowUnit(G, o, t, interiorOnly) {
  const w = o.w, h = o.h, y = o.y, trim = o.trim || M.trim_paint_white, fr = o.frame || trim, st = o.style || '', vz = interiorOnly ? 0 : t / 2 - 0.13;
  const F = [], b = 0.07;
  F.push(bx(w, b, 0.1, 0, y + b / 2, vz), bx(w, b, 0.1, 0, y + h - b / 2, vz), bx(b, h, 0.1, -w / 2 + b / 2, y + h / 2, vz), bx(b, h, 0.1, w / 2 - b / 2, y + h / 2, vz));
  const cols = st.includes('great') ? 3 : st.includes('one') ? 1 : 2, rowsN = st.includes('great') ? 4 : st.includes('one') ? 1 : h > 1.6 ? 3 : 2;
  for (let i = 1; i < cols; i++) F.push(bx(st.includes('great') ? 0.09 : 0.035, h, 0.06, -w / 2 + w * i / cols, y + h / 2, vz));
  for (let j = 1; j < rowsN; j++) F.push(bx(w, j === Math.floor(rowsN / 2) ? 0.06 : 0.03, 0.06, 0, y + h * j / rowsN, vz));
  mm(G, 'sash_frame', F, fr);
  const gl = mesh(G, 'glass', new THREE.PlaneGeometry(w - 0.06, h - 0.06), M.glass_window, 0, y + h / 2, vz - 0.01); glassMeshes.push(gl);
  if (!interiorOnly) {
    sillAndHead(G, o, t, o.stone || trim);
    mm(G, 'inner_sill', [bx(w + 0.1, 0.04, t / 2 + 0.05, 0, y - 0.02, -t / 4 + 0.02)], M.wood_furniture);
    if (decals.rain && o.streak !== false) { const dg = new THREE.PlaneGeometry(w * 0.9, Math.min(1.6, y - 0.3)); const dm = mesh(G, 'rain_streak_decal', dg, decals.rain, 0, y - 0.12 - Math.min(1.6, y - 0.3) / 2, t / 2 + 0.012); dm.userData.noUV = true; dm.castShadow = false; }
  }
}
export function doorUnit(G, o, t, s) {
  const w = o.w, h = o.h, y = o.y, trim = o.trim || M.trim_paint_white, leafM = o.leafM || (s.kind === 'part' ? M.wood_furniture : M.oak_door_ext);
  const ct = 0.09, L = [];
  for (const side of [1, -1]) { const vz = side * (t / 2 + 0.015); L.push(bx(w + ct * 2, ct, 0.04, 0, y + h + ct / 2, vz), bx(ct, h, 0.04, -w / 2 - ct / 2, y + h / 2, vz), bx(ct, h, 0.04, w / 2 + ct / 2, y + h / 2, vz)); }
  L.push(bx(w, 0.04, t, 0, y + 0.02, 0));
  mm(G, 'door_casing', L, trim);
  if (o.leaf === false) return;
  const leaves = o.double ? [[-w / 2, w / 2, 1], [w / 2, w / 2, -1]] : [[-w / 2, w, 1]];
  const vz = -t / 2 + 0.06;
  for (const [hx, lw, sgn] of leaves) {
    const H = grp(G, 'door_hinge', hx, y, vz, sgn * (o.open ?? 1.35));
    const P = [bx(lw, h - 0.01, 0.055, sgn * lw / 2, h / 2, 0)];
    P.push(bx(lw * 0.7, h * 0.32, 0.02, sgn * lw / 2, h * 0.72, 0.035), bx(lw * 0.7, h * 0.32, 0.02, sgn * lw / 2, h * 0.3, 0.035), bx(lw * 0.7, h * 0.32, 0.02, sgn * lw / 2, h * 0.72, -0.035), bx(lw * 0.7, h * 0.32, 0.02, sgn * lw / 2, h * 0.3, -0.035));
    mm(H, 'door_leaf', P, leafM);
    mm(H, 'door_knob', [sg(0.035, sgn * (lw - 0.08), 1.0, 0.06), sg(0.035, sgn * (lw - 0.08), 1.0, -0.06)], M.brass);
  }
}
// polygon (round/octagon) walls
export function ringWall(p, s) {
  const N = s.seg, out = [], A = s.a0 ?? 0, P = a => [s.cx + s.r * Math.sin(a), s.cz + s.r * Math.cos(a)];
  for (let i = 0; i < N; i++) {
    const a0 = A + i / N * 2 * PI, a1 = A + (i + 1) / N * 2 * PI, am = (a0 + a1) / 2, segLen = 2 * s.r * Math.sin((a1 - a0) / 2);
    if (s.skip && s.skip(am)) continue;
    const ops = [];
    for (const o of s.open || []) { const da = Math.atan2(Math.sin(o.ang - am), Math.cos(o.ang - am));
      if (N <= 12) { if (Math.abs(da) < (a1 - a0) / 2) ops.push({ ...o, u: segLen / 2 + Math.tan(da) * s.r * Math.cos((a1 - a0) / 2) }); }
      else if (Math.abs(da) * s.r <= o.w / 2 + 0.01) ops.push({ u: segLen / 2, w: segLen + 0.004, y: o.y, h: o.h, kind: 'hole' }); }
    out.push(...wall(p, { ...s, a: P(a0), b: P(a1), open: ops, extA: s.ext0 ?? 0.015, extB: s.ext0 ?? 0.015, auto: false, name: s.name }));
  }
  if (N > 12 && !s.noFit) for (const o of s.open || []) { if (s.skip && s.skip(o.ang)) continue; const [x, z] = P(o.ang); const G = grp(p, o.kind || 'opening', x, 0, z, o.ang); if (o.kind === 'win') windowUnit(G, o, s.t); else if (o.kind === 'door') doorUnit(G, o, s.t, s); }
  return out;
}

// ---------- stairs ----------
export function stairRun(p, o) {
  const dir = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] }[o.dir], side = [-dir[1], dir[0]];
  const rise = o.y1 - o.y0, n = Math.max(1, Math.round(rise / (o.riser || 0.19))), rh = rise / n, tr = o.tread || 0.27, run = n * tr, w = o.w;
  const S = [], N2 = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * tr, top = o.y0 + rh * (i + 1), hgt = o.open ? 0.06 : top - (o.base ?? o.y0);
    const cx = o.x + dir[0] * u, cz = o.z + dir[1] * u;
    S.push(bx(Math.abs(dir[0]) ? tr : w, hgt, Math.abs(dir[0]) ? w : tr, cx, top - hgt / 2, cz));
    if (o.nosing !== false) N2.push(bx(Math.abs(dir[0]) ? 0.04 : w + 0.02, 0.04, Math.abs(dir[0]) ? w + 0.02 : 0.04, o.x + dir[0] * (i * tr + 0.02), top - 0.02, o.z + dir[1] * (i * tr + 0.02)));
  }
  mm(p, o.name || 'stair', S, o.mat); if (N2.length && o.nosingMat) mm(p, (o.name || 'stair') + '_nosing', N2, o.nosingMat);
  if (o.open) { const st = []; for (const sd of [1, -1]) { const len = Math.hypot(run, rise); const g = new THREE.BoxGeometry(0.06, 0.25, len); g.rotateX(-Math.atan2(rise, run)); const yaw = Math.atan2(dir[0], dir[1]); g.rotateY(yaw); g.translate(o.x + dir[0] * run / 2 + side[0] * sd * w / 2, o.y0 + rise / 2, o.z + dir[1] * run / 2 + side[1] * sd * w / 2); st.push(g); } mm(p, 'stringer', st, o.mat); }
  // ramp proxy
  const c = (u, sd, y) => [o.x + dir[0] * u + side[0] * sd * w / 2, y, o.z + dir[1] * u + side[1] * sd * w / 2];
  const pos = [...c(-0.05, -1, o.y0), ...c(-0.05, 1, o.y0), ...c(run, -1, o.y1), ...c(run, 1, o.y1)];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex([0, 1, 2, 2, 1, 3]); g.computeVertexNormals(); g.computeBoundingSphere();
  proxy(p, 'stair_ramp_proxy', g, true);
  for (const sd of o.rails || []) {
    const L = [], len = Math.hypot(run, rise), yaw = Math.atan2(dir[0], dir[1]);
    const nb = Math.floor(run / 0.14);
    for (let i = 0; i < nb; i++) { const u = (i + 0.5) * run / nb, yb = o.y0 + rise * (u / run) + rh * 0.5; const [x, , z] = c(u, sd, 0); L.push(cg(0.018, 0.022, 0.86, 6, x - side[0] * sd * 0.05, yb + 0.43, z - side[1] * sd * 0.05)); }
    const hr = new THREE.BoxGeometry(0.07, 0.07, len); hr.rotateX(-Math.atan2(rise, run)); hr.rotateY(yaw); const [x, , z] = c(run / 2, sd, 0); hr.translate(x - side[0] * sd * 0.05, o.y0 + rise / 2 + 0.92, z - side[1] * sd * 0.05); L.push(hr);
    const [nx, , nz] = c(0.1, sd, 0); L.push(bx(0.14, 1.15, 0.14, nx - side[0] * sd * 0.05, o.y0 + rh + 0.57, nz - side[1] * sd * 0.05));
    mm(p, 'stair_balustrade', L, o.railMat || M.wood_mahogany);
    const cgeo = new THREE.BoxGeometry(0.1, 1.8, len + 0.2); cgeo.rotateX(-Math.atan2(rise, run)); cgeo.rotateY(yaw); cgeo.translate(x - side[0] * sd * 0.05, o.y0 + rise / 2 + 1.0, z - side[1] * sd * 0.05); proxy(p, 'stair_rail_proxy', cgeo, false);
  }
  return { run, n };
}
export function spiral(p, o) {
  const rise = o.y1 - o.y0, n = Math.round(rise / 0.2), rh = rise / n, da = 2 * PI * rh / o.P * (o.cw ? -1 : 1);
  const S = [], rm = (o.r0 + o.r1) / 2, wid = Math.abs(da) * o.r1 * 1.05, len = o.r1 - o.r0;
  for (let i = 0; i < n; i++) { const a = o.a0 + da * (i + 0.5), y = o.y0 + rh * (i + 1); const g = new THREE.BoxGeometry(wid, 0.08, len); g.translate(0, y - 0.04, rm); g.rotateY(a); g.translate(o.cx, 0, o.cz); S.push(g); const g2 = new THREE.BoxGeometry(wid * 0.5, rh, 0.06); g2.translate(0, y - rh / 2 - 0.04, o.r1 - 0.05); g2.rotateY(a); g2.translate(o.cx, 0, o.cz); if (o.risers) S.push(g2); }
  mm(p, o.name || 'spiral_stair', S, o.mat);
  if (o.post !== false) { const ph = rise + (o.postTop ?? 2.2); col(mm(p, 'spiral_post', [cg(o.r0, o.r0, ph, 24, o.cx, o.y0 + ph / 2, o.cz), sg(o.r0 * 1.6, o.cx, o.y0 + ph, o.cz, 12, 8)], o.postMat || o.mat)); }
  if (o.rail) { const L = []; for (let i = 0; i < n; i += 1) { const a = o.a0 + da * (i + 0.5), y = o.y0 + rh * (i + 1); L.push(cg(0.012, 0.012, 0.9, 5, o.cx + Math.sin(a) * (o.r1 - 0.06), y + 0.45, o.cz + Math.cos(a) * (o.r1 - 0.06))); } const pts = []; for (let i = 0; i <= n; i++) { const a = o.a0 + da * i, y = o.y0 + rh * i + 0.92; pts.push(new THREE.Vector3(o.cx + Math.sin(a) * (o.r1 - 0.06), y, o.cz + Math.cos(a) * (o.r1 - 0.06))); } L.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.025, 6)); mm(p, 'spiral_rail', L, o.railMat || M.iron_int); }
  const pos = [], idx = [], K = n * 2;
  for (let i = 0; i <= K; i++) { const t = i / K, a = o.a0 + da * n * t, y = o.y0 + rise * t; for (const rr of [o.r0, o.r1]) pos.push(o.cx + Math.sin(a) * rr, y, o.cz + Math.cos(a) * rr); if (i < K) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); proxy(p, 'spiral_ramp_proxy', g, true);
  return { da, n, aEnd: o.a0 + da * n };
}

// ---------- roofs ----------
export function gableRoof(p, o) {
  // o: {span, rise, len, x, y, z, alongX, over, endOver, mats:[southOrEast, northOrWest], wall, t, gutter}
  const over = o.over ?? 0.55, eo = o.endOver ?? 0.4, t = o.t ?? 0.22, hs = o.span / 2, slope = Math.atan2(o.rise, hs), sl = Math.hypot(hs + over, o.rise + over * o.rise / hs), L = o.len + eo * 2;
  const G = grp(p, o.name || 'roof', o.x, o.y, o.z, o.alongX ? PI / 2 : 0);
  for (const sd of [1, -1]) {
    const m = o.mats[sd > 0 ? 0 : 1];
    const g = new THREE.BoxGeometry(sl, t, L);
    g.translate(sd * sl / 2, t / 2, 0); g.rotateZ(sd * -slope); g.translate(0, o.rise, 0);
    const me = mesh(G, (o.name || 'roof') + (sd > 0 ? '_slope_a' : '_slope_b'), g, m); me.userData.uvLocal = true; col(me);
    // uv local fix: assign uv on slope plane
    const pa = g.attributes.position, uv = new Float32Array(pa.count * 2); for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); uv[i * 2] = z; uv[i * 2 + 1] = (o.rise - y) / Math.sin(slope) * 1 + Math.abs(x) * 0.0; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); me.userData.keepUV = true;
    if (o.gutter !== false) { const ex = sd * (hs + over * 0.98), ey = -over * o.rise / hs - 0.05; const gu = new THREE.CylinderGeometry(0.09, 0.09, L, 12, 1, true, sd > 0 ? 0 : PI, PI); gu.rotateX(PI / 2); gu.translate(ex, ey, 0); mm(G, 'gutter', [gu], M.wrought_iron); }
  }
  // ridge cap
  const rc = new THREE.CylinderGeometry(0.11, 0.11, L, 10, 1, false, 0, PI); rc.rotateX(PI / 2); rc.rotateZ(0); rc.translate(0, o.rise + t * 0.6, 0); mm(G, 'ridge_cap', [rc], M.lead_flashing);
  // barge boards
  if (o.barge !== false) { const B = []; for (const ez of [L / 2 - 0.03, -L / 2 + 0.03]) for (const sd of [1, -1]) { const g = new THREE.BoxGeometry(sl, 0.3, 0.05); g.translate(sd * sl / 2, 0.02, 0); g.rotateZ(sd * -slope); g.translate(0, o.rise, ez); B.push(g); } mm(G, 'barge_boards', B, o.bargeM || M.trim_paint_white); }
  if (o.wall) { const s2 = new THREE.Shape(); s2.moveTo(-hs, 0); s2.lineTo(hs, 0); s2.lineTo(0, o.rise - 0.05); s2.closePath(); const ends = []; for (const sz of [1, -1]) { const g2 = new THREE.ExtrudeGeometry(s2, { depth: 0.32, bevelEnabled: false }); g2.translate(0, 0, sz > 0 ? o.len / 2 - 0.32 : -o.len / 2); ends.push(g2); } col(mm(G, 'gable_end_walls', ends, o.wall)); const inn = []; for (const sz of [1, -1]) { const g3 = new THREE.ShapeGeometry(s2); g3.scale(0.985, 0.985, 1); if (sz > 0) { g3.rotateY(PI); g3.translate(0, 0, o.len / 2 - 0.33); } else g3.translate(0, 0, -o.len / 2 + 0.33); inn.push(g3); } mm(G, 'gable_end_inner', inn, o.wallIn || M.raw_planks); }
  return G;
}
// rafters / beams for attic interiors (in roof group local space)
export function rafters(G, o, m) {
  const hs = o.span / 2, L = [], slope = Math.atan2(o.rise, hs), sl = Math.hypot(hs, o.rise);
  for (let z = -o.len / 2 + 0.3; z <= o.len / 2 - 0.3; z += 0.9) for (const sd of [1, -1]) { const g = new THREE.BoxGeometry(sl, 0.18, 0.08); g.translate(sd * sl / 2, -0.12, 0); g.rotateZ(sd * -slope); g.translate(0, o.rise, z); L.push(g); }
  for (let z = -o.len / 2 + 1.2; z <= o.len / 2 - 1; z += 2.7) L.push(bx(hs * 1.1, 0.16, 0.12, 0, o.rise * 0.45, z));
  L.push(bx(0.2, 0.25, o.len, 0, o.rise - 0.25, 0));
  mm(G, 'attic_rafters', L, m);
}
