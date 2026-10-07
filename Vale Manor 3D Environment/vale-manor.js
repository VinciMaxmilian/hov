const stage = document.querySelector('three-d-stage');
const { THREE } = await stage.ready;
const scene = stage._scene, camera = stage._camera, controls = stage._controls, renderer = stage._renderer;
const PI = Math.PI;

let seed = 1874;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + (b - a) * rnd();

const counts = {};
const uniq = n => { counts[n] = (counts[n] || 0) + 1; return counts[n] === 1 ? n : n + '_' + counts[n]; };
function mat(name, color, rough = 0.6, metal = 0, extra = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  m.name = name; return m;
}
const flatM = (name, color, rough, off, extra = {}) => mat(name, color, rough, 0, { polygonOffset: true, polygonOffsetFactor: off, polygonOffsetUnits: off, ...extra });

const M = {
  stoneW: mat('basalt_1874', 0x4b4740, 0.48),
  stoneWT: mat('basalt_dressed_1874', 0x605a52, 0.46),
  stone11: mat('ashlar_1911', 0x7a776f, 0.4),
  lime: mat('limestone_trim', 0x9c988d, 0.38),
  paintE: mat('clapboard_1926', 0x7e8a86, 0.36),
  clapLine: mat('clapboard_shadow', 0x606b68, 0.5),
  trimW: mat('trim_paint_white', 0xc2c0b6, 0.34),
  slate: mat('slate_wet', 0x293037, 0.26, 0.05),
  slateMoss: mat('slate_mossy', 0x30392f, 0.4),
  lead: mat('lead_flashing', 0x4f5558, 0.3, 0.3),
  moss: mat('moss', 0x3e5a2c, 0.85),
  ivy: mat('ivy', 0x22351f, 0.7),
  glass: mat('window_dark', 0x0c1216, 0.04, 0.3),
  glassLit: mat('window_lit_amber', 0x3a2410, 0.3, 0, { emissive: 0xffa24a, emissiveIntensity: 0.6 }),
  copper: mat('copper_verdigris', 0x5a9a88, 0.38, 0.3),
  iron: mat('wrought_iron', 0x1b1d1f, 0.34, 0.4),
  woodDark: mat('oak_door_dark', 0x2f2925, 0.42),
  brick: mat('brick_service', 0x5b3b31, 0.5),
  carriage: mat('board_batten_oxblood', 0x4a2a25, 0.4),
  doorGreen: mat('carriage_door_green', 0x26352f, 0.4),
  shingle: mat('cedar_shingle', 0x4a443c, 0.55),
  grave: mat('gravestone', 0x6c6e67, 0.45),
  interior: mat('interior_dark', 0x07090a, 1),
  floor: mat('forest_floor', 0x1c231d, 0.9),
  lawn: flatM('lawn_wet', 0x3a4e30, 0.62, -1),
  lawnIsland: flatM('lawn_island', 0x3d5432, 0.62, -3),
  lawnLong: flatM('grass_long', 0x37462c, 0.75, -1),
  gravel: flatM('gravel_wet', 0x5a5751, 0.62, -2),
  dirt: flatM('path_mud', 0x372f27, 0.45, -2),
  flag: flatM('flagstone_wet', 0x55544e, 0.3, -3),
  puddle: flatM('puddle', 0x0f1518, 0.02, -5, { metalness: 0.25 }),
  water: mat('fountain_water', 0x142024, 0.02, 0.25),
  soil: mat('soil', 0x231b15, 0.7),
  ghGlass: mat('greenhouse_glass', 0x9fb8b4, 0.08, 0.1, { transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide }),
  plants: mat('greenhouse_plants', 0x3f6a36, 0.6),
  fir: mat('douglas_fir', 0x1c3026, 0.8),
  cedar: mat('red_cedar', 0x223a33, 0.8),
  maple: mat('bigleaf_maple_autumn', 0x8a6a2e, 0.72),
  mapleRust: mat('maple_rust', 0x76432a, 0.72),
  bark: mat('bark', 0x332822, 0.9),
  rhodo: mat('rhododendron', 0x22362a, 0.6),
  yew: mat('yew_hedge', 0x1b2c21, 0.65),
  chrome: mat('chrome', 0xb4babd, 0.22, 0.4),
  tire: mat('rubber', 0x121212, 0.75),
  woodPanel: mat('wagon_wood_panel', 0x6b4a2e, 0.35),
  carBlack: mat('paint_1934_black', 0x15171a, 0.2, 0.2),
  carSage: mat('paint_1957_sage', 0x56654f, 0.45),
  carCream: mat('paint_1966_cream', 0xc6bda3, 0.28),
  carMaroon: mat('paint_1966_maroon', 0x5a1f22, 0.28),
  carNavy: mat('paint_1988_navy', 0x1c2a3d, 0.28),
};
const voidM = new THREE.MeshStandardMaterial({ name: 'hidden_volume', color: 0xe0603a, emissive: 0xe0603a, emissiveIntensity: 0.7, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false });
const underM = new THREE.MeshStandardMaterial({ name: 'underground_volume', color: 0x3ab8d8, emissive: 0x3ab8d8, emissiveIntensity: 0.7, transparent: true, opacity: 0.28, depthTest: false, depthWrite: false });
const axisM = new THREE.MeshBasicMaterial({ name: 'meridian_axis_guide', color: 0x8fe3e8, transparent: true, opacity: 0.85, depthTest: false });

// ---------- helpers ----------
function mesh(p, name, geo, m, x = 0, y = 0, z = 0, ry = 0) {
  const o = new THREE.Mesh(geo, m); o.name = uniq(name); o.position.set(x, y, z); o.rotation.y = ry; p.add(o); return o;
}
const box = (p, name, m, w, h, d, x, y, z, ry = 0) => mesh(p, name, new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, ry);
const cyl = (p, name, m, rt, rb, h, seg, x, y, z, ry = 0) => mesh(p, name, new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z, ry);
function grp(p, name, x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.Group(); g.name = uniq(name); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; }
const bx = (w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };
const cg = (rt, rb, h, s, x, y, z) => { const g = new THREE.CylinderGeometry(rt, rb, h, s); g.translate(x, y, z); return g; };
function merge(list) {
  let n = 0; const gs = list.map(g => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return q; });
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3); let o = 0;
  for (const g of gs) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  out.computeBoundingSphere(); return out;
}
function gable(p, name, roofM, wallM, span, rise, len, x, y, z, alongX, over = 0.6, t = 0.35, endOver = 0.45) {
  const k = rise / (span / 2), hw = span / 2 + over, e = -over * k;
  const s = new THREE.Shape();
  s.moveTo(-hw, e); s.lineTo(0, rise); s.lineTo(hw, e); s.lineTo(hw, e - t); s.lineTo(0, rise - t); s.lineTo(-hw, e - t); s.closePath();
  const L = len + endOver * 2; const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2);
  const ry = alongX ? PI / 2 : 0;
  const r = mesh(p, name, g, roofM, x, y, z, ry);
  if (wallM) {
    const s2 = new THREE.Shape(); s2.moveTo(-span / 2, 0); s2.lineTo(span / 2, 0); s2.lineTo(0, rise - t * 0.6); s2.closePath();
    const g2 = new THREE.ExtrudeGeometry(s2, { depth: len - 0.02, bevelEnabled: false }); g2.translate(0, 0, -(len - 0.02) / 2);
    mesh(p, name + '_gable_wall', g2, wallM, x, y, z, ry);
  }
  return r;
}
function pyr(p, name, m, sx, sz, h, x, y, z) {
  const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4); g.rotateY(PI / 4); g.scale(sx, h, sz); g.translate(0, h / 2, 0);
  return mesh(p, name, g, m, x, y, z);
}
function win(p, x, y, z, ry, w, h, style = '', trim = M.trimW, glass = M.glass) {
  const g = grp(p, 'window', x, y, z, ry); const t = 0.12; const L = [];
  L.push(bx(w + 2 * t, t, 0.2, 0, h / 2 + t / 2, 0), bx(w + 2 * t, t, 0.2, 0, -h / 2 - t / 2, 0), bx(t, h, 0.2, -w / 2 - t / 2, 0, 0), bx(t, h, 0.2, w / 2 + t / 2, 0, 0), bx(w + 0.36, 0.1, 0.32, 0, -h / 2 - t - 0.05, 0.04));
  if (style.includes('heavy')) L.push(bx(w + 0.7, 0.42, 0.3, 0, h / 2 + t + 0.21, 0.03));
  if (style.includes('hood')) L.push(bx(w + 0.5, 0.14, 0.26, 0, h / 2 + t + 0.07, 0.03));
  if (style.includes('mull')) L.push(bx(0.08, h, 0.12, 0, 0, 0.02), bx(w, 0.08, 0.12, 0, h * 0.22, 0.02));
  if (style.includes('great')) {
    L.push(bx(0.1, h, 0.14, -w / 6, 0, 0.02), bx(0.1, h, 0.14, w / 6, 0, 0.02), bx(w, 0.1, 0.14, 0, -h / 4, 0.02), bx(w, 0.1, 0.14, 0, h / 4, 0.02));
    const s = new THREE.Shape(); s.moveTo(-w / 2 - t - 0.15, 0); s.lineTo(w / 2 + t + 0.15, 0); s.lineTo(0, w * 0.42); s.closePath();
    const tri = new THREE.ExtrudeGeometry(s, { depth: 0.24, bevelEnabled: false }); tri.translate(0, h / 2 + t, -0.1); L.push(tri);
  }
  mesh(g, 'frame', merge(L), trim);
  mesh(g, glass === M.glassLit ? 'glass_lit' : 'glass', new THREE.BoxGeometry(w, h, 0.06), glass, 0, 0, -0.02);
  return g;
}
function door(p, x, y, z, ry, w, h, leafM, trim) {
  const g = grp(p, 'door', x, y, z, ry); const t = 0.2;
  mesh(g, 'door_surround', merge([bx(w + 2 * t, t, 0.26, 0, h + t / 2, 0), bx(t, h, 0.26, -w / 2 - t / 2, h / 2, 0), bx(t, h, 0.26, w / 2 + t / 2, h / 2, 0)]), trim);
  mesh(g, 'door_leaf', new THREE.BoxGeometry(w, h, 0.1), leafM, 0, h / 2, -0.02);
  return g;
}
function oculus(p, x, y, z, ry, r, trim) {
  const g = grp(p, 'oculus', x, y, z, ry);
  mesh(g, 'oculus_ring', new THREE.TorusGeometry(r, 0.11, 8, 28), trim);
  const d = new THREE.CylinderGeometry(r, r, 0.06, 28); d.rotateX(PI / 2); mesh(g, 'oculus_glass', d, M.glass, 0, 0, -0.03);
}
function dormer(p, name, x, zf, yb, w, h, d, wallM, roofM, trim) {
  box(p, name, wallM, w, h, d, x, yb, zf - d / 2);
  gable(p, name + '_roof', roofM, wallM, w, w * 0.62, d, x, yb + h, zf - d / 2, false, 0.2, 0.18, 0.15);
  win(p, x, yb + h * 0.48, zf, 0, w * 0.45, h * 0.55, '', trim);
}
function balustrade(p, name, x1, z1, x2, z2, y, h = 0.95) {
  const L = [], dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), a = Math.atan2(dx, dz), n = Math.floor(len / 0.34);
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; L.push(cg(0.055, 0.08, h - 0.24, 6, x1 + dx * t, y + 0.12 + (h - 0.24) / 2, z1 + dz * t)); }
  L.push(bx(0.3, 0.12, len, (x1 + x2) / 2, y + h - 0.06, (z1 + z2) / 2, a), bx(0.3, 0.12, len, (x1 + x2) / 2, y + 0.06, (z1 + z2) / 2, a));
  mesh(p, name, merge(L), M.lime);
}
function flatRect(p, name, m, w, d, x, z, y, ry = 0) { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-PI / 2); return mesh(p, name, g, m, x, y, z, ry); }
function flatDisc(p, name, m, r, x, z, y, seg = 64, sx = 1, sz = 1, ry = 0) { const g = new THREE.CircleGeometry(r, seg); g.rotateX(-PI / 2); const o = mesh(p, name, g, m, x, y, z, ry); o.scale.set(sx, 1, sz); return o; }
function ribbon(p, name, m, pts, width, y) {
  const c = new THREE.CatmullRomCurve3(pts), len = c.getLength(), n = Math.max(8, Math.ceil(len / 1.5));
  const pos = [], nor = [], idx = [], samples = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, q = c.getPointAt(t), tg = c.getTangentAt(t); const l = Math.hypot(tg.x, tg.z);
    const ox = -tg.z / l * width / 2, oz = tg.x / l * width / 2;
    pos.push(q.x + ox, y, q.z + oz, q.x - ox, y, q.z - oz); nor.push(0, 1, 0, 0, 1, 0); samples.push(q);
    if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  mesh(p, name, g, m); return { curve: c, samples };
}
function lamp(p, x, z, y = 0) {
  const g = grp(p, 'lamp_post', x, y, z);
  mesh(g, 'lamp_iron', merge([cg(0.16, 0.2, 0.5, 8, 0, 0.25, 0), cg(0.06, 0.07, 3.0, 8, 0, 2.0, 0), bx(0.42, 0.06, 0.42, 0, 3.52, 0)]), M.iron);
  box(g, 'lamp_lantern_glass', M.glass, 0.34, 0.48, 0.34, 0, 3.55, 0);
  pyr(g, 'lamp_cap', M.iron, 0.46, 0.46, 0.28, 0, 4.03, 0);
}
function shrubs(p, name, m, list) {
  const L = list.map(([x, z, r, sy = 0.8]) => { const g = new THREE.IcosahedronGeometry(r, 1); g.scale(1, sy, 1); g.translate(x, r * sy * 0.85, z); return g; });
  mesh(p, name, merge(L), m);
}
const voids = [];
function vbox(p, name, m, w, h, d, x, y, z, ry = 0) { const o = box(p, name, m, w, h, d, x, y, z, ry); o.visible = false; o.renderOrder = 10; voids.push(o); return o; }

// ---------- world ----------
const model = new THREE.Group(); model.name = 'vale_manor_estate';
const YAW = -0.1, Yax = new THREE.Vector3(0, 1, 0);
const toW = (x, z, y = 0) => new THREE.Vector3(x, y, z).applyAxisAngle(Yax, YAW);

flatDisc(model, 'ground_forest_floor', M.floor, 430, 0, 0, 0, 72);

// ============ MANOR (house frame, rotated off true north) ============
const manor = grp(model, 'manor', 0, 0, 0, YAW);

// --- West wing 1874: heavy basalt, small deep windows, NW tower ---
const W = grp(manor, 'west_wing_1874');
box(W, 'west_wing_mass', M.stoneW, 20, 8.2, 14, -22, 0, 0);
box(W, 'west_wing_moss_plinth', M.moss, 20.3, 0.45, 14.3, -22, 0, 0);
box(W, 'west_wing_string_course', M.stoneWT, 20.3, 0.28, 14.3, -22, 4.0, 0);
box(W, 'west_wing_eave_course', M.stoneWT, 20.4, 0.4, 14.4, -22, 7.85, 0);
gable(W, 'west_wing_roof', M.slateMoss, M.stoneW, 14, 7, 20, -22, 8.2, 0, true, 0.7);
box(W, 'west_cross_gable_mass', M.stoneW, 6, 8.2, 11, -26, 0, 4);
box(W, 'west_cross_gable_plinth', M.moss, 6.3, 0.45, 11.3, -26, 0, 4);
box(W, 'west_cross_gable_string', M.stoneWT, 6.3, 0.28, 11.3, -26, 4.0, 4);
gable(W, 'west_cross_gable_roof', M.slateMoss, M.stoneW, 6, 5.5, 11, -26, 8.2, 4, false, 0.5);
for (const x of [-27.3, -24.7]) win(W, x, 2.3, 9.5, 0, 1.0, 1.8, 'heavy', M.stoneWT);
win(W, -26, 6.0, 9.5, 0, 1.3, 2.0, 'heavy mull', M.stoneWT);
oculus(W, -26, 10.4, 9.5, 0, 0.5, M.stoneWT);
for (const x of [-21.5, -16.5, -13.8]) win(W, x, 2.3, 7, 0, 1.0, 1.8, 'heavy', M.stoneWT);
for (const x of [-21.5, -19.2, -16.5, -13.8]) win(W, x, 6.0, 7, 0, 1.0, 1.8, 'heavy', M.stoneWT);
door(W, -19.2, 0.5, 7, 0, 1.3, 2.5, M.woodDark, M.stoneWT);
box(W, 'west_door_hood', M.stoneWT, 2.2, 0.3, 0.9, -19.2, 3.25, 7.4);
box(W, 'west_door_step', M.stoneWT, 2.0, 0.5, 1.0, -19.2, 0, 7.5);
for (const x of [-24, -19, -15.5]) for (const y of [2.3, 6.0]) win(W, x, y, -7, PI, 1.0, 1.8, 'heavy', M.stoneWT);
for (const z of [-2, 4.5]) for (const y of [2.3, 6.0]) win(W, -32, y, z, -PI / 2, 1.0, 1.8, 'heavy', M.stoneWT);
box(W, 'nw_tower_mass', M.stoneW, 5.5, 14, 5.5, -30.5, 0, -6.5);
box(W, 'nw_tower_moss_plinth', M.moss, 5.8, 0.5, 5.8, -30.5, 0, -6.5);
box(W, 'nw_tower_eave_course', M.stoneWT, 5.9, 0.4, 5.9, -30.5, 13.7, -6.5);
pyr(W, 'nw_tower_roof', M.slateMoss, 6.5, 6.5, 5.2, -30.5, 14, -6.5);
cyl(W, 'nw_tower_finial', M.iron, 0.04, 0.07, 1.4, 6, -30.5, 19.1, -6.5);
for (const y of [3.0, 9.0, 12.0]) win(W, -30.5, y, -9.25, PI, 0.7, 1.4, 'heavy', M.stoneWT);
for (const y of [5.5, 11.5]) win(W, -33.25, y, -6.5, -PI / 2, 0.7, 1.4, 'heavy', M.stoneWT);
win(W, -27.75, 10.5, -8.2, PI / 2, 0.6, 1.2, 'heavy', M.stoneWT);
box(W, 'west_gable_chimney', M.stoneW, 2.4, 17.6, 1.6, -33.0, 0, 1.5);
box(W, 'west_gable_chimney_cap', M.stoneWT, 2.8, 0.35, 2.0, -33.0, 17.6, 1.5);
for (const x of [-33.5, -32.5]) cyl(W, 'chimney_pot', M.brick, 0.2, 0.24, 0.8, 10, x, 17.95, 1.5);
box(W, 'great_chimney_oversized', M.stoneW, 3.2, 19, 2.2, -13.4, 0, -2);
box(W, 'great_chimney_cap', M.stoneWT, 3.6, 0.4, 2.6, -13.4, 19, -2);
for (const x of [-14.3, -13.4]) cyl(W, 'chimney_pot', M.brick, 0.22, 0.26, 0.9, 10, x, 19.4, -2);
box(W, 'ivy_cross_gable', M.ivy, 1.0, 6.5, 0.25, -28.4, 0, 9.6);
box(W, 'ivy_tower_north', M.ivy, 2.0, 8.5, 0.25, -31.7, 0, -9.35);
const bh = box(W, 'cellar_bulkhead_hatch', M.woodDark, 1.6, 0.5, 1.5, -17, 0, -7.7); bh.rotation.x = 0.32;

// --- The seam: 1.5 m blank link between 1874 and 1911 work ---
box(manor, 'seam_link_mass', M.stone11, 1.6, 12.2, 10, -11.25, 0, 0);
box(manor, 'seam_link_lead_cap', M.lead, 1.9, 0.25, 10.3, -11.25, 12.2, 0);
win(manor, -11.25, 6.2, 5, 0, 0.8, 2.2, 'hood', M.lime, M.stone11);

// --- Central hall 1911: tall ashlar, off-centre entrance gable ---
const C = grp(manor, 'central_hall_1911');
box(C, 'central_hall_mass', M.stone11, 21, 14.5, 17, 0, 0, -0.5);
box(C, 'central_base_course', M.lime, 21.4, 1.0, 17.4, 0, 0, -0.5);
box(C, 'central_string_1', M.lime, 21.3, 0.25, 17.3, 0, 5.0, -0.5);
box(C, 'central_string_2', M.lime, 21.3, 0.25, 17.3, 0, 9.6, -0.5);
box(C, 'central_cornice', M.lime, 21.7, 0.45, 17.7, 0, 14.1, -0.5);
gable(C, 'central_roof', M.slate, M.stone11, 17, 9, 21, 0, 14.5, -0.5, true, 0.7);
box(C, 'entrance_gable_mass', M.stone11, 9, 14.5, 10.5, 1.5, 0, 5.25);
box(C, 'entrance_gable_base', M.lime, 9.4, 1.0, 10.9, 1.5, 0, 5.25);
box(C, 'entrance_gable_string', M.lime, 9.3, 0.25, 10.8, 1.5, 5.0, 5.25);
box(C, 'entrance_gable_cornice', M.lime, 9.7, 0.45, 10.9, 1.5, 14.1, 5.45);
gable(C, 'entrance_gable_roof', M.slate, M.stone11, 9, 7.5, 10.5, 1.5, 14.5, 5.25, false, 0.6);
win(C, 1.5, 9.6, 10.5, 0, 3.0, 6.6, 'great', M.lime);
box(C, 'datestone_1911', M.lime, 1.4, 0.6, 0.18, 1.5, 15.3, 10.5);
oculus(C, 1.5, 17.6, 10.5, 0, 0.6, M.lime);
door(C, 1.5, 1.0, 10.5, 0, 2.2, 3.3, M.woodDark, M.lime);
for (const [x, z] of [[-1.9, 11.3], [4.9, 11.3], [-1.9, 16.6], [4.9, 16.6]]) box(C, 'porte_cochere_pier', M.lime, 0.8, 4.4, 0.8, x, 0, z);
box(C, 'porte_cochere_entablature', M.lime, 8.2, 0.8, 6.8, 1.5, 4.4, 13.9);
mesh(C, 'porte_cochere_parapet', merge([bx(8.2, 0.5, 0.3, 1.5, 5.45, 17.15), bx(0.3, 0.5, 6.8, -2.45, 5.45, 13.9), bx(0.3, 0.5, 6.8, 5.45, 5.45, 13.9)]), M.lime);
box(C, 'porte_cochere_lead', M.lead, 7.6, 0.04, 6.2, 1.5, 5.2, 13.9);
box(C, 'entrance_landing', M.lime, 5, 1.0, 1.6, 1.5, 0, 11.3);
box(C, 'entrance_step_1', M.lime, 5.6, 0.66, 0.4, 1.5, 0, 12.3);
box(C, 'entrance_step_2', M.lime, 6.2, 0.33, 0.4, 1.5, 0, 12.7);
for (const x of [-8.3, -5.0, 8.4]) { win(C, x, 2.9, 8, 0, 1.4, 2.6, 'hood', M.lime); win(C, x, 7.3, 8, 0, 1.4, 2.6, 'hood', M.lime); win(C, x, 11.9, 8, 0, 1.4, 2.0, 'hood', M.lime); }
win(C, 6, 7.3, 9.2, PI / 2, 0.9, 2.0, 'hood', M.lime);
win(C, -3, 7.3, 9.2, -PI / 2, 0.9, 2.0, 'hood', M.lime);
win(C, -4, 8.6, -9, PI, 1.8, 8.6, 'great', M.lime);
for (const x of [4.6, 8.2]) for (const [y, h] of [[2.9, 2.6], [7.3, 2.6], [11.9, 2.0]]) win(C, x, y, -9, PI, 1.4, h, 'hood', M.lime);
door(C, 1.5, 1.0, -9, PI, 1.8, 2.8, M.woodDark, M.lime);
for (const z of [6.6, -7.2]) for (const [y, h] of [[2.9, 2.6], [7.3, 2.6], [11.9, 2.0]]) win(C, -10.5, y, z, -PI / 2, 1.1, h, 'hood', M.lime);
for (const [y, h] of [[2.9, 2.6], [11.9, 2.0]]) win(C, 10.5, y, 7.1, PI / 2, 0.9, h, 'hood', M.lime);
dormer(C, 'central_dormer', -6.5, 7.1, 15.6, 2, 2.6, 3, M.stone11, M.slate, M.lime);
dormer(C, 'central_dormer', 8.0, 7.1, 15.6, 2, 2.6, 3, M.stone11, M.slate, M.lime);
box(C, 'central_chimney_west', M.stone11, 1.4, 26.5, 1.8, -8.6, 0, -3.6);
box(C, 'central_chimney_east', M.stone11, 1.4, 25.8, 1.8, 8.8, 0, -5.0);
box(C, 'central_chimney_west_cap', M.lime, 1.8, 0.35, 2.2, -8.6, 26.5, -3.6);
box(C, 'central_chimney_east_cap', M.lime, 1.8, 0.35, 2.2, 8.8, 25.8, -5.0);
box(C, 'ridge_cresting', M.iron, 21, 0.4, 0.06, 0, 23.45, -0.5);
for (const x of [-10.9, 10.9]) cyl(C, 'gable_finial', M.iron, 0.03, 0.06, 1.3, 6, x, 23.3, -0.5);
cyl(C, 'entrance_gable_finial', M.iron, 0.03, 0.06, 1.5, 6, 1.5, 21.9, 10.8);
for (const [x, z] of [[-10.35, 8.15], [10.35, 8.15], [-3.15, 10.65], [6.15, 10.65]]) cyl(C, 'downpipe', M.iron, 0.07, 0.07, 14.1, 8, x, 0, z);
box(C, 'entrance_yew_west', M.yew, 5.5, 1.1, 1.0, -6.25, 0, 9.2);
box(C, 'entrance_yew_east', M.yew, 3.5, 1.1, 1.0, 8.25, 0, 9.2);

// --- East wing 1926: refined clapboard, bay, veranda, turret ---
const E = grp(manor, 'east_wing_1926');
box(E, 'east_wing_stone_base', M.stone11, 18.6, 1.3, 12.2, 19.75, 0, 0);
box(E, 'east_wing_mass', M.paintE, 18.5, 8.3, 12, 19.75, 0, 0);
{ const L = []; for (let y = 1.6; y < 7.6; y += 0.32) L.push(bx(18.56, 0.03, 12.06, 19.75, y, 0)); mesh(E, 'east_clapboard_lines', merge(L), M.clapLine); }
for (const [x, z] of [[10.62, 6.02], [28.88, 6.02], [28.88, -6.02], [10.62, -6.02]]) box(E, 'corner_board', M.trimW, 0.26, 7.0, 0.26, x, 1.3, z);
box(E, 'east_frieze', M.trimW, 18.8, 0.5, 12.3, 19.75, 7.8, 0);
gable(E, 'east_wing_roof', M.slate, M.paintE, 12, 5.5, 18.5, 19.75, 8.3, 0, true, 0.7);
for (const x of [12.4, 21.6, 24.6]) { win(E, x, 3.0, 6, 0, 1.2, 2.3, 'mull'); win(E, x, 6.3, 6, 0, 1.2, 2.0, 'mull'); }
{
  const bay = new THREE.CylinderGeometry(2.2, 2.2, 7.2, 4, 1, false, -PI / 2, PI); mesh(E, 'east_bay_window', bay, M.paintE, 16.6, 3.6, 6);
  mesh(E, 'east_bay_base', new THREE.CylinderGeometry(2.3, 2.3, 1.3, 4, 1, false, -PI / 2, PI), M.stone11, 16.6, 0.65, 6);
  mesh(E, 'east_bay_roof', new THREE.ConeGeometry(2.5, 1.4, 4, 1, false, -PI / 2, PI), M.slate, 16.6, 7.9, 6);
  for (const th of [-3 * PI / 8, -PI / 8, PI / 8, 3 * PI / 8]) for (const y of [3.0, 6.0]) win(E, 16.6 + 2.03 * Math.sin(th), y, 6 + 2.03 * Math.cos(th), th, 0.9, 1.9, '');
}
box(E, 'veranda_deck', M.woodDark, 8.4, 0.9, 2.8, 23.6, 0, 7.4);
for (const x of [19.6, 22.2, 24.8, 27.4]) cyl(E, 'veranda_column', M.trimW, 0.1, 0.12, 2.9, 12, x, 0.9, 8.6);
{ const r = box(E, 'veranda_roof', M.slate, 8.8, 0.18, 3.2, 23.6, 3.8, 7.5); r.rotation.x = 0.12; }
box(E, 'veranda_beam', M.trimW, 8.6, 0.3, 0.25, 23.6, 3.6, 8.6);
{ const T = grp(E, 'east_turret'); const tx = 29, tz = 6;
  cyl(T, 'turret_body', M.paintE, 3, 3, 16.5, 32, tx, 0, tz);
  cyl(T, 'turret_stone_base', M.stone11, 3.15, 3.15, 1.3, 32, tx, 0, tz);
  const L = []; for (let y = 1.6; y < 15.8; y += 0.32) L.push(cg(3.02, 3.02, 0.03, 32, tx, y, tz)); mesh(T, 'turret_clapboard_lines', merge(L), M.clapLine);
  for (const y of [4.6, 8.6, 12.4]) cyl(T, 'turret_floor_band', M.trimW, 3.07, 3.07, 0.18, 32, tx, y, tz);
  cyl(T, 'turret_frieze', M.trimW, 3.14, 3.14, 0.45, 32, tx, 16.05, tz);
  cyl(T, 'turret_roof', M.slate, 0, 3.6, 6.8, 32, tx, 16.5, tz);
  cyl(T, 'turret_finial', M.copper, 0.03, 0.08, 1.4, 8, tx, 23.2, tz);
  for (const th of [0, PI / 4, PI / 2, 3 * PI / 4]) for (const y of [2.9, 6.6, 10.4]) win(T, tx + 3 * Math.sin(th), y, tz + 3 * Math.cos(th), th, 0.9, 2.0, '');
  for (const th of [0, PI / 4, PI / 2]) win(T, tx + 3 * Math.sin(th), 14.2, tz + 3 * Math.cos(th), th, 0.7, 1.3, '', M.trimW, th === PI / 4 ? M.glassLit : M.glass);
  const lamp = new THREE.PointLight(0xffa04a, 0, 22, 2); lamp.name = 'east_turret_lamp'; lamp.position.set(tx + 4.1 * Math.sin(PI / 4), 14.2, tz + 4.1 * Math.cos(PI / 4)); T.add(lamp); window.__lamp = lamp;
}
for (const z of [-3, 1]) for (const y of [3.0, 6.3]) win(E, 29, y, z, PI / 2, 1.1, 2.0, 'mull');
for (const x of [12.5, 15.5]) for (const y of [3.0, 6.3]) win(E, x, y, -6, PI, 1.1, 2.0, '');
dormer(E, 'east_dormer', 21.6, 4.6, 9.4, 1.8, 2.2, 2.4, M.paintE, M.slate, M.trimW);
dormer(E, 'east_dormer', 25.2, 4.6, 9.4, 1.8, 2.2, 2.4, M.paintE, M.slate, M.trimW);
box(E, 'east_chimney', M.brick, 1.2, 16, 1.0, 25, 0, -2.5);
box(E, 'east_chimney_cap', M.lime, 1.5, 0.3, 1.3, 25, 16, -2.5);
// service wing + kitchen
box(E, 'service_wing_mass', M.brick, 10, 5.2, 12, 23, 0, -12);
gable(E, 'service_wing_roof', M.slate, M.brick, 10, 4.5, 12, 23, 5.2, -12, false, 0.5);
for (const z of [-9, -14]) { win(E, 18, 2.2, z, -PI / 2, 1.0, 1.6, ''); win(E, 28, 2.2, z - 1, PI / 2, 1.0, 1.6, ''); }
win(E, 25, 2.2, -18, PI, 1.0, 1.6, '');
door(E, 21, 0.2, -18, PI, 1.1, 2.3, M.doorGreen, M.trimW);
box(E, 'kitchen_door_hood', M.slate, 1.9, 0.15, 1.1, 21, 2.9, -18.6);
box(E, 'kitchen_chimney', M.brick, 1.0, 11.5, 1.0, 26, 0, -15);
// service yard
flatRect(manor, 'service_yard_flags', M.flag, 18, 14, 27, -25, 0.07);
box(manor, 'coal_bunker', M.brick, 2.5, 1.4, 2, 33, 0, -20);
box(manor, 'coal_bunker_lid', M.woodDark, 2.6, 0.08, 2.1, 33, 1.4, -20);
for (const z of [-19.6, -20.5]) cyl(manor, 'ash_bin', M.iron, 0.33, 0.3, 0.95, 14, 19.4, 0, z - 0.6);
cyl(manor, 'water_butt', M.woodDark, 0.45, 0.4, 1.1, 14, 18.6, 0, -18.7);
mesh(manor, 'clothesline', merge([cg(0.05, 0.05, 2.4, 6, 22, 1.2, -28), cg(0.05, 0.05, 2.4, 6, 31, 1.2, -28), bx(9, 0.02, 0.02, 26.5, 2.3, -28)]), M.woodDark);
{ const L = []; for (let i = 0; i < 24; i++) { const g = new THREE.CylinderGeometry(0.11, 0.11, 0.9, 6); g.rotateZ(PI / 2); g.translate(33.5 + (i % 6) * 0.05, 0.12 + Math.floor(i / 6) * 0.2, -30 + (i % 6) * 0.22); L.push(g); } mesh(manor, 'woodpile_service', merge(L), M.bark); }

// --- Gallery + private observatory (square to true north) ---
const obsW = toW(11.5, -25), MX = obsW.x;
{
  const A = toW(9.0, -9.2), B = new THREE.Vector3(MX, 0, obsW.z + 3.1);
  const d = new THREE.Vector3().subVectors(B, A), len = Math.hypot(d.x, d.z), a = Math.atan2(d.x, d.z), mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2;
  const G = grp(model, 'observatory_gallery', mx, 0, mz, a);
  box(G, 'gallery_base', M.lime, 2.8, 1.0, len, 0, 0, 0);
  box(G, 'gallery_walls', M.stone11, 2.6, 3.0, len, 0, 1.0, 0);
  box(G, 'gallery_roof', M.lead, 3.0, 0.3, len + 0.2, 0, 4.0, 0);
  for (const t of [-0.28, 0.08]) { win(G, 1.3, 2.6, t * len, PI / 2, 0.7, 1.4, 'hood', M.lime); win(G, -1.3, 2.6, t * len, -PI / 2, 0.7, 1.4, 'hood', M.lime); }
  const O = grp(model, 'observatory_1911', MX, 0, obsW.z);
  mesh(O, 'observatory_plinth', new THREE.CylinderGeometry(3.9, 4.1, 1.0, 8), M.lime, 0, 0.5, 0, PI / 8);
  mesh(O, 'observatory_drum', new THREE.CylinderGeometry(3.3, 3.4, 6.5, 8), M.stone11, 0, 4.25, 0, PI / 8);
  mesh(O, 'observatory_cornice', new THREE.CylinderGeometry(3.62, 3.62, 0.4, 8), M.lime, 0, 7.7, 0, PI / 8);
  mesh(O, 'observatory_dome', new THREE.SphereGeometry(3.25, 48, 24, 0, 2 * PI, 0, PI / 2), M.copper, 0, 7.9, 0);
  const sl = new THREE.TorusGeometry(3.27, 0.3, 6, 32, PI); sl.scale(1, 1, 0.5); sl.rotateY(PI / 2); mesh(O, 'dome_meridian_slit', sl, M.iron, 0, 7.9, 0);
  cyl(O, 'dome_finial', M.copper, 0.04, 0.12, 0.9, 8, 0, 11.1, 0);
  mesh(O, 'dome_finial_ball', new THREE.SphereGeometry(0.16, 12, 8), M.copper, 0, 12.05, 0);
  const f = 3.3 * Math.cos(PI / 8);
  win(O, f, 4.5, 0, PI / 2, 0.6, 1.6, 'hood', M.lime); win(O, -f, 4.5, 0, -PI / 2, 0.6, 1.6, 'hood', M.lime);
  win(O, 0, 5.2, -f, PI, 0.45, 2.6, 'hood', M.lime);
  box(O, 'observatory_moss_plinth', M.moss, 0.1, 0.1, 0.1, 0, 0, 0).visible = false;
}

// --- Rear terrace + lawn ---
box(manor, 'rear_terrace', M.stone11, 19, 1.0, 10, -2.5, 0, -14);
box(manor, 'rear_terrace_coping', M.lime, 19.3, 0.12, 10.3, -2.5, 0.92, -14);
balustrade(manor, 'terrace_balustrade_north_w', -11.9, -18.95, 0, -18.95, 1.0);
balustrade(manor, 'terrace_balustrade_north_e', 3.0, -18.95, 6.9, -18.95, 1.0);
balustrade(manor, 'terrace_balustrade_west', -11.9, -9.3, -11.9, -18.95, 1.0);
balustrade(manor, 'terrace_balustrade_east', 6.9, -9.3, 6.9, -18.95, 1.0);
for (const x of [-0.15, 3.15]) { box(manor, 'terrace_step_pier', M.lime, 0.5, 2.0, 0.5, x, 0, -18.95); cyl(manor, 'terrace_urn', M.lime, 0.32, 0.18, 0.55, 12, x, 2.0, -18.95); }
for (let i = 0; i < 3; i++) box(manor, 'terrace_step', M.lime, 3, 0.75 - i * 0.25, 0.42, 1.5, 0, -19.2 - i * 0.42);
flatDisc(manor, 'rear_lawn', M.lawn, 1, 2, -50, 0.03, 64, 32, 38);
flatDisc(manor, 'front_lawn', M.lawn, 1, 1.5, 32, 0.03, 64, 42, 26);
flatDisc(manor, 'west_lawn', M.lawn, 1, -48, 2, 0.03, 48, 24, 28);
flatDisc(manor, 'east_lawn', M.lawn, 1, 44, 8, 0.03, 48, 16, 20);

// --- Motor court + octagonal fountain ---
const CC = { x: 1.5, z: 34 };
flatDisc(manor, 'motor_court_gravel', M.gravel, 16, CC.x, CC.z, 0.06, 72);
flatRect(manor, 'entrance_forecourt_gravel', M.gravel, 11, 10, 1.5, 15.5, 0.06);
flatDisc(manor, 'court_island_lawn', M.lawnIsland, 7.5, CC.x, CC.z, 0.08, 48);
{ const t = new THREE.TorusGeometry(7.5, 0.16, 6, 64); t.rotateX(PI / 2); mesh(manor, 'court_island_kerb', t, M.lime, CC.x, 0.08, CC.z); }
for (const [dx, dz, r, s] of [[-9.5, 4, 1.4, 0.6], [8, -6, 1.1, 0.8], [-3, 11.5, 1.8, 0.5], [11, 8, 0.9, 1.2]]) flatDisc(manor, 'court_puddle', M.puddle, r, CC.x + dx, CC.z + dz, 0.1, 24, 1, s);
{
  const F = grp(manor, 'octagonal_fountain', CC.x, 0, CC.z, -YAW);
  const oct = r => { const s = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = i * PI / 4 + PI / 8; const fn = i ? 'lineTo' : 'moveTo'; s[fn](r * Math.sin(a), r * Math.cos(a)); } s.closePath(); return s; };
  mesh(F, 'fountain_base_step', new THREE.CylinderGeometry(4.0, 4.15, 0.22, 8), M.lime, 0, 0.11, 0, PI / 8);
  const sh = oct(3.6); sh.holes.push(oct(3.25)); const rim = new THREE.ExtrudeGeometry(sh, { depth: 0.75, bevelEnabled: false }); rim.rotateX(-PI / 2); mesh(F, 'fountain_basin_wall', rim, M.stone11, 0, 0.22, 0);
  const sh2 = oct(3.72); sh2.holes.push(oct(3.15)); const cop = new THREE.ExtrudeGeometry(sh2, { depth: 0.14, bevelEnabled: false }); cop.rotateX(-PI / 2); mesh(F, 'fountain_coping', cop, M.lime, 0, 0.97, 0);
  mesh(F, 'fountain_moss_band', new THREE.CylinderGeometry(3.68, 3.68, 0.2, 8, 1, true), M.moss, 0, 0.32, 0, PI / 8);
  mesh(F, 'fountain_water', new THREE.CylinderGeometry(3.28, 3.28, 0.04, 8), M.water, 0, 0.78, 0, PI / 8);
  cyl(F, 'fountain_pedestal', M.lime, 0.42, 0.62, 1.7, 8, 0, 0.22, 0, PI / 8);
  const prof = [[0.3, 0], [1.5, 0.42], [1.65, 0.6], [1.55, 0.62], [0.3, 0.2]].map(([a, b]) => new THREE.Vector2(a, b));
  mesh(F, 'fountain_lower_bowl', new THREE.LatheGeometry(prof, 8), M.lime, 0, 1.9, 0);
  mesh(F, 'fountain_lower_bowl_water', new THREE.CylinderGeometry(1.5, 1.5, 0.03, 8), M.water, 0, 2.42, 0);
  cyl(F, 'fountain_upper_column', M.lime, 0.16, 0.24, 1.1, 8, 0, 2.4, 0);
  const ub = mesh(F, 'fountain_upper_bowl', new THREE.LatheGeometry(prof, 8), M.lime, 0, 3.45, 0); ub.scale.set(0.48, 0.6, 0.48);
  mesh(F, 'fountain_finial', new THREE.SphereGeometry(0.17, 12, 8), M.lime, 0, 3.95, 0);
}
for (const a of [0.6, -0.6, PI - 0.6, PI + 0.6]) lamp(manor, CC.x + 17 * Math.sin(a), CC.z + 17 * Math.cos(a));
shrubs(manor, 'court_rhododendrons', M.rhodo, [[-15, 22, 1.8], [-17.5, 26, 2.2], [-19, 31, 1.9], [-18.5, 37, 2.1], [-16, 44, 1.7], [19, 24, 1.8], [21, 29, 2.0], [20.5, 41, 1.9], [17, 46, 1.6], [-10, 49.5, 1.5], [13, 49.5, 1.5]]);
shrubs(manor, 'terrace_rhododendrons', M.rhodo, [[-14.5, -12, 1.4], [-15, -16.5, 1.7], [9, -20, 1.3]]);

// ============ ESTATE (true-north frame) ============
const ES = grp(model, 'estate_grounds');
const Cw = toW(CC.x, CC.z);
const drivePts = [toW(1.5, 50), toW(4, 64), new THREE.Vector3(24, 0, 94), new THREE.Vector3(30, 0, 124), new THREE.Vector3(14, 0, 153), new THREE.Vector3(-14, 0, 179), new THREE.Vector3(-34, 0, 199), new THREE.Vector3(-42, 0, 214)];
const drive = ribbon(ES, 'gravel_drive', M.gravel, drivePts, 5.5, 0.055);
flatDisc(ES, 'front_meadow', M.lawnLong, 1, 8, 62, 0.025, 64, 47, 27);
const GT = drive.curve.getPointAt(1), Gt = drive.curve.getTangentAt(1);
const lane = ribbon(ES, 'county_lane_beyond_gate', M.dirt, [GT, GT.clone().addScaledVector(Gt, 18), new THREE.Vector3(GT.x + Gt.x * 34 - 10, 0, GT.z + Gt.z * 34 + 4)], 5, 0.05);
for (const t of [0.18, 0.33, 0.47, 0.71, 0.86]) { const q = drive.curve.getPointAt(t); flatDisc(ES, 'drive_puddle', M.puddle, R(0.8, 1.6), q.x + R(-1, 1), q.z, 0.1, 20, 1, R(0.4, 0.8), R(0, 3)); }
for (const t of [0.12, 0.3, 0.5, 0.7, 0.88]) { const q = drive.curve.getPointAt(t), tg = drive.curve.getTangentAt(t); lamp(ES, q.x - tg.z * 3.6, q.z + tg.x * 3.6); }
const svc = ribbon(ES, 'service_drive', M.gravel, [toW(17, 33), toW(28, 31), new THREE.Vector3(46, 0, 26), new THREE.Vector3(62, 0, 19)], 4, 0.055);
const svcN = ribbon(ES, 'service_yard_track', M.gravel, [toW(34, -24), new THREE.Vector3(50, 0, -18), new THREE.Vector3(66, 0, -6)], 3.5, 0.055);
const wPath = ribbon(ES, 'west_garden_path', M.gravel, [toW(-14.5, 33), toW(-30, 22), new THREE.Vector3(-50, 0, 12), new THREE.Vector3(-64, 0, 4), new THREE.Vector3(-76, 0, 0)], 2.2, 0.055);
const cPath = ribbon(ES, 'cottage_path', M.dirt, [new THREE.Vector3(-76, 0, 0), new THREE.Vector3(-90, 0, 4), new THREE.Vector3(-100, 0, 12)], 1.6, 0.05);
const lawnN = toW(2, -86);
const nPath = ribbon(ES, 'cemetery_footpath', M.dirt, [new THREE.Vector3(MX - 2, 0, lawnN.z + 2), new THREE.Vector3(MX - 8, 0, -102), new THREE.Vector3(MX + 3, 0, -121), new THREE.Vector3(MX, 0, -145)], 1.4, 0.05);
// sundial + meridian flags on the lawn (the only visible trace of the axis)
{ const sz = obsW.z - 14; cyl(ES, 'sundial_pedestal', M.lime, 0.24, 0.34, 1.0, 8, MX, 0, sz); cyl(ES, 'sundial_plate', M.copper, 0.42, 0.42, 0.05, 24, MX, 1.0, sz);
  const gn = box(ES, 'sundial_gnomon_north', M.iron, 0.03, 0.3, 0.4, MX, 1.05, sz - 0.05); gn.rotation.x = -0.4;
  const L = []; for (let z = obsW.z - 7; z > lawnN.z + 4; z -= 5.5) if (Math.abs(z - sz) > 2) L.push(bx(0.55, 0.05, 0.55, MX, 0.06, z)); mesh(ES, 'meridian_flagstones', merge(L), M.flag); }
// specimen trees near the house
function conifer(T, Cn, x, z, h, rot = rnd() * 6.28) {
  const tr = new THREE.CylinderGeometry(0.12 + h * 0.01, 0.25 + h * 0.018, h * 0.45, 6); tr.translate(x, h * 0.225, z); T.push(tr);
  for (let i = 0; i < 4; i++) { const ht = h * (0.40 - i * 0.055), r = h * (0.16 - i * 0.03), by = h * (0.2 + i * 0.19); const c = new THREE.ConeGeometry(r, ht, 7); c.rotateY(rot + i); c.translate(x, by + ht / 2, z); Cn.push(c); }
}
function maple(T, Cn, x, z, h) {
  const tr = new THREE.CylinderGeometry(0.2 + h * 0.008, 0.35 + h * 0.015, h * 0.55, 6); tr.translate(x, h * 0.275, z); T.push(tr);
  for (let i = 0; i < 3; i++) { const r = h * R(0.17, 0.24); const g = new THREE.IcosahedronGeometry(r, 1); g.scale(1, 0.8, 1); g.translate(x + R(-1, 1) * h * 0.12, h * R(0.55, 0.78), z + R(-1, 1) * h * 0.12); Cn.push(g); }
}
{ const T = [], Cn = [], Mp = []; const a = toW(-30, -48), b = toW(-24, 47), c = toW(22, -60);
  conifer(T, Cn, a.x, a.z, 40); conifer(T, Cn, c.x, c.z, 31); maple(T, Mp, b.x, b.z, 17);
  mesh(ES, 'specimen_trunks', merge(T), M.bark); mesh(ES, 'specimen_red_cedar_canopy', merge(Cn), M.cedar); mesh(ES, 'specimen_maple_canopy', merge(Mp), M.maple); }

// --- Gate + boundary wall ---
{ const G = grp(ES, 'entrance_gate', GT.x, 0, GT.z, Math.atan2(Gt.x, Gt.z));
  for (const s of [-1, 1]) {
    box(G, 'gate_pier', M.stoneWT, 1.0, 3.6, 1.0, s * 3.3, 0, 0);
    box(G, 'gate_pier_cap', M.lime, 1.3, 0.3, 1.3, s * 3.3, 3.6, 0);
    box(G, 'gate_pier_moss', M.moss, 1.32, 0.06, 1.32, s * 3.3, 3.9, 0);
    mesh(G, 'gate_pier_ball', new THREE.SphereGeometry(0.36, 20, 12), M.lime, s * 3.3, 4.32, 0);
    box(G, 'boundary_wall', M.stoneW, 26, 1.6, 0.6, s * 16.8, 0, 0);
    box(G, 'boundary_wall_cap', M.stoneWT, 26.2, 0.18, 0.75, s * 16.8, 1.6, 0);
    box(G, 'boundary_wall_moss', M.moss, 26.1, 0.3, 0.66, s * 16.8, 0, 0);
    for (let i = 1; i <= 3; i++) box(G, 'boundary_wall_pier', M.stoneW, 0.9, 2.1, 0.9, s * (3.8 + i * 7), 0, 0);
    const L = []; const w = 2.75; const n = 19;
    for (let i = 0; i < n; i++) { const u = i / (n - 1), h = 2.3 + 0.6 * u * u; L.push(cg(0.022, 0.022, h, 5, -s * u * w, 0.15 + h / 2, 0)); }
    for (const y of [0.25, 1.2, 2.2]) L.push(bx(w, 0.06, 0.05, -s * w / 2, y, 0));
    L.push(bx(0.08, 2.4, 0.08, 0, 1.35, 0));
    const leaf = mesh(G, s < 0 ? 'gate_leaf_west' : 'gate_leaf_east_ajar', merge(L), M.iron, s * 2.78, 0, 0);
    if (s > 0) leaf.rotation.y = -0.38;
  }
}

// --- Greenhouse (working) + kitchen garden ---
{ const GH = grp(ES, 'victorian_greenhouse', -76, 0, -6);
  box(GH, 'greenhouse_brick_base', M.brick, 22, 0.8, 8, 0, 0, 0);
  box(GH, 'greenhouse_glass_walls', M.ghGlass, 21.9, 2.6, 7.9, 0, 0.8, 0);
  const rf = new THREE.CylinderGeometry(4, 4, 21.9, 32, 1, true, 0, PI); rf.rotateZ(PI / 2); rf.scale(1, 0.7, 1); mesh(GH, 'greenhouse_glass_roof', rf, M.ghGlass, 0, 3.4, 0);
  for (const s of [-1, 1]) { const c = new THREE.CircleGeometry(3.95, 32, 0, PI); c.rotateY(PI / 2); c.scale(1, 0.7, 1); mesh(GH, 'greenhouse_end_glass', c, M.ghGlass, s * 10.95, 3.4, 0); }
  const L = [];
  for (let x = -11; x <= 11.01; x += 2) { const t = new THREE.TorusGeometry(4, 0.05, 5, 24, PI); t.rotateY(PI / 2); t.scale(1, 0.7, 1); t.translate(x, 3.4, 0); L.push(t); L.push(bx(0.08, 2.6, 0.08, x, 2.1, 3.98), bx(0.08, 2.6, 0.08, x, 2.1, -3.98)); }
  L.push(bx(22, 0.1, 0.12, 0, 3.4, 3.98), bx(22, 0.1, 0.12, 0, 3.4, -3.98), bx(22, 0.32, 0.6, 0, 6.2, 0));
  mesh(GH, 'greenhouse_iron_frame', merge(L), M.trimW);
  box(GH, 'greenhouse_vestibule', M.ghGlass, 3, 3.2, 2.4, 0, 0, 5.2);
  mesh(GH, 'greenhouse_vestibule_frame', merge([bx(3.1, 0.1, 2.5, 0, 3.2, 5.2), bx(0.1, 3.2, 0.1, -1.5, 1.6, 6.4), bx(0.1, 3.2, 0.1, 1.5, 1.6, 6.4), bx(0.1, 2.3, 0.1, -0.55, 1.15, 6.42), bx(0.1, 2.3, 0.1, 0.55, 1.15, 6.42)]), M.trimW);
  gable(GH, 'greenhouse_vestibule_roof', M.ghGlass, null, 3, 1.4, 2.4, 0, 3.2, 5.2, false, 0.1, 0.05, 0.05);
  for (const z of [-2.4, 2.4]) box(GH, 'potting_bench', M.woodDark, 20, 0.9, 1.2, 0, 0, z);
  { const P = []; for (let i = 0; i < 70; i++) { const g = new THREE.IcosahedronGeometry(R(0.25, 0.6), 0); g.translate(R(-9.5, 9.5), 1.1 + R(0, 0.4), (rnd() < 0.5 ? -2.4 : 2.4) + R(-0.4, 0.4)); P.push(g); }
    for (let i = 0; i < 6; i++) { const g = new THREE.IcosahedronGeometry(R(0.9, 1.4), 1); g.translate(-8 + i * 3.2, 1.6, 0); P.push(g); } mesh(GH, 'greenhouse_plants', merge(P), M.plants); }
  box(GH, 'boiler_house', M.brick, 4, 3.2, 3.2, 6, 0, -5.6);
  gable(GH, 'boiler_house_roof', M.slateMoss, M.brick, 3.2, 1.5, 4, 6, 3.2, -5.6, true, 0.3);
  box(GH, 'boiler_chimney', M.brick, 0.9, 8.5, 0.9, 7.4, 0, -6.4);
  door(GH, 4.6, 0, -7.2, PI, 0.9, 2.1, M.doorGreen, M.trimW);
  for (let i = 0; i < 8; i++) { const x = -10 + (i % 4) * 6.4, z = 12 + Math.floor(i / 4) * 8; box(GH, 'raised_bed', M.woodDark, 4.8, 0.45, 1.6, x, 0, z); box(GH, 'raised_bed_soil', M.soil, 4.6, 0.02, 1.4, x, 0.45, z);
    const V = []; for (let k = 0; k < 6; k++) { const g = new THREE.IcosahedronGeometry(0.28, 0); g.translate(x - 2 + k * 0.8, 0.62, z + R(-0.3, 0.3)); V.push(g); } if (i % 3) mesh(GH, 'bed_brassicas', merge(V), M.plants); }
  for (const x of [-10, -6.8]) { box(GH, 'cold_frame', M.woodDark, 2.6, 0.5, 1.3, x, 0, 30); const l = box(GH, 'cold_frame_light', M.ghGlass, 2.6, 0.04, 1.35, x, 0.55, 30); l.rotation.x = 0.12; }
  flatRect(GH, 'kitchen_garden_path', M.gravel, 1.6, 26, 0, 21, 0.055); flatRect(GH, 'kitchen_garden_cross_path', M.gravel, 26, 1.6, 0, 16, 0.055);
  box(GH, 'kitchen_garden_hedge_w', M.yew, 1.0, 1.4, 24, -14, 0, 21); box(GH, 'kitchen_garden_hedge_s_w', M.yew, 12, 1.4, 1.0, -8, 0, 33.5); box(GH, 'kitchen_garden_hedge_s_e', M.yew, 12, 1.4, 1.0, 9, 0, 33.5);
  cyl(GH, 'water_butt', M.woodDark, 0.5, 0.45, 1.2, 14, 11.6, 0, 3.2);
}
// gardener's cottage
{ const K = grp(ES, 'gardeners_cottage', -102, 0, 16, 0.4);
  box(K, 'cottage_stone_base', M.stoneWT, 7.2, 0.6, 5.7, 0, 0, 0);
  box(K, 'cottage_walls', M.shingle, 7, 3.4, 5.5, 0, 0, 0);
  gable(K, 'cottage_roof', M.slateMoss, M.shingle, 5.5, 3.8, 7, 0, 3.4, 0, true, 0.5);
  box(K, 'cottage_chimney', M.stoneWT, 1.1, 8.6, 0.9, -3.9, 0, 0); box(K, 'cottage_chimney_cap', M.lime, 1.3, 0.2, 1.1, -3.9, 8.6, 0);
  door(K, 0.6, 0.4, 2.75, 0, 0.95, 2.1, M.doorGreen, M.trimW);
  gable(K, 'cottage_porch_hood', M.slateMoss, null, 1.8, 0.8, 1.0, 0.6, 2.85, 3.25, false, 0.1, 0.12, 0.05);
  for (const x of [-1.8, 2.4]) win(K, x, 1.8, 2.75, 0, 0.9, 1.2, '');
  win(K, 3.5, 4.5, 0, PI / 2, 0.7, 1.0, ''); win(K, -1.5, 1.8, -2.75, PI, 0.9, 1.2, '');
  const L = []; for (let i = 0; i < 30; i++) { const g = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6); g.rotateX(PI / 2); g.translate(4.1 + (i % 3) * 0.26, 0.12 + Math.floor(i / 3) * 0.13 * 0.9, -1.8 + (i % 5) * 0.03); L.push(g); }
  mesh(K, 'cottage_woodpile', merge(L), M.bark);
  const lt = box(K, 'woodpile_lean_to', M.slateMoss, 1.4, 0.08, 1.4, 4.4, 1.5, -1.8); lt.rotation.z = -0.25;
}

// --- Carriage house garage + vehicles ---
function wheels(g, r, w, xs, zs) { for (const x of xs) for (const z of zs) { const t = new THREE.CylinderGeometry(r, r, w, 20); t.rotateZ(PI / 2); mesh(g, 'tire', t, M.tire, x, r, z); const h = new THREE.CylinderGeometry(r * 0.45, r * 0.45, w + 0.02, 12); h.rotateZ(PI / 2); mesh(g, 'hubcap', h, M.chrome, x, r, z); } }
function sedan1934(p, x, z, ry) { const g = grp(p, 'car_1934_sedan', x, 0, z, ry); const m = M.carBlack;
  box(g, 'sedan_body', m, 1.5, 0.55, 4.4, 0, 0.5, -0.05); box(g, 'sedan_hood', m, 1.05, 0.5, 1.6, 0, 1.0, 1.3); box(g, 'sedan_cabin', m, 1.5, 0.95, 2.1, 0, 1.0, -0.55);
  box(g, 'sedan_glass', M.glass, 1.52, 0.42, 2.12, 0, 1.38, -0.55);
  for (const s of [-1, 1]) { for (const zz of [1.4, -1.45]) box(g, 'sedan_fender', m, 0.42, 0.36, 1.25, s * 0.82, 0.62, zz); box(g, 'running_board', M.tire, 0.3, 0.06, 1.6, s * 0.86, 0.45, 0); mesh(g, 'headlamp', new THREE.SphereGeometry(0.15, 12, 8), M.chrome, s * 0.55, 1.4, 2.0); }
  box(g, 'sedan_grille', M.chrome, 0.7, 0.62, 0.08, 0, 0.95, 2.12); box(g, 'bumper_f', M.chrome, 1.7, 0.12, 0.12, 0, 0.45, 2.3); box(g, 'bumper_r', M.chrome, 1.7, 0.12, 0.12, 0, 0.45, -2.35);
  const sp = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 18); sp.rotateX(PI / 2); mesh(g, 'spare_wheel', sp, M.tire, 0, 0.95, -2.3); wheels(g, 0.4, 0.22, [-0.82, 0.82], [1.45, -1.45]); }
function pickup1957(p, x, z, ry) { const g = grp(p, 'car_1957_pickup', x, 0, z, ry); const m = M.carSage;
  box(g, 'pickup_hood', m, 1.9, 0.6, 1.7, 0, 0.5, 1.75); box(g, 'pickup_cab', m, 1.9, 1.45, 1.5, 0, 0.5, 0.2); box(g, 'pickup_glass', M.glass, 1.92, 0.5, 1.4, 0, 1.38, 0.2);
  box(g, 'pickup_bed', m, 1.9, 0.75, 2.3, 0, 0.5, -1.75); box(g, 'pickup_bed_floor', M.interior, 1.7, 0.02, 2.1, 0, 1.26, -1.75);
  box(g, 'pickup_grille', M.chrome, 1.6, 0.35, 0.06, 0, 0.6, 2.6); box(g, 'bumper_f', M.chrome, 2.0, 0.16, 0.14, 0, 0.4, 2.65); wheels(g, 0.42, 0.26, [-0.86, 0.86], [1.6, -1.6]); }
function wagon1966(p, x, z, ry) { const g = grp(p, 'car_1966_station_wagon', x, 0, z, ry);
  box(g, 'wagon_body', M.carMaroon, 1.95, 0.7, 5.3, 0, 0.36, 0); box(g, 'wagon_cabin', M.carMaroon, 1.85, 0.55, 3.2, 0, 1.06, -0.6); box(g, 'wagon_glass', M.glass, 1.87, 0.4, 3.22, 0, 1.13, -0.6);
  box(g, 'wagon_roof', M.carCream, 1.86, 0.08, 3.2, 0, 1.6, -0.6);
  for (const s of [-1, 1]) box(g, 'wagon_wood_panel', M.woodPanel, 0.02, 0.32, 4.4, s * 0.985, 0.52, -0.1);
  box(g, 'bumper_f', M.chrome, 2.0, 0.14, 0.14, 0, 0.42, 2.7); box(g, 'bumper_r', M.chrome, 2.0, 0.14, 0.14, 0, 0.42, -2.7); wheels(g, 0.36, 0.24, [-0.86, 0.86], [1.7, -1.6]); }
function estate1988(p, x, z, ry) { const g = grp(p, 'car_1988_estate', x, 0, z, ry);
  box(g, 'estate_body', M.carNavy, 1.75, 0.75, 4.8, 0, 0.34, 0); box(g, 'estate_cabin', M.carNavy, 1.65, 0.62, 2.9, 0, 1.09, -0.45); box(g, 'estate_glass', M.glass, 1.67, 0.44, 2.92, 0, 1.15, -0.45);
  for (const s of [-1, 1]) box(g, 'roof_rail', M.iron, 0.05, 0.06, 2.6, s * 0.72, 1.72, -0.5);
  box(g, 'bumper_f', M.tire, 1.8, 0.2, 0.2, 0, 0.36, 2.42); box(g, 'bumper_r', M.tire, 1.8, 0.2, 0.2, 0, 0.36, -2.42); wheels(g, 0.33, 0.2, [-0.78, 0.78], [1.45, -1.45]); }
{ const CH = grp(ES, 'carriage_house_garage', 72, 0, 2, -0.05);
  box(CH, 'carriage_stone_base', M.stone11, 24.2, 0.6, 10.2, 0, 0, 0);
  box(CH, 'carriage_walls', M.carriage, 24, 7.5, 10, 0, 0, 0);
  { const L = []; for (let x = -11.8; x <= 11.8; x += 0.6) { L.push(bx(0.06, 6.9, 0.04, x, 3.9, 5.01), bx(0.06, 6.9, 0.04, x, 3.9, -5.01)); } mesh(CH, 'carriage_battens', merge(L), M.carriage); }
  gable(CH, 'carriage_roof', M.slate, M.carriage, 10, 5, 24, 0, 7.5, 0, true, 0.6);
  box(CH, 'cupola_base', M.trimW, 2, 2.2, 2, 0, 11.4, 0);
  mesh(CH, 'cupola_louvers', merge([bx(1.5, 1.2, 0.05, 0, 12.6, 1.01), bx(1.5, 1.2, 0.05, 0, 12.6, -1.01), bx(0.05, 1.2, 1.5, 1.01, 12.6, 0), bx(0.05, 1.2, 1.5, -1.01, 12.6, 0)]), M.iron);
  pyr(CH, 'cupola_roof', M.copper, 2.6, 2.6, 1.8, 0, 13.6, 0);
  mesh(CH, 'weathervane', merge([cg(0.025, 0.025, 1.4, 5, 0, 16.0, 0), bx(0.04, 0.08, 1.2, 0, 16.4, 0), bx(0.03, 0.25, 0.25, 0, 16.4, -0.55)]), M.iron);
  const bays = [-8.4, -2.8, 2.8, 8.4];
  for (const bx_ of bays) { mesh(CH, 'bay_surround', merge([bx(4.5, 0.4, 0.3, bx_, 4.1, 5.05), bx(0.25, 3.9, 0.3, bx_ - 2.12, 1.95, 5.05), bx(0.25, 3.9, 0.3, bx_ + 2.12, 1.95, 5.05), bx(0.5, 0.6, 0.34, bx_, 4.3, 5.08)]), M.trimW); win(CH, bx_, 5.9, 5, 0, 0.9, 1.0, ''); }
  for (const bx_ of bays.slice(0, 3)) { box(CH, 'carriage_door', M.doorGreen, 4.0, 3.9, 0.1, bx_, 0, 5.03); mesh(CH, 'carriage_door_braces', merge([bx(0.08, 3.9, 0.12, bx_, 1.95, 5.06), bx(0.12, 2.6, 0.12, bx_ - 1, 1.95, 5.08, 0), bx(0.12, 2.6, 0.12, bx_ + 1, 1.95, 5.08, 0)]), M.trimW); }
  box(CH, 'open_bay_interior', M.interior, 4.0, 3.9, 0.1, 8.4, 0, 5.03);
  for (const s of [-1, 1]) box(CH, 'open_bay_door_leaf', M.doorGreen, 0.1, 3.9, 2.0, 8.4 + s * 2.05, 0, 6.05);
  door(CH, -12, 4.0, 0, -PI / 2, 1.6, 2.2, M.doorGreen, M.trimW);
  box(CH, 'hayloft_hoist_beam', M.woodDark, 1.2, 0.2, 0.2, -12.6, 6.8, 0);
  for (const x of [-6, 0, 6]) win(CH, x, 2.4, -5, PI, 1.0, 1.2, '');
  flatRect(CH, 'carriage_apron_gravel', M.gravel, 30, 16, 1, 13, 0.06);
  flatDisc(CH, 'apron_puddle', M.puddle, 1.6, -4, 15, 0.1, 24, 1, 0.5);
  sedan1934(CH, 8.4, 6.0, 0); pickup1957(CH, -7, 13.5, 0.3); wagon1966(CH, -1.2, 12.8, -0.15); estate1988(CH, 14.6, 15.4, 1.25);
  lamp(CH, -13.5, 7);
}

// --- Family cemetery on the meridian ---
const cemZ = -152;
{ const Y = grp(ES, 'family_cemetery', MX, 0, cemZ);
  flatRect(Y, 'cemetery_grass', M.lawnLong, 18, 14, 0, 0, 0.03);
  const L = [], hx = 9, hz = 7;
  const run = (x1, z1, x2, z2) => { const len = Math.hypot(x2 - x1, z2 - z1), n = Math.floor(len / 0.16); for (let i = 0; i <= n; i++) { const t = i / n; L.push(cg(0.016, 0.016, 1.25, 4, x1 + (x2 - x1) * t, 0.85, z1 + (z2 - z1) * t)); } L.push(bx(Math.abs(x2 - x1) + 0.04, 0.05, Math.abs(z2 - z1) + 0.04, (x1 + x2) / 2, 1.3, (z1 + z2) / 2), bx(Math.abs(x2 - x1) + 0.04, 0.05, Math.abs(z2 - z1) + 0.04, (x1 + x2) / 2, 0.45, (z1 + z2) / 2)); };
  run(-hx, -hz, hx, -hz); run(-hx, -hz, -hx, hz); run(hx, -hz, hx, hz); run(-hx, hz, -0.9, hz); run(0.9, hz, hx, hz);
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz], [-0.9, hz], [0.9, hz]]) L.push(bx(0.12, 1.6, 0.12, x, 0.8, z));
  mesh(Y, 'cemetery_iron_railing', merge(L), M.iron);
  mesh(Y, 'cemetery_kerb', merge([bx(18.3, 0.3, 0.35, 0, 0.15, -hz), bx(0.35, 0.3, 14.3, -hx, 0.15, 0), bx(0.35, 0.3, 14.3, hx, 0.15, 0), bx(8.1, 0.3, 0.35, -4.95, 0.15, hz), bx(8.1, 0.3, 0.35, 4.95, 0.15, hz)]), M.grave);
  box(Y, 'mausoleum_vale', M.grave, 3.2, 3.0, 4.0, 0, 0, -4.4);
  box(Y, 'mausoleum_plinth', M.stoneWT, 3.6, 0.4, 4.4, 0, 0, -4.4);
  gable(Y, 'mausoleum_roof', M.grave, M.grave, 3.2, 1.2, 4, 0, 3.0, -4.4, false, 0.25, 0.25, 0.2);
  box(Y, 'mausoleum_iron_door', M.iron, 1.1, 2.0, 0.1, 0, 0.4, -2.38);
  box(Y, 'mausoleum_moss', M.moss, 3.25, 0.25, 4.05, 0, 0.4, -4.4);
  const stones = [[-6, 1.5, 'round'], [-4, 1.6, 'tall'], [-2.2, 1.4, 'cross'], [2.4, 1.5, 'round'], [4.3, 1.4, 'slab'], [6.2, 1.6, 'tall'], [-5.2, 4.2, 'slab'], [-2.8, 4.4, 'round'], [3.2, 4.1, 'cross'], [5.6, 4.4, 'round']];
  for (const [x, z, k] of stones) { const g = grp(Y, 'headstone_' + k, x, 0, z, R(-0.12, 0.12)); g.rotation.z = R(-0.05, 0.05);
    if (k === 'round') { box(g, 'stone', M.grave, 0.75, 0.75, 0.16, 0, 0, 0); const c = new THREE.CylinderGeometry(0.375, 0.375, 0.16, 20, 1, false, 0, PI); c.rotateX(PI / 2); c.rotateZ(-PI / 2); mesh(g, 'stone_top', c, M.grave, 0, 0.75, 0); }
    else if (k === 'tall') { box(g, 'stone', M.grave, 0.6, 1.25, 0.18, 0, 0, 0); box(g, 'stone_moss_cap', M.moss, 0.62, 0.05, 0.2, 0, 1.25, 0); }
    else if (k === 'cross') { box(g, 'stone_base', M.grave, 0.6, 0.25, 0.4, 0, 0, 0); box(g, 'cross_upright', M.grave, 0.14, 1.2, 0.14, 0, 0.25, 0); box(g, 'cross_arm', M.grave, 0.6, 0.14, 0.14, 0, 1.0, 0); }
    else { const s = box(g, 'stone_slab', M.grave, 0.8, 0.95, 0.15, 0, 0, 0); s.rotation.x = -0.1; } }
  { const o = grp(Y, 'obelisk_founder', -0.0, 0, 1.8); box(o, 'obelisk_base', M.stoneWT, 0.9, 0.5, 0.9, 0, 0, 0); cyl(o, 'obelisk_shaft', M.grave, 0.2, 0.33, 2.4, 4, 0, 0.5, 0, PI / 4); pyr(o, 'obelisk_tip', M.grave, 0.3, 0.3, 0.35, 0, 2.9, 0); }
  box(Y, 'cemetery_bench', M.grave, 1.6, 0.45, 0.45, 6.5, 0, -2); 
  { const T = [], Cn = []; conifer(T, Cn, -7, -5.5, 9, 0.4); mesh(Y, 'cemetery_yew_trunk', merge(T), M.bark); mesh(Y, 'cemetery_yew', merge(Cn), M.yew); }
}

// --- Forest (Douglas fir / red cedar / bigleaf maple) ---
{
  const corridors = [[drive.samples, 8], [lane.samples, 7], [svc.samples, 6], [svcN.samples, 5], [wPath.samples, 4], [cPath.samples, 3], [nPath.samples, 2.6]];
  const circles = [[-84, 6, 34], [72, 6, 25], [MX, cemZ, 15], [GT.x, GT.z, 9]];
  const blocked = (x, z) => {
    if (((x - 6) / 64) ** 2 + ((z + 18) / 70) ** 2 < 1) return true;
    if (((x - 8) / 46) ** 2 + ((z - 62) / 26) ** 2 < 1) return true;
    for (const [cx, cz, r] of circles) if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
    for (const [s, d] of corridors) for (let i = 0; i < s.length; i += 2) { const q = s[i]; if ((q.x - x) ** 2 + (q.z - z) ** 2 < d * d) return true; }
    return false;
  };
  const cell = {}, key = (x, z) => Math.floor(x / 6) + ',' + Math.floor(z / 6);
  const T = [], F = [], Cd = [], Mp = [], Mr = [], U = [];
  for (let i = 0; i < 11000; i++) {
    const x = R(-270, 270), z = R(-270, 270); if (x * x + z * z > 265 * 265) continue; if (blocked(x, z)) continue;
    const kx = Math.floor(x / 6), kz = Math.floor(z / 6); let near = false;
    for (let a = -1; a <= 1 && !near; a++) for (let b = -1; b <= 1 && !near; b++) for (const q of cell[(kx + a) + ',' + (kz + b)] || []) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < 30) { near = true; break; }
    if (near) continue; (cell[key(x, z)] ||= []).push([x, z]);
    const r = rnd();
    if (r < 0.1) maple(T, rnd() < 0.6 ? Mp : Mr, x, z, R(12, 19));
    else if (r < 0.24) conifer(T, U, x, z, R(5, 11));
    else conifer(T, rnd() < 0.62 ? F : Cd, x, z, R(22, 44));
  }
  mesh(ES, 'forest_trunks', merge(T), M.bark);
  mesh(ES, 'forest_douglas_fir', merge(F), M.fir);
  mesh(ES, 'forest_red_cedar', merge(Cd), M.cedar);
  mesh(ES, 'forest_understory_fir', merge(U), M.fir);
  mesh(ES, 'forest_bigleaf_maple', merge(Mp), M.maple);
  mesh(ES, 'forest_maple_rust', merge(Mr), M.mapleRust);
}

// ---------- Hidden volumes (reserved for passages / underground) ----------
{
  const HV = grp(manor, 'hidden_volumes_manor');
  vbox(HV, 'VOID_seam_shaft', voidM, 1.0, 18, 3.2, -11.25, -4.5, -0.5);
  vbox(HV, 'VOID_great_chimney_false_flue', voidM, 1.6, 17, 1.0, -13.4, 0.5, -2);
  vbox(HV, 'VOID_nw_tower_mezzanine', voidM, 4.5, 1.4, 4.5, -30.5, 7.6, -6.5);
  vbox(HV, 'VOID_central_gable_wall_cavity', voidM, 0.8, 12.5, 9, -3.4, 1, 4.5);
  vbox(HV, 'VOID_east_wing_party_wall', voidM, 0.8, 7, 10, 14.3, 1, 0);
  const ts = cyl(HV, 'VOID_turret_stair_core', voidM, 1.1, 1.1, 16, 16, 29, 0, 6); ts.visible = false; ts.renderOrder = 10; voids.push(ts);
  vbox(HV, 'UNDER_west_cellar_1874', underM, 18, 3.6, 12, -22, -4, 0);
  vbox(HV, 'UNDER_central_undercroft_1911', underM, 19, 4.2, 15, 0, -4.6, -0.5);
  vbox(HV, 'UNDER_service_coal_cellar', underM, 8, 3, 6, 27, -3.4, -24);
  const HE = grp(model, 'hidden_volumes_estate');
  const A = toW(9.0, -9.2), dz = obsW.z - A.z, dx = MX - A.x;
  vbox(HE, 'UNDER_gallery_tunnel', underM, 2.0, 2.4, Math.hypot(dx, dz), (A.x + MX) / 2, -3.6, (A.z + obsW.z) / 2, Math.atan2(dx, dz));
  const ow = cyl(HE, 'UNDER_observatory_well', underM, 1.4, 1.4, 7, 16, MX, -7, obsW.z); ow.visible = false; ow.renderOrder = 10; voids.push(ow);
  const tl = obsW.z - (cemZ - 4.4);
  vbox(HE, 'UNDER_meridian_tunnel', underM, 2.0, 2.6, tl, MX, -7, (obsW.z + cemZ - 4.4) / 2);
  vbox(HE, 'UNDER_mausoleum_crypt', underM, 3, 2.6, 4, MX, -3.2, cemZ - 4.4);
  vbox(HE, 'UNDER_crypt_shaft', underM, 1.2, 4.6, 1.2, MX, -7, cemZ - 5.6);
  vbox(HE, 'UNDER_greenhouse_boiler_vault', underM, 5, 2.8, 4, -70, -3, -11.6);
  vbox(HE, 'UNDER_carriage_inspection_pit', underM, 1.0, 1.5, 4.5, 72 - 2.8, -1.5, 2.2);
  vbox(HE, 'MERIDIAN_axis_guide', axisM, 0.18, 0.05, 440, MX, 0.15, -10);
}

stage.setObject(model);
stage._ground.visible = false;
model.traverse(o => { if (o.isMesh && (o.material.transparent || /lawn|gravel|path|flag|puddle|ground|drive|track|lane|grass|apron/.test(o.name))) o.castShadow = false; });

// ---------- Atmosphere ----------
renderer.toneMapping = THREE.ACESFilmicToneMapping;
scene.children.filter(o => o.isLight).forEach(l => scene.remove(l));
const hemi = new THREE.HemisphereLight(0x9aaebb, 0x1e2722, 1.4); scene.add(hemi);
const key = new THREE.DirectionalLight(0xc7d4de, 1.0);
key.position.set(-70, 140, 60); key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
Object.assign(key.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 500 }); key.shadow.camera.updateProjectionMatrix();
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.06; scene.add(key); scene.add(key.target);
{ const es = new THREE.Scene(); const g = new THREE.SphereGeometry(10, 32, 16); const col = [], c1 = new THREE.Color(0x8ea2ae), c2 = new THREE.Color(0x1a2224);
  for (let i = 0; i < g.attributes.position.count; i++) { const y = g.attributes.position.getY(i) / 10; const c = c2.clone().lerp(c1, THREE.MathUtils.smoothstep(y, -0.2, 0.6)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(es, 0.04).texture; }
scene.fog = new THREE.FogExp2(0x66747d, 0.0048);
scene.background = new THREE.Color(0x66747d);
const MODES = {
  day: { fog: 0x66747d, dens: 0.0036, hs: 0x9aaebb, hg: 0x1e2722, hi: 1.4, kc: 0xc7d4de, ki: 1.0, env: 0.55, exp: 1.0, win: 0.5, lamp: 0 },
  night: { fog: 0x0c131b, dens: 0.0062, hs: 0x22324a, hg: 0x07090a, hi: 0.95, kc: 0x7d93b5, ki: 0.6, env: 0.2, exp: 1.6, win: 5, lamp: 14 },
};
let mode = 'day', fogMul = 1;
function applyMode() { const s = MODES[mode];
  scene.fog.color.set(s.fog); scene.background.set(s.fog); scene.fog.density = s.dens * fogMul;
  hemi.color.set(s.hs); hemi.groundColor.set(s.hg); hemi.intensity = s.hi; key.color.set(s.kc); key.intensity = s.ki;
  scene.environmentIntensity = s.env; renderer.toneMappingExposure = s.exp; M.glassLit.emissiveIntensity = s.win; window.__lamp.intensity = s.lamp;
  stage.style.setProperty('--stage-bg', '#' + new THREE.Color(s.fog).getHexString()); rainMat.color.set(mode === 'night' ? 0x4c5d70 : 0xa8b9c5); }

// rain
const RN = 6000, rpos = new Float32Array(RN * 6), roff = new Float32Array(RN * 3);
for (let i = 0; i < RN; i++) { roff[i * 3] = R(-55, 55); roff[i * 3 + 1] = R(0, 45); roff[i * 3 + 2] = R(-55, 55); }
const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
const rainMat = new THREE.LineBasicMaterial({ color: 0xa8b9c5, transparent: true, opacity: 0.32 });
const rain = new THREE.LineSegments(rg, rainMat); rain.frustumCulled = false; scene.add(rain);
applyMode();

// camera
camera.near = 0.4; camera.far = 2500; camera.updateProjectionMatrix();
controls.maxPolarAngle = 1.53; controls.minDistance = 2; controls.maxDistance = 650;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const tw = (lx, lz, y) => toW(lx, lz, y);
const turretWin = toW(29 + 3 * Math.sin(PI / 4), 6 + 3 * Math.cos(PI / 4), 14.2);
const views = {
  'Overview': [V(62, 72, 92), V(2, 2, 2)],
  'Approach': [drive.curve.getPointAt(0.13).add(V(0, 2.2, 0)), tw(1.5, 4, 9)],
  'Motor court': [tw(-8, 54, 3.2), tw(1.5, 20, 6)],
  'Rear terrace': [tw(-8, -52, 6), tw(0, -10, 9)],
  'Observatory': [V(MX - 16, 9, obsW.z - 18), V(MX, 6, obsW.z)],
  'East turret': [tw(52, 36, 16), turretWin],
  'Greenhouse': [V(-60, 6, 18), V(-76, 2, -4)],
  'Carriage house': [V(63, 3.6, 26), V(72, 2.5, 6)],
  'Cemetery': [V(MX + 8, 3.6, cemZ + 10), V(MX, 1.2, cemZ - 2)],
  'Gate': [GT.clone().addScaledVector(Gt, 14).add(V(0, 3, 0)), GT.clone().add(V(0, 2.4, 0))],
};
let tween = null;
function go(name, instant) { const [p, t] = views[name]; if (instant) { camera.position.copy(p); controls.target.copy(t); controls.update(); return; } tween = { p0: camera.position.clone(), t0: controls.target.clone(), p, t, s: performance.now() }; }
go('Overview', true); window.__go = go;
const gotoEl = document.getElementById('goto');
for (const n of Object.keys(views)) { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { if (walking) exitWalk(); go(n); }; gotoEl.appendChild(b); }
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); applyMode(); });
document.getElementById('rain').onchange = e => rain.visible = e.target.checked;
document.getElementById('fog').oninput = e => { fogMul = +e.target.value; applyMode(); };
document.getElementById('voids').onchange = e => voids.forEach(v => v.visible = e.target.checked);

// walk mode
let walking = false, yaw = 0, pitch = 0, drag = null; const keys = {}; const clock = new THREE.Clock();
const walkBtn = document.getElementById('walk');
function enterWalk() {
  walking = true; tween = null; walkBtn.classList.add('on'); walkBtn.textContent = 'Exit walk (Esc)';
  const d = new THREE.Vector3().subVectors(controls.target, camera.position); yaw = Math.atan2(-d.x, -d.z); pitch = 0;
  const f = V(-Math.sin(yaw), 0, -Math.cos(yaw));
  camera.position.set(controls.target.x - f.x * 10, 1.7, controls.target.z - f.z * 10);
  controls.enabled = false; camera.near = 0.08; camera.updateProjectionMatrix(); clock.getDelta();
  renderer.setAnimationLoop(walkLoop);
}
function exitWalk() {
  walking = false; walkBtn.classList.remove('on'); walkBtn.textContent = 'Walk at eye level · 1.7 m';
  const f = V(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  controls.target.copy(camera.position).addScaledVector(f, 8); controls.enabled = true; camera.near = 0.4; camera.updateProjectionMatrix();
  renderer.setAnimationLoop(stage._loop);
}
function walkLoop() {
  const dt = Math.min(clock.getDelta(), 0.05), sp = (keys.ShiftLeft || keys.ShiftRight ? 8 : 3.2) * dt;
  const fw = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), st = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  camera.position.x += (-Math.sin(yaw) * fw + Math.cos(yaw) * st) * sp; camera.position.z += (-Math.cos(yaw) * fw - Math.sin(yaw) * st) * sp; camera.position.y = 1.7;
  camera.rotation.set(pitch, yaw, 0, 'YXZ'); renderer.render(scene, camera);
}
walkBtn.onclick = () => walking ? exitWalk() : enterWalk();
addEventListener('keydown', e => { if (!walking) return; keys[e.code] = true; if (e.code === 'Escape') exitWalk(); if (e.code.startsWith('Arrow')) e.preventDefault(); });
addEventListener('keyup', e => keys[e.code] = false);
stage.addEventListener('pointerdown', e => { if (walking) drag = [e.clientX, e.clientY]; });
addEventListener('pointerup', () => drag = null);
addEventListener('pointermove', e => { if (!walking || !drag) return; yaw -= (e.clientX - drag[0]) * 0.004; pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - drag[1]) * 0.004)); drag = [e.clientX, e.clientY]; });

// tick: rain + fly-to
let last = performance.now();
(function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (tween) { const k = Math.min((now - tween.s) / 1400, 1), e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
    camera.position.lerpVectors(tween.p0, tween.p, e); controls.target.lerpVectors(tween.t0, tween.t, e); if (k >= 1) tween = null; }
  if (rain.visible) { const c = walking ? camera.position : controls.target;
    rainMat.opacity = walking ? 0.32 : Math.min(0.32, 0.32 * 45 / Math.max(1, camera.position.distanceTo(controls.target)));
    for (let i = 0; i < RN; i++) { let y = roff[i * 3 + 1] - 11 * dt; if (y < 0) y += 45; roff[i * 3 + 1] = y;
      const x = c.x + roff[i * 3], z = c.z + roff[i * 3 + 2], o = i * 6; rpos[o] = x; rpos[o + 1] = y; rpos[o + 2] = z; rpos[o + 3] = x + 0.06; rpos[o + 4] = y + 0.6; rpos[o + 5] = z + 0.02; }
    rg.attributes.position.needsUpdate = true; }
  requestAnimationFrame(tick);
})(last);
