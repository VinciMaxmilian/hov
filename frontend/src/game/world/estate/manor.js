import { THREE, PI, M, R, rnd, mesh, box, cyl, grp, bx, cg, sg, merge, mm, col, walk, proxy, room, slab, wall, ringWall, stairRun, spiral, gableRoof, rafters, pyr, flatRect, shapeSlab, sectorSlab, balus, windowUnit, interiorGroups, rooms } from './core.js';
import * as P from './props.js';

const wn = (at, y, w, h, style = '', x = {}) => ({ at, y, w, h, kind: 'win', style, ...x });
const dn = (at, y, w, h, x = {}) => ({ at, y, w, h, kind: 'door', ...x });
const ah = (at, y, w, h, x = {}) => ({ at, y, w, h, kind: 'arch', ...x });
const ho = (at, y, w, h) => ({ at, y, w, h, kind: 'hole' });

function band(p, name, m, x0, x1, z0, z1, y, h, pr, sides = 'nesw') {
  const L = [];
  if (sides.includes('s')) L.push(bx(x1 - x0 + 2 * pr, h, pr + 0.02, (x0 + x1) / 2, y + h / 2, z1 + pr / 2 - 0.01));
  if (sides.includes('n')) L.push(bx(x1 - x0 + 2 * pr, h, pr + 0.02, (x0 + x1) / 2, y + h / 2, z0 - pr / 2 + 0.01));
  if (sides.includes('e')) L.push(bx(pr + 0.02, h, z1 - z0, x1 + pr / 2 - 0.01, y + h / 2, (z0 + z1) / 2));
  if (sides.includes('w')) L.push(bx(pr + 0.02, h, z1 - z0, x0 - pr / 2 + 0.01, y + h / 2, (z0 + z1) / 2));
  return mm(p, name, L, m);
}
function cornice(p, name, m, x0, x1, z0, z1, y, sides) { band(p, name + '_a', m, x0, x1, z0, z1, y - 0.5, 0.2, 0.08, sides); band(p, name + '_b', m, x0, x1, z0, z1, y - 0.3, 0.18, 0.18, sides); band(p, name + '_c', m, x0, x1, z0, z1, y - 0.12, 0.14, 0.3, sides); }
function grime(p, x0, x1, z0, z1, h, sides, gm) {
  const L = [];
  const q = (w, x, z, ry) => { const g = new THREE.PlaneGeometry(w, h); g.rotateY(ry); g.translate(x, h / 2, z); L.push(g); };
  if (sides.includes('s')) q(x1 - x0, (x0 + x1) / 2, z1 + 0.012, 0); if (sides.includes('n')) q(x1 - x0, (x0 + x1) / 2, z0 - 0.012, PI);
  if (sides.includes('e')) q(z1 - z0, x1 + 0.012, (z0 + z1) / 2, PI / 2); if (sides.includes('w')) q(z1 - z0, x0 - 0.012, (z0 + z1) / 2, -PI / 2);
  const g = merge(L, true); const o = mesh(p, 'foundation_grime', g, gm); o.userData.keepUV = true; o.castShadow = false;
  const pa = g.attributes.position, uv = new Float32Array(pa.count * 2); for (let i = 0; i < pa.count; i++) { uv[i * 2] = 0.5; uv[i * 2 + 1] = 1 - pa.getY(i) / h; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function chimney(p, name, m, x, z, w, d, y0, top, cap = M.limestone_trim, pots = 2) {
  col(box(p, name, m, w, top - y0, d, x, y0, z));
  mm(p, name + '_corbel', [bx(w + 0.2, 0.15, d + 0.2, x, top - 0.6, z), bx(w + 0.3, 0.25, d + 0.3, x, top + 0.12, z)], cap);
  const prof = [[0.16, 0], [0.2, 0.05], [0.15, 0.5], [0.18, 0.6], [0.2, 0.7], [0.17, 0.72]].map(([a, b]) => new THREE.Vector2(a, b));
  const L = []; for (let i = 0; i < pots; i++) { const g = new THREE.LatheGeometry(prof, 16); g.translate(x - w / 2 + (i + 0.5) * w / pots, top + 0.24, z); L.push(g); } mm(p, name + '_pots', L, M.terracotta);
}
function ivy(p, x0, z0, ry, w, h, y0 = 0, dens = 1) {
  const L = []; const n = Math.floor(w * h * 90 * dens);
  for (let i = 0; i < n; i++) { const u = R(0, w), v = R(0, h) * Math.pow(rnd(), 0.6); if (v > h * (0.6 + 0.4 * Math.sin(u * 1.7) ** 2)) continue; const g = new THREE.PlaneGeometry(R(0.12, 0.22), R(0.1, 0.18)); g.rotateY(R(-0.6, 0.6)); g.rotateX(R(-0.5, 0.3)); g.translate(u - w / 2, y0 + v, R(0.02, 0.12)); g.rotateY(ry); g.translate(x0, 0, z0); L.push(g); }
  mm(p, 'ivy_leaves', L, M.ivy);
}
function downpipe(p, x, z, top) { mm(p, 'downpipe', [cg(0.055, 0.055, top - 0.3, 10, x, (top + 0.3) / 2, z), cg(0.09, 0.07, 0.2, 10, x, top - 0.1, z), cg(0.055, 0.055, 0.35, 10, x, 0.2, z + 0.12, PI / 2.6)], M.wrought_iron); mm(p, 'gully_grate', [bx(0.35, 0.04, 0.35, x, 0.02, z + 0.28)], M.wrought_iron); }

export function buildManor(model, YAW, decalM) {
  const manor = grp(model, 'manor', 0, 0, 0, YAW); manor.userData.frame = true;
  const sub = n => { const g = grp(manor, n); g.userData.frameRef = manor; return g; };
  const Wg = sub('west_wing_1874'), Cg = sub('central_hall_1911'), Eg = sub('east_wing_1926'), Sg = sub('seam_link'), Vg = sub('service_wing'), Rf = sub('roofs');
  const Ic = sub('interior_central'), Iw = sub('interior_west'), Ie = sub('interior_east'), Ib = sub('interior_basement'), Ia = sub('interior_attics');
  interiorGroups.push({ g: Ic, c: [0, 6, 0] }, { g: Iw, c: [-22, 4, 0] }, { g: Ie, c: [21, 4, -4] }, { g: Ib, c: [-8, -1, 0] }, { g: Ia, c: [-5, 15, 0] });
  const rm = (id, label, boxes, y0, y1, o = {}) => room(manor, id, label, boxes, y0, y1, o);
  const MW = { building: 'West wing 1874' }, MC = { building: 'Central hall 1911' }, ME = { building: 'East wing 1926' };

  // ================= ROOMS =================
  // central ground 1.0
  rm('hall', 'Entrance hall', [[-3, 6, -2, 7.5], [-2.5, 5.5, 7.5, 10]], 1.0, 14.2, { ...MC, floor: 'Ground', fm: M.marble_checker, wm: M.panel_oak, light: [1.5, 8.6, 4.5], i: 60, dist: 22 });
  rm('drawing', 'Drawing room', [[-10, -3, 1, 7.5]], 1.0, 5.3, { ...MC, floor: 'Ground', fm: M.parquet, wm: M.paper_green_damask, flicker: true, light: [-9.2, 1.6, 3.5], i: 14, dist: 11 });
  rm('library', 'Library', [[-10, -3, -8.5, 1]], 1.0, 9.7, { ...MC, floor: 'Ground', fm: M.parquet, wm: M.panel_walnut, light: [-6.5, 6.8, -3.8], i: 34, dist: 16 });
  rm('garden_hall', 'Garden hall', [[-3, 6, -8.5, -2]], 1.0, 5.3, { ...MC, floor: 'Ground', fm: M.flags_interior, wm: M.plaster, i: 12 });
  rm('back_stair_g', 'Back stair', [[6, 10, -8.5, 2]], 1.0, 5.3, { ...MC, floor: 'Ground', fm: M.floorboards, holes: [[6.2, 7.5, -7.5, -3]], i: 8 });
  rm('cloak', 'Cloakroom', [[6, 10, 2, 4.7]], 1.0, 5.3, { ...MC, floor: 'Ground', fm: M.floorboards, wm: M.paper_ochre_stripe, i: 8 });
  rm('washroom', 'Guest washroom', [[6, 10, 4.7, 7.5]], 1.0, 5.3, { ...MC, floor: 'Ground', fm: M.tile_white, wm: M.tile_white, i: 8 });
  // central first 5.6
  rm('gallery', 'First-floor gallery', [[-3, 6, -2, 1.12]], 5.6, 9.7, { ...MC, floor: 'First', fm: M.parquet, wm: M.panel_oak, i: 14 });
  rm('master', 'Master bedroom', [[-10, -3, 1, 7.5]], 5.6, 9.7, { ...MC, floor: 'First', fm: M.parquet, wm: M.paper_rose_floral, flicker: true, light: [-9.2, 6.2, 3.5], i: 12, dist: 11 });
  slab(manor, 'library_mezzanine', -10, -3, -8.5, 1, 5.6, 0.3, M.parquet, M.panel_walnut, [[-8.8, -4.2, -7.3, -0.2], [-10, -8.35, -8.5, -6.9]]);
  rm('rear_corr_1', 'Upper corridor', [[-3, 6, -8.5, -6.5]], 5.6, 9.7, { ...MC, floor: 'First', fm: M.floorboards, i: 8 });
  rm('sitting', 'Family sitting room', [[-3, 3, -6.5, -2]], 5.6, 9.7, { ...MC, floor: 'First', fm: M.parquet, wm: M.paper_blue_stripe, i: 12 });
  rm('passage_1', 'Passage', [[3, 6, -6.5, -2]], 5.6, 9.7, { ...MC, floor: 'First', fm: M.floorboards, i: 6 });
  rm('back_stair_1', 'Back stair', [[6, 10, -8.5, 2]], 5.6, 9.7, { ...MC, floor: 'First', fm: M.floorboards, holes: [[8.6, 9.9, -5.4, 0.5]], i: 8 });
  rm('master_bath', 'Master bathroom', [[6, 10, 2, 7.5]], 5.6, 9.7, { ...MC, floor: 'First', fm: M.tile_white, wm: M.tile_white, i: 8 });
  // central second 10.0
  rm('nursery', 'Nursery', [[-10, -3, 1, 7.5]], 10.0, 14.2, { ...MC, floor: 'Second', fm: M.floorboards, wm: M.paper_cream_floral, i: 10 });
  rm('governess', "Governess's room", [[-10, -3, -8.5, 1]], 10.0, 14.2, { ...MC, floor: 'Second', fm: M.floorboards, wm: M.paper_ochre_stripe, i: 8 });
  rm('rear_corr_2', 'Top corridor', [[-3, 6, -8.5, -6.5]], 10.0, 14.2, { ...MC, floor: 'Second', fm: M.floorboards, i: 6 });
  rm('guest_2', 'North guest room', [[-3, 6, -6.5, 1.12]], 10.0, 14.2, { ...MC, floor: 'Second', fm: M.parquet, wm: M.paper_teal_damask, i: 10 });
  rm('back_stair_2', 'Back stair', [[6, 10, -8.5, 2]], 10.0, 14.2, { ...MC, floor: 'Second', fm: M.floorboards, holes: [[6.2, 7.5, -5.4, 0.2]], i: 6 });
  rm('bath_2', 'Top bathroom', [[6, 10, 2, 7.5]], 10.0, 14.2, { ...MC, floor: 'Second', fm: M.tile_white, wm: M.tile_white, i: 6 });
  rm('attic_c', 'Central attic', [[-10, 10, -8.5, 7.5], [-2.5, 5.5, 7.5, 10]], 14.5, 23, { ...MC, floor: 'Attic', fm: M.attic_boards, wm: M.raw_planks, holes: [[8.6, 9.9, -5.1, 0.5]], light: [0, 17.5, -0.5], i: 10, dist: 16, col: 0xffc890 });
  // central basement -2.6
  const BS = { ...MC, floor: 'Basement', fm: M.flags_interior, wm: M.cellar_stone, col: 0xffc080, i: 9, dist: 11 };
  rm('cellar_corr', 'Cellar corridor', [[-10, 10, -8.5, -6.5]], -2.6, 0.7, BS);
  rm('wine', 'Wine cellar', [[-10, -1, -6.5, 1]], -2.6, 0.7, BS);
  rm('boiler', 'Boiler room', [[-1, 10, -6.5, 1]], -2.6, 0.7, { ...BS, col: 0xff9a50 });
  rm('archive', 'Archive', [[-10, 1.5, 1, 7.5]], -2.6, 0.7, BS);
  rm('coal', 'Coal & stores', [[1.5, 10, 1, 7.5]], -2.6, 0.7, BS);
  rm('passage_w', 'Old passage', [[-12.7, -10, -0.6, 0.6]], -2.6, 0.2, { ...BS, i: 4 });
  // west 0.5 / 4.3 / 8.2
  rm('old_hall', 'Old hall', [[-21, -12.7, -6.3, 6.3]], 0.5, 4.0, { ...MW, floor: 'Ground', fm: M.flags_interior, wm: M.panel_oak, flicker: true, light: [-14.9, 1.2, -2], i: 18, dist: 14 });
  rm('estate_office', 'Estate office', [[-31.3, -21, 0, 6.3], [-28.3, -23.7, 6.3, 8.8]], 0.5, 4.0, { ...MW, floor: 'Ground', fm: M.floorboards, wm: M.paper_teal_damask, flicker: true, light: [-30.7, 1.2, 1.5], i: 12 });
  rm('morning_old', 'Old morning room', [[-31.3, -21, -6.3, 0], [-32.55, -28.45, -8.55, -6.3], [-32.55, -31.3, -6.3, -4.45]], 0.5, 4.0, { ...MW, floor: 'Ground', fm: M.floorboards, wm: M.paper_ochre_stripe, on: false, i: 8 });
  rm('upper_hall_w', 'Old upper hall', [[-21, -12.7, -6.3, 0]], 4.3, 7.9, { ...MW, floor: 'First', fm: M.floorboards, wm: M.panel_oak, holes: [[-18.85, -13.3, -6.3, -4.9], [-16.6, -13.2, -1.4, -0.4]], i: 8 });
  rm('widow', "Widow's bedroom", [[-21, -12.7, 0, 6.3]], 4.3, 7.9, { ...MW, floor: 'First', fm: M.floorboards, wm: M.paper_cream_floral, i: 10 });
  rm('study_w', "Founder's study", [[-31.3, -21, -6.3, 0], [-32.55, -28.45, -8.55, -6.3], [-32.55, -31.3, -6.3, -4.45]], 4.3, 7.9, { ...MW, floor: 'First', fm: M.floorboards, wm: M.paper_green_damask, i: 10 });
  rm('aunt', 'West bedroom', [[-31.3, -21, 0, 6.3], [-28.3, -23.7, 6.3, 8.8]], 4.3, 7.9, { ...MW, floor: 'First', fm: M.floorboards, wm: M.paper_blue_stripe, on: false, i: 8 });
  rm('attic_w', 'West attic', [[-31.3, -12.7, -6.3, 6.3], [-28.3, -23.7, 6.3, 8.8]], 8.2, 14.8, { ...MW, floor: 'Attic', fm: M.attic_boards, wm: M.raw_planks, holes: [[-16.6, -13.2, -1.4, -0.4]], light: [-22, 10.8, 0], i: 7, dist: 14, col: 0xffc890 });
  rm('tower_top', 'Tower room', [[-32.55, -28.45, -8.55, -4.45]], 10.6, 13.9, { ...MW, floor: 'Tower', fm: M.floorboards, wm: M.plaster, holes: [[-32.1, -29.6, -8.25, -7.55]], on: false, i: 6 });
  rm('cellar_w', 'Old cellar', [[-31.3, -12.7, -6.3, 6.3]], -2.4, 0.2, { ...BS, building: 'West wing 1874', i: 7 });
  slab(manor, 'tower_void_floor', -32.55, -28.45, -8.55, -6.3, 7.6, 0.3, M.raw_planks, M.ceiling_plaster, [[-32.1, -28.9, -8.25, -7.55]]);
  // seam
  rm('seam_g', 'The seam', [[-12, -10.5, -4.6, 4.6]], 0.5, 4.0, { building: 'Seam', floor: 'Ground', fm: M.flags_interior, wm: M.plaster, on: false, i: 4 });
  rm('seam_f', 'Seam stair', [[-12, -10.5, -4.6, -2.4]], 4.3, 12, { building: 'Seam', floor: 'First', fm: M.floorboards, wm: M.plaster, on: false, i: 4 });
  rm('seam_f2', 'Seam landing', [[-12, -10.5, 1.1, 3.8]], 5.6, 12, { building: 'Seam', floor: 'First', fm: M.floorboards, wm: M.plaster, on: false, i: 4 });
  // east 1.0 / 5.0 / 8.3
  rm('dining', 'Dining room', [[10.5, 20, -5.7, 5.7], [14.6, 18.6, 5.7, 7.8]], 1.0, 4.7, { ...ME, floor: 'Ground', fm: M.parquet, wm: M.paper_red_damask, light: [15.25, 3.9, 0], i: 30, dist: 14 });
  rm('garden_room', 'Garden room', [[20, 28.7, -5.7, 5.7]], 1.0, 4.7, { ...ME, floor: 'Ground', fm: M.parquet, wm: M.paper_cream_floral, flicker: true, light: [27.8, 1.6, -1], i: 14 });
  rm('daughter', "Daughter's room", [[10.5, 18.6, -5.7, 5.7]], 5.0, 8.0, { ...ME, floor: 'First', fm: M.floorboards, wm: M.paper_rose_floral, i: 10 });
  rm('guest_e', 'East guest room', [[18.6, 23.8, -5.7, 5.7]], 5.0, 8.0, { ...ME, floor: 'First', fm: M.floorboards, wm: M.paper_blue_stripe, on: false, i: 8 });
  rm('bath_e', 'East bathroom', [[23.8, 28.7, -5.7, -1.6]], 5.0, 8.0, { ...ME, floor: 'First', fm: M.tile_white, wm: M.tile_white, i: 6 });
  rm('landing_e', 'East landing', [[23.8, 28.7, -1.6, 5.7]], 5.0, 8.0, { ...ME, floor: 'First', fm: M.floorboards, i: 6 });
  rm('attic_e', 'East attic', [[10.5, 28.7, -5.7, 5.7]], 8.3, 13.6, { ...ME, floor: 'Attic', fm: M.attic_boards, wm: M.raw_planks, holes: [[26.4, 28.4, -1.3, -0.3]], on: false, i: 6, col: 0xffc890 });
  shapeSlab(manor, 'bay_floor_g', [[14.4, 5.7], [15.04, 7.41], [16.6, 8.05], [18.16, 7.41], [18.8, 5.7]], 1.0, 0.3, M.parquet, null);
  shapeSlab(manor, 'bay_floor_1', [[14.4, 5.7], [15.04, 7.41], [16.6, 8.05], [18.16, 7.41], [18.8, 5.7]], 5.0, 0.3, M.floorboards, M.ceiling_plaster);
  // turret: spiral stair tower
  const TX = 29, TZ = 6, tA0 = -3 * PI / 4 + 0.45;
  rm('turret', 'Turret stair', [[26.6, 31.4, 3.6, 8.4]], 1.0, 12.4, { ...ME, floor: 'Turret', slab: false, light: [TX, 8.5, TZ], i: 6, dist: 8 });
  rm('turret_top', 'Turret room', [[26.6, 31.4, 3.6, 8.4]], 12.6, 16.4, { ...ME, floor: 'Turret top', slab: false, light: [TX, 14.6, TZ], i: 9, dist: 7 });
  // service
  rm('kitchen', 'Kitchen', [[18.4, 27.6, -13, -6]], 1.0, 4.6, { ...ME, building: 'Service wing', floor: 'Ground', fm: M.quarry_tile, wm: M.tile_service, i: 20, dist: 13 });
  rm('scullery', 'Scullery', [[18.4, 23, -17.6, -13]], 1.0, 4.6, { building: 'Service wing', floor: 'Ground', fm: M.quarry_tile, wm: M.tile_service, i: 10 });
  rm('larder', 'Larder', [[23, 27.6, -17.6, -13]], 1.0, 4.6, { building: 'Service wing', floor: 'Ground', fm: M.quarry_tile, wm: M.plaster, on: false, i: 6 });
  slab(manor, 'service_ceiling', 18.4, 27.6, -17.6, -6, 4.9, 0.3, M.raw_planks, M.ceiling_plaster);

  // ================= CENTRAL WALLS =================
  const cw = (at, y, h, w = 1.4) => wn(at, y, w, h, 'surround', { trim: M.limestone_trim, frame: M.trim_paint_white });
  const C3 = (at, w = 1.4, skip = []) => [[1.6, 2.6], [6.0, 2.6], [10.9, 2.0]].filter((_, i) => !skip.includes(i)).map(([y, h]) => cw(at, y, h, w));
  const CE = { t: 0.5, y0: 0, h: 14.5, ext: M.ashlar_1911, int: 'auto', trim: M.limestone_trim };
  wall(Cg, { ...CE, name: 'central_s_w', a: [-10, 7.75], b: [-3, 7.75], open: [...C3(-8.3), ...C3(-5.0)] });
  wall(Cg, { ...CE, name: 'central_s_e', a: [6, 7.75], b: [10, 7.75], open: C3(8.4) });
  wall(Cg, { ...CE, name: 'gable_w', a: [-2.75, 7.5], b: [-2.75, 10.5], open: [cw(9.0, 1.6, 2.0, 0.8), cw(9.0, 6.0, 2.0, 0.9)] });
  wall(Cg, { ...CE, name: 'gable_e', a: [5.75, 10.5], b: [5.75, 7.5], open: [cw(9.0, 1.6, 2.0, 0.8), cw(9.0, 6.0, 2.0, 0.9)] });
  wall(Cg, { ...CE, name: 'gable_front', a: [-3, 10.25], b: [6, 10.25], open: [dn(1.5, 1.0, 2.2, 3.3, { double: true, leaf: false, trim: M.limestone_trim }), wn(1.5, 6.3, 3.0, 6.6, 'great', { trim: M.limestone_trim, frame: M.limestone_trim }), cw(-1.1, 1.6, 2.4, 0.55), cw(4.1, 1.6, 2.4, 0.55)] });
  wall(Cg, { ...CE, name: 'central_e', a: [10.25, 8], b: [10.25, -9], open: [cw(7.1, 1.6, 2.6, 0.9), cw(7.1, 10.9, 2.0, 0.9), dn(1.5, 1.0, 1.0, 2.4, { leaf: false }), dn(1.25, 5.6, 0.9, 2.2, { leaf: false }), ...C3(-7.5, 0.9)] });
  wall(Cg, { ...CE, name: 'central_n', a: [10, -8.75], b: [-10, -8.75], open: [cw(8.4, 6.0, 2.6), cw(8.4, 10.9, 2.0), dn(7.6, 1.0, 1.2, 2.6, { leaf: false }), ...C3(4.6), dn(1.5, 1.0, 1.8, 2.8, { double: true, leaf: false, trim: M.limestone_trim }), cw(1.5, 6.0, 2.6, 1.6), cw(1.5, 10.9, 2.0), cw(-1.0, 10.9, 2.0, 1.2), wn(-4, 4.3, 1.8, 5.4, 'great', { trim: M.limestone_trim, frame: M.trim_paint_white }), cw(-7.5, 1.6, 2.6, 1.2), cw(-6.5, 10.9, 2.0, 1.2)] });
  wall(Cg, { ...CE, name: 'central_w', a: [-10.25, -9], b: [-10.25, 8], open: [...C3(-7.2, 1.1), ...C3(6.6, 1.1), dn(-4, 1.0, 1.0, 2.3, { leaf: false }), dn(2.5, 5.6, 0.9, 2.2, { leaf: false })] });
  // foundations
  const FD = { t: 0.5, y0: -2.9, h: 2.9, ext: M.cellar_stone, int: null, col: true };
  wall(Cg, { ...FD, name: 'found_c_s', a: [-10, 7.75], b: [10, 7.75] }); wall(Cg, { ...FD, name: 'found_c_n', a: [10, -8.75], b: [-10, -8.75] });
  wall(Cg, { ...FD, name: 'found_c_e', a: [10.25, 8], b: [10.25, -9] }); wall(Cg, { ...FD, name: 'found_c_w', a: [-10.25, -9], b: [-10.25, 8], open: [ah(0, -2.6, 1.2, 2.3)] });
  // trims
  band(Cg, 'central_plinth', M.limestone_trim, -10.5, 10.5, -9, 8, 0, 1.0, 0.07, 'new'); band(Cg, 'central_plinth_s', M.limestone_trim, -10.5, -3, 0, 8, 0, 1.0, 0.07, 's'); band(Cg, 'central_plinth_s2', M.limestone_trim, 6, 10.5, 0, 8, 0, 1.0, 0.07, 's'); band(Cg, 'gable_plinth', M.limestone_trim, -3, 6, 8, 10.5, 0, 1.0, 0.07, 'esw');
  for (const y of [5.0, 9.55]) { band(Cg, 'string_course', M.limestone_trim, -10.5, 10.5, -9, 8, y, 0.25, 0.1, 'new'); band(Cg, 'string_course_s', M.limestone_trim, -10.5, -3, 0, 8, y, 0.25, 0.1, 's'); band(Cg, 'string_course_s2', M.limestone_trim, 6, 10.5, 0, 8, y, 0.25, 0.1, 's'); }
  band(Cg, 'gable_string', M.limestone_trim, -3, 6, 8, 10.5, 5.0, 0.25, 0.1, 'ew');
  cornice(Cg, 'central_cornice', M.limestone_trim, -10.5, 10.5, -9, 8, 14.5, 'new'); cornice(Cg, 'central_cornice_s', M.limestone_trim, -10.5, -3, 0, 8, 14.5, 's'); cornice(Cg, 'central_cornice_s2', M.limestone_trim, 6, 10.5, 0, 8, 14.5, 's'); cornice(Cg, 'gable_cornice', M.limestone_trim, -3, 6, 8, 10.5, 14.5, 'esw');
  grime(Cg, -10.5, 10.5, -9, 8, 1.4, 'new', decalM); grime(Cg, -3, 6, 8, 10.5, 1.4, 'esw', decalM);
  box(Cg, 'datestone_1911', M.limestone_trim, 1.4, 0.6, 0.12, 1.5, 15.3, 10.55);
  { const g = grp(Cg, 'gable_oculus', 1.5, 17.6, 10.55); mesh(g, 'oculus_ring', new THREE.TorusGeometry(0.6, 0.12, 10, 40), M.limestone_trim); mesh(g, 'oculus_glass', new THREE.CircleGeometry(0.58, 32), M.glass_window, 0, 0, -0.03); }
  for (const [x, z] of [[-10.45, 8.05], [10.45, 8.05], [-3.05, 10.55], [6.05, 10.55], [-10.45, -9.05], [10.45, -9.05]]) downpipe(Cg, x, z, 14.3);
  // porte-cochere
  { const pc = sub('porte_cochere'); const L = [];
    for (const [x, z] of [[-1.9, 11.3], [4.9, 11.3], [-1.9, 16.6], [4.9, 16.6]]) { L.push(bx(0.95, 0.4, 0.95, x, 0.2, z), bx(0.8, 3.6, 0.8, x, 2.2, z), bx(0.95, 0.3, 0.95, x, 4.15, z)); }
    col(mm(pc, 'porte_cochere_piers', L, M.limestone_trim));
    mm(pc, 'porte_cochere_entablature', [bx(8.2, 0.7, 0.8, 1.5, 4.65, 16.6), bx(8.2, 0.7, 0.8, 1.5, 4.65, 11.3), bx(0.8, 0.7, 6.1, -1.9, 4.65, 13.95), bx(0.8, 0.7, 6.1, 4.9, 4.65, 13.95), bx(8.6, 0.2, 7.1, 1.5, 5.1, 13.95), bx(8.2, 0.5, 0.3, 1.5, 5.45, 17.15), bx(0.3, 0.5, 6.8, -2.45, 5.45, 13.9), bx(0.3, 0.5, 6.8, 5.45, 5.45, 13.9)], M.limestone_trim);
    mm(pc, 'porte_cochere_soffit', [bx(6.0, 0.05, 4.5, 1.5, 4.32, 13.95)], M.ceiling_plaster);
    box(pc, 'porte_cochere_lead', M.lead_flashing, 7.6, 0.04, 6.2, 1.5, 5.2, 13.9);
    walk(box(pc, 'entrance_landing', M.limestone_trim, 5, 1.0, 1.6, 1.5, 0, 11.3)); walk(box(pc, 'entrance_step_1', M.limestone_trim, 5.6, 0.66, 0.4, 1.5, 0, 12.3)); walk(box(pc, 'entrance_step_2', M.limestone_trim, 6.2, 0.33, 0.4, 1.5, 0, 12.7));
    P.pendant(pc, 1.5, 3.9, 13.9, M.brass);
  }
  box(Cg, 'entrance_yew_w', M.yew_hedge, 5.5, 1.1, 1.0, -6.25, 0, 9.2); box(Cg, 'entrance_yew_e', M.yew_hedge, 3.5, 1.1, 1.0, 8.25, 0, 9.2);
  // central partitions
  const PT = { kind: 'part', t: 0.22 };
  wall(Cg, { ...PT, name: 'p_c_xm3_g', a: [-3, -8.5], b: [-3, 7.5], y0: 1.0, h: 4.3, open: [dn(-7.5, 1.0, 1.0, 2.4, { leaf: false }), dn(-0.5, 1.0, 1.4, 2.8, { double: true, leaf: false }), dn(4.5, 1.0, 1.4, 2.8, { double: true, leaf: false })] });
  wall(Cg, { ...PT, name: 'p_c_z1_g', a: [-10, 1], b: [-3, 1], y0: 1.0, h: 4.3, open: [dn(-6.5, 1.0, 1.4, 2.8, { double: true, leaf: false })] });
  wall(Cg, { ...PT, name: 'p_c_zm2_g', a: [-3, -2], b: [6, -2], y0: 1.0, h: 4.3, open: [ah(-1.5, 1.0, 1.6, 3.0, { trim: M.panel_oak }), ah(4.5, 1.0, 1.6, 3.0, { trim: M.panel_oak })] });
  wall(Cg, { ...PT, name: 'p_c_x6_g', a: [6, -8.5], b: [6, 7.5], y0: 1.0, h: 4.3, open: [dn(-8.0, 1.0, 0.9, 2.3), dn(1.25, 1.0, 1.0, 2.4), dn(3.4, 1.0, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_z2_g', a: [6, 2], b: [10, 2], y0: 1.0, h: 4.3 });
  wall(Cg, { ...PT, name: 'p_c_z47_g', a: [6, 4.7], b: [10, 4.7], y0: 1.0, h: 4.3, open: [dn(8, 1.0, 0.8, 2.2)] });
  wall(Cg, { ...PT, name: 'p_c_xm3_1', a: [-3, -8.5], b: [-3, 7.5], y0: 5.6, h: 4.1, open: [dn(-7.5, 5.6, 0.9, 2.3, { leaf: false }), dn(-1.0, 5.6, 0.9, 2.3, { leaf: false })] });
  wall(Cg, { ...PT, name: 'p_c_z1_1', a: [-10, 1], b: [-3, 1], y0: 5.6, h: 4.1, open: [dn(-5.5, 5.6, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_zm65_1', a: [-3, -6.5], b: [6, -6.5], y0: 5.6, h: 4.1, open: [dn(0, 5.6, 0.9, 2.3), dn(4.5, 5.6, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_zm2_1', a: [-3, -2], b: [6, -2], y0: 5.6, h: 4.1, open: [ah(4.5, 5.6, 1.2, 2.5)] });
  wall(Cg, { ...PT, name: 'p_c_x3_1', a: [3, -6.5], b: [3, -2], y0: 5.6, h: 4.1, open: [dn(-4, 5.6, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_x6_1', a: [6, -8.5], b: [6, 7.5], y0: 5.6, h: 4.1, open: [dn(-7.5, 5.6, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_z2_1', a: [6, 2], b: [10, 2], y0: 5.6, h: 4.1, open: [dn(8, 5.6, 0.8, 2.2)] });
  wall(Cg, { ...PT, name: 'p_c_xm3_2', a: [-3, -8.5], b: [-3, 7.5], y0: 10.0, h: 4.2, open: [dn(-7.5, 10.0, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_z1_2', a: [-10, 1], b: [-3, 1], y0: 10.0, h: 4.2, open: [dn(-6.5, 10.0, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_zm65_2', a: [-3, -6.5], b: [6, -6.5], y0: 10.0, h: 4.2, open: [dn(1.5, 10.0, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_z112_2', a: [-3, 1.12], b: [6, 1.12], y0: 10.0, h: 4.2, open: [wn(1.5, 11.0, 2.0, 1.8, 'one', { frame: M.wood_mahogany })] });
  wall(Cg, { ...PT, name: 'p_c_x6_2', a: [6, -8.5], b: [6, 7.5], y0: 10.0, h: 4.2, open: [dn(-7.5, 10.0, 0.9, 2.3)] });
  wall(Cg, { ...PT, name: 'p_c_z2_2', a: [6, 2], b: [10, 2], y0: 10.0, h: 4.2, open: [dn(8, 10.0, 0.8, 2.2)] });
  // basement partitions
  const PB = { ...PT, t: 0.4, core: M.cellar_stone, y0: -2.6, h: 3.3 };
  wall(Cg, { ...PB, name: 'p_b_zm65', a: [-10, -6.5], b: [10, -6.5], open: [dn(-5, -2.6, 1.0, 2.1, { leafM: M.raw_planks }), dn(3, -2.6, 1.0, 2.1, { leafM: M.raw_planks }), ah(6.85, -2.6, 1.5, 3.3)] });
  wall(Cg, { ...PB, name: 'p_b_xm1', a: [-1, -6.5], b: [-1, 1] });
  wall(Cg, { ...PB, name: 'p_b_z1', a: [-10, 1], b: [10, 1], open: [dn(-5, -2.6, 1.0, 2.1, { leafM: M.raw_planks }), dn(5, -2.6, 1.0, 2.1, { leafM: M.raw_planks })] });
  wall(Cg, { ...PB, name: 'p_b_x15', a: [1.5, 1], b: [1.5, 7.5], open: [dn(4, -2.6, 1.0, 2.1, { open: 0.4, leafM: M.raw_planks })] });
  wall(Cg, { ...PB, t: 0.3, name: 'passage_w_n', a: [-12.7, -0.75], b: [-10, -0.75], h: 2.8 }); wall(Cg, { ...PB, t: 0.3, name: 'passage_w_s', a: [-12.7, 0.75], b: [-10, 0.75], h: 2.8 });
  // stairs central
  stairRun(Ic, { name: 'grand_staircase', x: 1.5, z: 7.0, dir: '-z', w: 2.2, y0: 1.0, y1: 5.6, tread: 0.245, mat: M.wood_mahogany, rails: [1, -1], nosingMat: M.brass });
  P.rug(Ic, 1.5, 4.06, 3.3, 1.1, 0.1, M.rug_red).visible = false;
  stairRun(Ic, { name: 'back_stair_1', x: 9.25, z: 0.5, dir: '-z', w: 1.3, y0: 1.0, y1: 5.6, tread: 0.246, mat: M.floorboards, rails: [-1] });
  stairRun(Ic, { name: 'back_stair_2', x: 6.85, z: -5.4, dir: '+z', w: 1.3, y0: 5.6, y1: 10.0, tread: 0.2435, mat: M.floorboards, rails: [-1] });
  stairRun(Ic, { name: 'back_stair_attic', x: 9.25, z: 0.5, dir: '-z', w: 1.3, y0: 10.0, y1: 14.5, tread: 0.233, mat: M.raw_planks, rails: [-1] });
  stairRun(Ic, { name: 'cellar_stair', x: 6.85, z: -7.5, dir: '+z', w: 1.3, y0: -2.6, y1: 1.0, tread: 0.237, mat: M.cellar_stone, rails: [-1], railMat: M.iron_int });
  spiral(Ic, { name: 'library_spiral', cx: -9.2, cz: -7.7, r0: 0.07, r1: 0.72, y0: 1.0, y1: 5.6, a0: PI / 2, P: 2.3, mat: M.iron_int, rail: true });
  balus(Ic, 'gallery_balustrade_w', -3, 1.12, 0.4, 1.12, 5.6, M.wood_mahogany); balus(Ic, 'gallery_balustrade_e', 2.6, 1.12, 6, 1.12, 5.6, M.wood_mahogany);
  balus(Ic, 'mezz_bal_n', -8.35, -7.3, -4.2, -7.3, 5.6, M.wood_mahogany); balus(Ic, 'mezz_bal_s', -8.8, -0.2, -4.2, -0.2, 5.6, M.wood_mahogany); balus(Ic, 'mezz_bal_e', -4.2, -7.3, -4.2, -0.2, 5.6, M.wood_mahogany); balus(Ic, 'mezz_bal_w', -8.8, -6.9, -8.8, -0.2, 5.6, M.wood_mahogany);
  balus(Ic, 'back_stair_guard_1', 7.5, -5.4, 7.5, 0.5, 5.6, M.wood_furniture); balus(Ic, 'back_stair_guard_2', 7.5, -5.4, 7.5, 0.2, 10.0, M.wood_furniture);
  // chimneys central (breasts)
  chimney(Cg, 'central_chimney_w', M.ashlar_1911, -9.7, -1.2, 0.6, 1.8, 1.0, 26.5); chimney(Cg, 'central_chimney_e', M.ashlar_1911, 10.85, -3.0, 0.7, 1.8, 1.0, 25.8);
  // ================= SEAM =================
  const SE = { t: 0.4, y0: 0, h: 12.2, ext: M.ashlar_1911, int: 'auto' };
  wall(Sg, { ...SE, name: 'seam_s', a: [-12, 4.8], b: [-10.5, 4.8], open: [{ at: -11.25, y: 5.1, w: 0.8, h: 2.2, kind: 'blind', style: 'hood' }] });
  wall(Sg, { ...SE, name: 'seam_n', a: [-10.5, -4.8], b: [-12, -4.8] });
  wall(Sg, { kind: 'part', t: 0.15, name: 'seam_false_end', a: [-12, 3.8], b: [-10.5, 3.8], y0: 0.5, h: 11.7, open: [{ at: -11.25, y: 1.3, w: 0.6, h: 0.75, kind: 'hole' }] });
  mm(Sg, 'seam_hatch_frame', [bx(0.72, 0.06, 0.2, -11.25, 1.27, 3.8), bx(0.72, 0.06, 0.2, -11.25, 2.08, 3.8), bx(0.06, 0.81, 0.2, -11.58, 1.68, 3.8), bx(0.06, 0.81, 0.2, -10.92, 1.68, 3.8)], M.raw_planks);
  box(Sg, 'seam_lead_roof', M.lead_flashing, 1.9, 0.25, 10.3, -11.25, 12.2, 0);
  stairRun(Sg, { name: 'seam_steps', x: -11.4, z: -4.0, dir: '+x', w: 1.0, y0: 0.5, y1: 1.0, tread: 0.3, mat: M.flags_interior });
  stairRun(Sg, { name: 'seam_stair', x: -11.25, z: -2.4, dir: '+z', w: 1.2, y0: 4.3, y1: 5.6, tread: 0.5, mat: M.floorboards });
  // ================= WEST WALLS =================
  const ww = (at, y, w = 1.0, h = 1.8) => wn(at, y, w, h, 'heavy', { trim: M.basalt_dressed, frame: M.trim_paint_white });
  const WE = { t: 0.7, y0: 0, h: 8.2, ext: M.basalt_rubble_1874, int: 'auto', trim: M.basalt_dressed };
  wall(Wg, { ...WE, name: 'west_s', a: [-32, 6.65], b: [-12, 6.65], open: [ho(-26, 0.5, 4.6, 7.4), ww(-21.5, 1.4), ww(-16.5, 1.4), ww(-13.8, 1.4), ww(-21.5, 5.1), ww(-19.2, 5.1), ww(-16.5, 5.1), ww(-13.8, 5.1), dn(-19.2, 0.5, 1.3, 2.5, { leaf: false, trim: M.basalt_dressed })] });
  wall(Wg, { ...WE, name: 'west_xgable_s', a: [-29, 9.15], b: [-23, 9.15], open: [ww(-27.3, 1.4), ww(-24.7, 1.4), wn(-26, 5.1, 1.3, 2.0, 'heavy', { trim: M.basalt_dressed })] });
  wall(Wg, { ...WE, name: 'west_xgable_w', a: [-28.65, 6.3], b: [-28.65, 9.5] }); wall(Wg, { ...WE, name: 'west_xgable_e', a: [-23.35, 9.5], b: [-23.35, 6.3] });
  wall(Wg, { ...WE, name: 'west_e', a: [-12.35, 7], b: [-12.35, -7], open: [dn(-4, 0.5, 1.0, 2.3, { leaf: false }), dn(-3, 4.3, 0.9, 2.2)] });
  wall(Wg, { ...WE, name: 'west_n', a: [-12, -6.65], b: [-28.45, -6.65], open: [ww(-24, 1.4), ww(-19, 1.4), ww(-15.5, 1.4), ww(-24, 5.1), ww(-19, 5.1), ww(-15.5, 5.1)] });
  wall(Wg, { ...WE, name: 'west_w', a: [-31.65, -4.45], b: [-31.65, 7], open: [ww(-2, 1.4), ww(4.5, 1.4), ww(-2, 5.1), ww(4.5, 5.1)] });
  const tw = (at, y) => wn(at, y, 0.7, 1.4, 'heavy one', { trim: M.basalt_dressed });
  wall(Wg, { ...WE, h: 14, name: 'tower_w', a: [-32.9, -9.25], b: [-32.9, -3.75], open: [tw(-6.5, 4.8), tw(-6.5, 10.8)] });
  wall(Wg, { ...WE, h: 14, name: 'tower_n', a: [-27.75, -8.9], b: [-33.25, -8.9], open: [tw(-30.5, 2.3), tw(-30.5, 8.3), tw(-30.5, 11.3)] });
  wall(Wg, { ...WE, name: 'tower_e_low', a: [-28.1, -7.0], b: [-28.1, -9.25] });
  wall(Wg, { ...WE, y0: 8.2, h: 5.8, name: 'tower_e_up', a: [-28.1, -3.75], b: [-28.1, -9.25], open: [wn(-8.2, 11.0, 0.6, 1.2, 'heavy one', { trim: M.basalt_dressed })] });
  wall(Wg, { ...WE, y0: 8.2, h: 5.8, name: 'tower_s_up', a: [-33.25, -4.1], b: [-28.1, -4.1] });
  wall(Wg, { ...WE, name: 'tower_s_stub', a: [-33.25, -4.1], b: [-31.3, -4.1] });
  mm(Wg, 'tower_void_shaft', [bx(3.3, 2.7, 0.08, -30.5, 8.95, -7.48), bx(0.08, 2.7, 1.15, -28.86, 8.95, -7.95)], M.raw_planks);
  const WF = { t: 0.7, y0: -2.7, h: 2.7, ext: M.cellar_stone, int: null };
  wall(Wg, { ...WF, name: 'found_w_s', a: [-32, 6.65], b: [-12, 6.65] }); wall(Wg, { ...WF, name: 'found_w_n', a: [-12, -6.65], b: [-32, -6.65] });
  wall(Wg, { ...WF, name: 'found_w_w', a: [-31.65, -7], b: [-31.65, 7] }); wall(Wg, { ...WF, name: 'found_w_e', a: [-12.35, 7], b: [-12.35, -7], open: [ah(0, -2.4, 1.2, 2.3)] });
  for (const [a, b, c, d] of [[-32, -12, -7, 7], [-29, -23, 7, 9.5]]) { band(Wg, 'west_string', M.basalt_dressed, a, b, c, d, 3.9, 0.28, 0.08, b === -12 ? 'enw' : 'esw'); band(Wg, 'west_eave', M.basalt_dressed, a, b, c, d, 7.85, 0.35, 0.15, b === -12 ? 'enw' : 'esw'); band(Wg, 'west_moss_plinth', M.moss, a, b, c, d, 0, 0.45, 0.05, b === -12 ? 'enw' : 'esw'); }
  band(Wg, 'west_string_s', M.basalt_dressed, -32, -29, 0, 7, 3.9, 0.28, 0.08, 's'); band(Wg, 'west_string_s2', M.basalt_dressed, -23, -12, 0, 7, 3.9, 0.28, 0.08, 's');
  band(Wg, 'west_eave_s', M.basalt_dressed, -32, -29, 0, 7, 7.85, 0.35, 0.15, 's'); band(Wg, 'west_eave_s2', M.basalt_dressed, -23, -12, 0, 7, 7.85, 0.35, 0.15, 's');
  band(Wg, 'tower_eave', M.basalt_dressed, -33.25, -27.75, -9.25, -3.75, 13.65, 0.4, 0.18); band(Wg, 'tower_moss', M.moss, -33.25, -27.75, -9.25, -7, 0, 0.5, 0.05, 'new');
  grime(Wg, -32, -12, -7, 7, 1.6, 'nw', decalM); grime(Wg, -29, -23, 7, 9.5, 1.6, 'esw', decalM);
  box(Wg, 'west_door_hood', M.basalt_dressed, 2.2, 0.3, 0.9, -19.2, 3.25, 7.4); walk(box(Wg, 'west_door_step', M.basalt_dressed, 2.0, 0.5, 0.6, -19.2, 0, 7.3)); walk(box(Wg, 'west_door_step_low', M.basalt_dressed, 2.2, 0.25, 0.6, -19.2, 0, 7.9));
  chimney(Wg, 'west_gable_chimney', M.basalt_rubble_1874, -33.0, 1.5, 2.1, 1.8, 0, 17.6, M.basalt_dressed, 2);
  chimney(Wg, 'great_chimney_oversized', M.basalt_rubble_1874, -13.68, -2, 1.95, 2.2, 0.5, 19, M.basalt_dressed, 2);
  ivy(Wg, -28.2, 9.5, 0, 1.6, 6.8, 0, 1.3); ivy(Wg, -31.5, -9.25, PI, 2.4, 9.5, 0, 1.2); ivy(Wg, -32.0, 3, -PI / 2, 5, 5.5, 0, 0.8);
  { const bh = box(Wg, 'cellar_bulkhead_hatch', M.weathered || M.raw_planks, 1.6, 0.5, 1.5, -17, 0, -7.7); bh.rotation.x = 0.32; col(bh); }
  for (const [x, z] of [[-31.95, 7.0], [-12.05, 7.05], [-31.95, -6.95]]) downpipe(Wg, x, z, 8.0);
  // west partitions
  wall(Wg, { ...PT, name: 'p_w_x21_g', a: [-21, -6.3], b: [-21, 6.3], y0: 0.5, h: 3.5, open: [dn(-3, 0.5, 1.0, 2.3), dn(3, 0.5, 1.0, 2.3)] });
  wall(Wg, { ...PT, name: 'p_w_z0_g', a: [-31.3, 0], b: [-21, 0], y0: 0.5, h: 3.5, open: [dn(-24, 0.5, 0.9, 2.3)] });
  wall(Wg, { ...PT, name: 'p_w_x21_1', a: [-21, -6.3], b: [-21, 6.3], y0: 4.3, h: 3.6, open: [dn(-3, 4.3, 0.9, 2.2), dn(3, 4.3, 0.9, 2.2)] });
  wall(Wg, { ...PT, name: 'p_w_z0_1', a: [-31.3, 0], b: [-21, 0], y0: 4.3, h: 3.6, open: [dn(-24, 4.3, 0.9, 2.2)] });
  wall(Wg, { ...PT, name: 'p_w_z0_1e', a: [-21, 0], b: [-12.7, 0], y0: 4.3, h: 3.6, open: [dn(-19.5, 4.3, 0.9, 2.2)] });
  stairRun(Iw, { name: 'old_oak_stair', x: -13.4, z: -5.6, dir: '-x', w: 1.4, y0: 0.5, y1: 4.3, tread: 0.27, mat: M.panel_oak, rails: [-1], railMat: M.panel_oak });
  stairRun(Iw, { name: 'attic_stair_w', x: -13.3, z: -0.9, dir: '-x', w: 0.9, y0: 4.3, y1: 8.2, tread: 0.2, riser: 0.24, mat: M.raw_planks, rails: [1], railMat: M.raw_planks, open: true });
  stairRun(Iw, { name: 'tower_ladder', x: -29.0, z: -7.9, dir: '-x', w: 0.6, y0: 4.3, y1: 10.6, tread: 0.12, riser: 0.25, mat: M.raw_planks, open: true, nosing: false });
  balus(Iw, 'old_stair_guard', -18.85, -4.9, -13.3, -4.9, 4.3, M.panel_oak);
  // ================= EAST WALLS =================
  const ew = (at, y, w = 1.2, h = 2.2) => wn(at, y, w, h, 'hood', { trim: M.trim_paint_white, stone: M.limestone_trim });
  const EB = { t: 0.3, y0: 0, h: 1.3, ext: M.ashlar_1911, int: 'auto', noFit: true }, EU = { t: 0.3, y0: 1.3, h: 7.0, ext: M.clapboard_1926, int: 'auto' };
  const eS = [ew(12.4, 1.85, 1.2, 2.3), ew(12.4, 5.6, 1.2, 2.0), ho(16.6, 1.3, 3.9, 6.7), ew(21.6, 1.85, 1.2, 2.3), ew(21.6, 5.6, 1.2, 2.0), ew(24.6, 1.85, 1.2, 2.3), ew(24.6, 5.6, 1.2, 2.0), dn(23.1, 1.0, 1.0, 2.4, { leaf: false })];
  const eE = [ew(-3, 1.9, 1.1, 2.0), ew(1, 1.9, 1.1, 2.0), ew(-3, 5.6, 1.1, 2.0), ew(1, 5.6, 1.1, 2.0)];
  const eN = [ew(12.5, 1.9, 1.1, 2.0), ew(15.5, 1.9, 1.1, 2.0), ew(12.5, 5.6, 1.1, 2.0), ew(15.5, 5.6, 1.1, 2.0), dn(19, 1.0, 1.0, 2.4, { open: 1.4 })];
  for (const S of [EB, EU]) { wall(Eg, { ...S, name: 'east_s', a: [10.5, 5.85], b: [26.0, 5.85], open: eS }); wall(Eg, { ...S, name: 'east_e', a: [28.85, 3.0], b: [28.85, -6.0], open: eE }); wall(Eg, { ...S, name: 'east_n', a: [28.85, -5.85], b: [10.5, -5.85], open: eN }); }
  band(Eg, 'east_frieze', M.trim_paint_white, 10.5, 28.85, -6, 5.85, 7.8, 0.5, 0.06, 'n'); band(Eg, 'east_frieze_s', M.trim_paint_white, 10.5, 26, -6, 5.85, 7.8, 0.5, 0.06, 's'); band(Eg, 'east_frieze_e', M.trim_paint_white, 10.5, 28.85, -6, 3, 7.8, 0.5, 0.06, 'e');
  band(Eg, 'east_water_table', M.trim_paint_white, 10.5, 28.85, -6, 5.85, 1.3, 0.12, 0.08, 'n'); band(Eg, 'east_water_table_s', M.trim_paint_white, 10.5, 26, -6, 5.85, 1.3, 0.12, 0.08, 's');
  mm(Eg, 'corner_boards', [bx(0.22, 7, 0.22, 28.9, 4.8, -5.9)], M.trim_paint_white);
  grime(Eg, 10.5, 28.85, -6, 5.85, 1.0, 'n', decalM);
  // bay
  { const bc = [16.6, 5.85], br = 2.2, pts = [-PI / 2, -PI / 4, 0, PI / 4, PI / 2].map(a => [bc[0] + br * Math.sin(a), bc[1] + br * Math.cos(a)]);
    for (let i = 0; i < 4; i++) { const op = [ew(null, 1.85, 0.9, 2.0), ew(null, 5.6, 0.9, 1.8)].map(o => ({ ...o, u: Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) / 2 })); wall(Eg, { ...EB, name: 'bay_base', a: pts[i], b: pts[i + 1], open: op, auto: false, int: M.plaster, extA: 0.12, extB: 0.12 }); wall(Eg, { ...EU, name: 'bay_wall', a: pts[i], b: pts[i + 1], open: op, auto: false, int: M.paper_red_damask, extA: 0.12, extB: 0.12, y0: 1.3, h: 6.7 }); }
    mesh(Eg, 'bay_roof', new THREE.ConeGeometry(2.55, 1.4, 4, 1, false, -PI / 2, PI), M.slate_wet, 16.6, 8.7, 5.85); mesh(Eg, 'bay_roof_soffit', new THREE.CylinderGeometry(2.4, 2.4, 0.1, 4, 1, false, -PI / 2, PI), M.trim_paint_white, 16.6, 8.0, 5.85); }
  // veranda
  { const v = sub('veranda'); walk(box(v, 'veranda_deck', M.floorboards, 8.4, 0.9, 2.8, 23.6, 0, 7.4)); mm(v, 'veranda_skirt', [bx(8.4, 0.8, 0.05, 23.6, 0.4, 8.8)], M.trim_paint_white);
    const prof = [[0.1, 0], [0.14, 0.1], [0.08, 0.3], [0.07, 2.5], [0.1, 2.6], [0.13, 2.9]].map(([a, b]) => new THREE.Vector2(a, b));
    const Cl = []; for (const x of [19.6, 22.2, 24.8, 27.4]) { const g = new THREE.LatheGeometry(prof, 16); g.translate(x, 0.9, 8.6); Cl.push(g); } col(mm(v, 'veranda_columns', Cl, M.trim_paint_white));
    const r = box(v, 'veranda_roof', M.slate_wet, 8.8, 0.15, 3.2, 23.6, 3.85, 7.5); r.rotation.x = 0.12; box(v, 'veranda_beam', M.trim_paint_white, 8.6, 0.3, 0.25, 23.6, 3.6, 8.6);
    balus(v, 'veranda_rail_a', 19.6, 8.7, 22.2, 8.7, 0.9, M.trim_paint_white, 0.85); balus(v, 'veranda_rail_b', 24.8, 8.7, 27.4, 8.7, 0.9, M.trim_paint_white, 0.85); balus(v, 'veranda_rail_e', 27.7, 6.2, 27.7, 8.7, 0.9, M.trim_paint_white, 0.85);
    for (let i = 0; i < 3; i++) walk(box(v, 'veranda_step', M.floorboards, 2.4, 0.3 * (i + 1) - 0.0, 0.35, 23.5, 0, 9.85 - i * 0.35)); }
  // turret walls
  const tWin = (ang, y, w = 0.9, h = 1.8, lit) => ({ ang, y, w, h, kind: 'win', style: 'one', trim: M.trim_paint_white, stone: M.trim_paint_white, lit });
  const inside = a => { const x = TX + 3 * Math.sin(a), z = TZ + 3 * Math.cos(a); return x < 28.85 && z < 5.85; };
  const tOpen = [];
  for (const a of [0, PI / 4, PI / 2, 3 * PI / 4]) for (const y of [2.0, 5.8, 9.6]) tOpen.push(tWin(a, y));
  for (const a of [0, PI / 4, PI / 2]) tOpen.push(tWin(a, 13.55, 0.7, 1.3, a === PI / 4));
  tOpen.push({ ang: -3 * PI / 4, y: 1.0, w: 0.85, h: 2.3, kind: 'door', open: 1.2 }, { ang: tA0 - 0.157, y: 5.0, w: 0.85, h: 2.2, kind: 'door', open: 1.2 });
  ringWall(Eg, { name: 'turret_wall', cx: TX, cz: TZ, r: 2.82, seg: 72, t: 0.36, y0: 0, h: 16.5, ext: M.clapboard_1926, int: M.plaster, open: tOpen, skip: inside });
  ringWall(Eg, { name: 'turret_wall_inner', cx: TX, cz: TZ, r: 2.82, seg: 72, t: 0.36, y0: 0, h: 8.3, ext: M.plaster, int: M.plaster, open: tOpen, skip: a => !inside(a) });
  ringWall(Eg, { name: 'turret_wall_inner_up', cx: TX, cz: TZ, r: 2.82, seg: 72, t: 0.36, y0: 8.3, h: 8.2, ext: M.clapboard_1926, int: M.plaster, open: tOpen, skip: a => !inside(a), noFit: true });
  { const T = sub('turret_trim'); mesh(T, 'turret_roof', new THREE.ConeGeometry(3.6, 6.8, 64, 1, true), M.slate_wet, TX, 16.5 + 3.4, TZ); mesh(T, 'turret_ceiling', new THREE.CircleGeometry(2.64, 48).rotateX(PI / 2), M.ceiling_plaster, TX, 16.45, TZ);
    for (const [y, h, r] of [[16.05, 0.45, 3.06], [4.6, 0.18, 3.03], [8.6, 0.18, 3.03], [12.4, 0.18, 3.03], [1.3, 0.12, 3.06]]) mesh(T, 'turret_band', new THREE.CylinderGeometry(r, r, h, 64, 1, true), M.trim_paint_white, TX, y + h / 2, TZ);
    mesh(T, 'turret_base_stone', new THREE.CylinderGeometry(3.05, 3.08, 1.3, 64, 1, true), M.ashlar_1911, TX, 0.65, TZ);
    mm(T, 'turret_finial', [cg(0.03, 0.08, 1.4, 8, TX, 24.0, TZ), sg(0.12, TX, 24.8, TZ)], M.copper_verdigris);
    mm(T, 'turret_gutter', [new THREE.TorusGeometry(3.55, 0.08, 6, 64).rotateX(PI / 2).translate(TX, 16.5, TZ)], M.wrought_iron); }
  spiral(Ie, { name: 'turret_spiral', cx: TX, cz: TZ, r0: 0.2, r1: 2.48, y0: 1.0, y1: 12.6, a0: tA0, P: 4.0, mat: M.wood_mahogany, risers: true, rail: false, postMat: M.wood_mahogany, postTop: 0.95 });
  { const tot = 2 * PI * 11.6 / 4.0, aEnd = tA0 + tot, hole = 3.75; sectorSlab(manor, 'turret_top_floor', TX, TZ, 2.66, 12.6, 0.25, aEnd, 2 * PI - hole, M.floorboards, M.ceiling_plaster); sectorSlab(manor, 'turret_base_floor', TX, TZ, 2.66, 1.0, 0.3, 0, 2 * PI, M.flags_interior, null); balus(Ie, 'turret_top_guard', TX + 0.3 * Math.sin(aEnd - hole), TZ + 0.3 * Math.cos(aEnd - hole), TX + 2.5 * Math.sin(aEnd - hole), TZ + 2.5 * Math.cos(aEnd - hole), 12.6, M.wood_mahogany); }
  // east partitions
  wall(Eg, { ...PT, name: 'p_e_x20_g', a: [20, -5.7], b: [20, 5.7], y0: 1.0, h: 3.7, open: [dn(-1, 1.0, 1.4, 2.6, { double: true })] });
  wall(Eg, { ...PT, name: 'p_e_x186_1', a: [18.6, -5.7], b: [18.6, 5.7], y0: 5.0, h: 3.0, open: [dn(0, 5.0, 0.9, 2.2)] });
  wall(Eg, { ...PT, name: 'p_e_x238_1', a: [23.8, -5.7], b: [23.8, 5.7], y0: 5.0, h: 3.0, open: [dn(2, 5.0, 0.9, 2.2)] });
  wall(Eg, { ...PT, name: 'p_e_zm16_1', a: [23.8, -1.6], b: [28.7, -1.6], y0: 5.0, h: 3.0, open: [dn(26, 5.0, 0.8, 2.2)] });
  stairRun(Ie, { name: 'daughter_steps', x: 11.4, z: 1.25, dir: '-x', w: 1.0, y0: 5.0, y1: 5.6, tread: 0.3, mat: M.floorboards });
  stairRun(Ie, { name: 'east_attic_ladder', x: 26.4, z: -0.8, dir: '+x', w: 0.8, y0: 5.0, y1: 8.3, tread: 0.13, riser: 0.24, mat: M.raw_planks, open: true, nosing: false });
  chimney(Eg, 'east_gable_chimney', M.brick_service, 29.45, -1.0, 1.0, 1.4, 0, 15.5);
  for (const [x, z] of [[10.6, 6.0], [28.95, -6.0]]) downpipe(Eg, x, z, 8.2);
  // service walls
  const SV = { t: 0.4, y0: 0, h: 5.2, ext: M.brick_service, int: 'auto' }, sw = (at, y) => wn(at, y, 1.0, 1.6, '', { trim: M.trim_paint_white, stone: M.limestone_trim });
  wall(Vg, { ...SV, name: 'svc_w', a: [18.2, -17.8], b: [18.2, -6.0], open: [sw(-9, 1.8), sw(-15, 1.8)] });
  wall(Vg, { ...SV, name: 'svc_e', a: [27.8, -6.0], b: [27.8, -18.0], open: [sw(-11, 1.8), sw(-15.5, 1.8)] });
  wall(Vg, { ...SV, name: 'svc_n', a: [28.0, -17.8], b: [18.0, -17.8], open: [sw(25, 1.8), dn(21, 1.0, 1.0, 2.3, { leaf: false })] });
  for (let i = 0; i < 3; i++) walk(box(Vg, 'scullery_step', M.limestone_trim, 1.6, 1.0 - i * 0.33, 0.35, 21, 0, -18.15 - i * 0.35));
  box(Vg, 'kitchen_door_hood', M.slate_wet, 1.9, 0.12, 1.1, 21, 3.5, -18.5);
  wall(Vg, { ...PT, name: 'p_s_z13', a: [18.4, -13], b: [27.6, -13], y0: 1.0, h: 3.6, open: [dn(20.5, 1.0, 0.9, 2.2), dn(25.5, 1.0, 0.9, 2.2)] });
  wall(Vg, { ...PT, name: 'p_s_x23', a: [23, -17.6], b: [23, -13], y0: 1.0, h: 3.6 });
  chimney(Vg, 'kitchen_chimney', M.brick_service, 28.25, -9.0, 0.8, 1.2, 0, 11);
  grime(Vg, 18, 28, -18, -6, 1.0, 'nwe', decalM); downpipe(Vg, 18.0, -18.05, 5.0); downpipe(Vg, 28.0, -18.05, 5.0);

  // ================= ROOFS =================
  const N_ = M.slate_mossy, S_ = M.slate_wet;
  gableRoof(Rf, { name: 'west_roof', span: 14, rise: 7, len: 20, x: -22, y: 8.2, z: 0, alongX: true, mats: [N_, N_], wall: M.basalt_rubble_1874, over: 0.7, bargeM: M.basalt_dressed });
  gableRoof(Rf, { name: 'west_cross_roof', span: 6, rise: 5.5, len: 11, x: -26, y: 8.2, z: 4, mats: [N_, N_], wall: M.basalt_rubble_1874, over: 0.5, bargeM: M.basalt_dressed });
  pyr(Rf, 'nw_tower_roof', N_, 6.6, 6.6, 5.2, -30.5, 14, -6.5); mm(Rf, 'nw_tower_finial', [cg(0.04, 0.07, 1.4, 6, -30.5, 19.8, -6.5), sg(0.1, -30.5, 20.6, -6.5)], M.wrought_iron);
  const cR = gableRoof(Rf, { name: 'central_roof', span: 17, rise: 9, len: 21, x: 0, y: 14.5, z: -0.5, alongX: true, mats: [N_, S_], wall: M.ashlar_1911, over: 0.7, bargeM: M.limestone_trim });
  const gR = gableRoof(Rf, { name: 'entrance_gable_roof', span: 9, rise: 7.5, len: 10.5, x: 1.5, y: 14.5, z: 5.25, mats: [S_, S_], wall: M.ashlar_1911, over: 0.6, bargeM: M.limestone_trim });
  const eR = gableRoof(Rf, { name: 'east_roof', span: 12, rise: 5.5, len: 18.5, x: 19.75, y: 8.3, z: 0, alongX: true, mats: [N_, S_], wall: M.clapboard_1926, over: 0.7 });
  gableRoof(Rf, { name: 'service_roof', span: 10, rise: 4.5, len: 12, x: 23, y: 5.2, z: -12, mats: [S_, N_], wall: M.brick_service, over: 0.5 });
  rafters(Ia, { span: 17, rise: 9, len: 21 }, M.beam_timber); Ia.children[Ia.children.length - 1].position.set(0, 14.5, -0.5); Ia.children[Ia.children.length - 1].rotation.y = PI / 2;
  rafters(Ia, { span: 14, rise: 7, len: 20 }, M.beam_timber); Ia.children[Ia.children.length - 1].position.set(-22, 8.2, 0); Ia.children[Ia.children.length - 1].rotation.y = PI / 2;
  rafters(Ia, { span: 12, rise: 5.5, len: 18.5 }, M.beam_timber); Ia.children[Ia.children.length - 1].position.set(19.75, 8.3, 0); Ia.children[Ia.children.length - 1].rotation.y = PI / 2;
  mm(Rf, 'ridge_cresting', [bx(21, 0.35, 0.05, 0, 23.75, -0.5), ...Array.from({ length: 22 }, (_, i) => cg(0.02, 0.02, 0.5, 5, -10.5 + i, 23.85, -0.5))], M.wrought_iron);
  for (const x of [-10.9, 10.9]) mm(Rf, 'gable_finial', [cg(0.03, 0.06, 1.3, 6, x, 24.2, -0.5), sg(0.09, x, 24.9, -0.5)], M.wrought_iron);
  // dormers (attic windows into central attic)
  for (const dx of [-6.5, 8.0]) { const D = sub('central_dormer'); const zf = 7.1, yb = 15.4;
    wall(D, { t: 0.2, y0: yb, h: 2.6, ext: M.ashlar_1911, int: M.raw_planks, a: [dx - 1, zf], b: [dx + 1, zf], auto: false, open: [wn(dx, yb + 0.6, 0.9, 1.4, 'surround', { trim: M.limestone_trim })] });
    for (const s of [-1, 1]) wall(D, { t: 0.15, y0: yb, h: 2.6, ext: M.lead_flashing, int: M.raw_planks, a: s < 0 ? [dx - 0.95, zf - 3] : [dx + 0.95, zf], b: s < 0 ? [dx - 0.95, zf] : [dx + 0.95, zf - 3], auto: false });
    gableRoof(D, { span: 2, rise: 1.3, len: 3.2, x: dx, y: yb + 2.6, z: zf - 1.5, mats: [S_, S_], over: 0.2, endOver: 0.15, t: 0.12, gutter: false, wall: M.ashlar_1911, bargeM: M.limestone_trim }); }
  for (const dx of [21.6, 25.2]) { const D = sub('east_dormer'); const zf = 4.6, yb = 9.3;
    wall(D, { t: 0.15, y0: yb, h: 2.2, ext: M.clapboard_1926, int: M.raw_planks, a: [dx - 0.9, zf], b: [dx + 0.9, zf], auto: false, open: [wn(dx, yb + 0.5, 0.8, 1.2, 'one', {})] });
    gableRoof(D, { span: 1.8, rise: 1.1, len: 2.6, x: dx, y: yb + 2.2, z: zf - 1.2, mats: [S_, S_], over: 0.2, endOver: 0.15, t: 0.12, gutter: false, wall: M.clapboard_1926 });
    for (const s of [-1, 1]) box(D, 'dormer_cheek', M.clapboard_1926, 0.12, 2.2, 2.4, dx + s * 0.85, yb, zf - 1.2); }

  // ================= TERRACE =================
  walk(col(box(manor, 'rear_terrace', M.ashlar_1911, 17.8, 1.0, 10, -3.1, 0, -14)));
  walk(box(manor, 'rear_terrace_paving', M.flagstone_wet, 17.6, 0.02, 9.8, -3.1, 1.0, -14));
  mm(manor, 'terrace_coping', [bx(18.1, 0.12, 0.35, -3.1, 0.96, -19.0), bx(0.35, 0.12, 10.2, -12.0, 0.96, -14), bx(0.35, 0.12, 10.2, 5.8, 0.96, -14)], M.limestone_trim);
  balus(manor, 'terrace_bal_nw', -11.9, -18.95, -0.15, -18.95, 1.0, M.limestone_trim); balus(manor, 'terrace_bal_ne', 3.15, -18.95, 5.7, -18.95, 1.0, M.limestone_trim);
  balus(manor, 'terrace_bal_w', -11.9, -9.3, -11.9, -18.95, 1.0, M.limestone_trim); balus(manor, 'terrace_bal_e', 5.7, -9.3, 5.7, -18.95, 1.0, M.limestone_trim);
  for (const x of [-0.15, 3.15]) { col(box(manor, 'terrace_step_pier', M.limestone_trim, 0.5, 2.0, 0.5, x, 0, -18.95)); const prof = [[0.12, 0], [0.18, 0.05], [0.12, 0.15], [0.32, 0.45], [0.3, 0.55], [0, 0.55]].map(([a, b]) => new THREE.Vector2(a, b)); mesh(manor, 'terrace_urn', new THREE.LatheGeometry(prof, 24), M.limestone_trim, x, 2.0, -18.95); }
  for (let i = 0; i < 3; i++) walk(box(manor, 'terrace_step', M.limestone_trim, 3, 0.75 - i * 0.25, 0.42, 1.5, 0, -19.2 - i * 0.42));
  { const L = []; for (let i = 0; i < 9; i++) L.push(bx(0.6, 0.03, 0.6, -10 + i * 2.1, 1.025, -12 + (i % 3) * 2.5)); }
  P.chair(manor, -6, -13, 1.0, PI / 4, M.iron_int, M.iron_int); P.chair(manor, -4.6, -12.6, 1.0, -PI / 6, M.iron_int, M.iron_int); P.table(manor, -5.3, -13.6, 1.0, 0.8, 0.8, 0.72, M.iron_int);

  furnish({ Ic, Iw, Ie, Ib, Ia, manor, TX, TZ, tA0 });
  return manor;
}

function furnish({ Ic, Iw, Ie, Ib, Ia, TX, TZ }) {
  // ---- ENTRANCE HALL ----
  { const g = P.chandelier(Ic, 1.5, 9.0, 4.6, 0.95, 12); mm(Ic, 'chandelier_chain', [cg(0.015, 0.015, 4.0, 5, 1.5, 12.2, 4.6)], M.brass);
    P.console_(Ic, -2.65, 2.6, 1.0, PI / 2); // retrato de Elias: Frame do jogo
    P.console_(Ic, 5.65, 5.6, 1.0, -PI / 2); // retrato de Margaret: Frame do jogo
    P.grandfatherClock(Ic, 5.7, 6.9, 1.0, -PI / 2); P.umbrellaStand(Ic, -1.9, 9.5, 1.0); P.coatRack(Ic, 4.8, 9.5, 1.0, 2);
    P.rug(Ic, 1.5, 8.6, 1.0, 1.8, 2.4, M.rug_red); P.candlestick(Ic, -2.65, 1.85, 2.2); P.candlestick(Ic, 5.65, 1.85, 6.0);
    /* retrato de Edmund: Frame do jogo */ P.painting(Ic, -2.87, 7.6, 4.2, PI / 2, 1.1, 1.4, 'land'); P.painting(Ic, 5.87, 7.6, 4.2, -PI / 2, 1.1, 1.4, 'lady');
    const fp = []; for (let i = 0; i < 9; i++) { const z = 9.6 - i * 0.42; fp.push(sg(0.07, 1.25 + (i % 2) * 0.4, 1.012, z, 8, 4, 0.8, 0.05, 1.6)); } mm(Ic, 'wet_footprints', fp, M.puddle);
    P.sconce(Ic, 6 - 0.13, 7.4, 0, -PI / 2); P.console_(Ic, 4.6, -1.7, 5.6, 0, 1.2); P.chair(Ic, -2.0, -1.5, 5.6, 0); P.chair(Ic, -1.2, -1.5, 5.6, 0); P.rug(Ic, 1.5, -0.45, 5.6, 7.5, 2.4, M.rug_red); }
  // ---- DRAWING ROOM ----
  { const f = P.fireplace(Ic, -9.88, 3.5, 1.0, PI / 2, 1.8, M.limestone_trim); P.painting(Ic, -9.9, 3.5, 3.5, PI / 2, 1.3, 0.9, 'land');
    P.armchair(Ic, -8.4, 5.6, 1.0, PI * 0.9, M.fabric_red); P.rug(Ic, -6.8, 4.3, 1.0, 4, 3.2, M.rug_green);
    P.covered(Ic, -4.6, 6.2, 1.0, 1.9, 1.6, 1.0, -0.5); // o piano, sob um lençol
    for (const x of [-8.3, -5.0]) P.curtains(Ic, x, 1.05, 7.2, PI, 1.4, 3.4, M.fabric_green); P.curtains(Ic, -9.75, 1.05, 6.6, PI / 2, 1.1, 3.4, M.fabric_green); }
  // ---- LIBRARY ----
  { const B = (x, z, ry, w, h = 3.9, y = 1.0) => P.bookcase(Ic, x, z, y, ry, w, h, 0.36);
    B(-9.1, -8.3, 0, 1.5); B(-5.85, -8.3, 0, 1.6); B(-3.2, -4.4, -PI / 2, 4.6); B(-9.8, -5.55, PI / 2, 1.6); B(-9.8, -2.8, PI / 2, 0.9); B(-8.6, 0.8, PI, 2.3); B(-4.45, 0.8, PI, 2.2);
    B(-7.4, -8.3, 0, 4.6, 3.6, 5.6); B(-9.8, -4.35, PI / 2, 4.1, 3.6, 5.6); B(-3.2, -4.25, -PI / 2, 5.3, 3.6, 5.6); B(-8.0, 0.8, PI, 3.5, 3.6, 5.6); B(-4.05, 0.8, PI, 1.4, 3.6, 5.6);
    P.fireplace(Ic, -9.4, -1.2, 1.0, PI / 2, 1.5, M.panel_walnut); P.painting(Ic, -9.37, 3.3, -1.2, PI / 2, 0.9, 1.1, 'man');
    P.desk(Ic, -6.5, -4.6, 1.0, 0, 1.6); P.chair(Ic, -6.5, -5.3, 1.0, 0, M.wood_mahogany, M.leather_brown); P.tableLamp(Ic, -5.9, 1.78, -4.85);
    P.armchair(Ic, -8.0, -2.1, 1.0, -PI / 2 + 0.3, M.leather_brown); P.armchair(Ic, -8.0, -0.2, 1.0, -PI / 2 - 0.3, M.leather_brown);
    P.globe(Ic, -5.6, -6.6, 1.0); P.table(Ic, -5.2, -1.6, 1.0, 1.6, 1.0, 0.85); P.chartOnWall(Ic, -5.2, 1.87, -1.6, 0, 1.2, 0.8).rotation.x = -PI / 2; P.documents(Ic, -4.9, 1.86, -1.4, 6, 0.4);
    P.ladder(Ic, -3.55, -5.5, 1.0, -PI / 2, 3.6, 0.22); P.ladder(Ic, -6.0, -7.8, 1.0, 0, 3.6, 0.22);
    P.rug(Ic, -6.5, -3.8, 1.0, 3.6, 4.6, M.rug_blue); P.chandelier(Ic, -6.5, 7.6, -3.75, 0.6, 8); mm(Ic, 'lib_chain', [cg(0.012, 0.012, 1.9, 5, -6.5, 8.95, -3.75)], M.brass); }
  // ---- GARDEN HALL / BACK STAIR / CLOAK / WASH ----
  { col(box(Ic, 'boot_bench', M.wood_pine, 1.6, 0.45, 0.4, -1.5, 1.0, -8.2)); P.boots(Ic, -2.0, -7.7, 1.0); P.boots(Ic, -1.0, -7.75, 1.0, 0.3); P.coatRack(Ic, -2.5, -6.0, 1.0, 1); P.umbrellaStand(Ic, 3.0, -8.1, 1.0); P.tools(Ic, 4.6, 1.0, -8.3, 0, 4); P.bucket(Ic, 5.4, -7.6, 1.0, M.steel_aged);
    const fp = []; for (let i = 0; i < 7; i++) fp.push(sg(0.07, 1.3 + (i % 2) * 0.4, 1.012, -8.2 + i * 0.45, 8, 4, 0.8, 0.05, 1.6)); mm(Ic, 'muddy_footprints', fp, M.mud);
    P.radiator(Ic, 9.85, -7.0, 1.0, -PI / 2, 1.0); P.coatRack(Ic, 9.4, 2.5, 1.0, 2); P.coatRack(Ic, 9.4, 4.1, 1.0, 1); P.shelves(Ic, 6.4, 3.4, 2.4, PI / 2, 1.2, 0.5, 0.3, M.wood_pine, 'boxes');
    P.wc(Ic, 9.6, 5.6, 1.0, -PI / 2); P.basin(Ic, 7.4, 7.25, 1.0, PI); }
  // ---- GALLERY / MASTER ----
  { const f = 5.6; P.bed(Ic, -4.25, 4.5, f, -PI / 2, 1.8, 2.2, M.fabric_red, true); P.wardrobe(Ic, -8.6, 1.4, f, 0, 1.4); P.dresser(Ic, -6.65, 7.2, f, PI, 1.2);
    P.fireplace(Ic, -9.88, 3.5, f, PI / 2, 1.5); P.armchair(Ic, -8.5, 2.4, f, PI / 2 + 0.4, M.fabric_red); P.desk(Ic, -9.4, 5.8, f, PI / 2, 1.0); P.chair(Ic, -8.8, 5.8, f, -PI / 2);
    P.rug(Ic, -6, 4.3, f, 4, 3, M.rug_red); for (const x of [-8.3, -5.0]) P.curtains(Ic, x, f + 0.05, 7.2, PI, 1.4, 3.4, M.fabric_red); P.painting(Ic, -3.13, 7.6, 4.5, -PI / 2, 0.8, 0.6, 'lady');
    P.bath(Ic, 9.3, 4.4, f, 0); P.basin(Ic, 6.4, 6.4, f, PI / 2); P.wc(Ic, 9.6, 6.9, f, -PI / 2); P.radiator(Ic, 7.4, 2.15, f, 0, 1.0); }
  // ---- SITTING / CORRIDORS ----
  { const f = 5.6; P.sofa(Ic, 0, -6.0, f, 0, 2.0, M.fabric_blue); P.armchair(Ic, -1.8, -3.0, f, PI * 0.8, M.fabric_blue); P.armchair(Ic, 1.9, -3.0, f, -PI * 0.8, M.fabric_cream);
    P.table(Ic, 0, -4.3, f, 0.9, 0.9, 0.72); for (const [x, z, r] of [[0, -3.7, PI], [0, -4.9, 0]]) P.chair(Ic, x, z, f, r); P.bookcase(Ic, -2.8, -4.3, f, PI / 2, 1.8, 2.1); P.rug(Ic, 0, -4.3, f, 3.6, 3, M.rug_blue);
    col(box(Ic, 'radio_cabinet_1934', M.wood_mahogany, 0.6, 1.0, 0.35, 2.5, f, -2.3)); P.tableLamp(Ic, -2.5, f + 0.75, -6.1); P.table(Ic, -2.5, -6.1, f, 0.45, 0.45, 0.75);
    P.rug(Ic, 1.5, -7.5, f, 8, 1.1, M.rug_red); P.painting(Ic, -1, 7.4, -8.38, 0, 0.8, 1.0, 'land'); P.chair(Ic, 3.6, -8.1, f, 0); P.rug(Ic, 1.5, -7.5, 10.0, 8, 1.1, M.rug_blue); }
  // ---- SECOND FLOOR ----
  { const f = 10.0; P.bed(Ic, -9.0, 2.2, f, 0, 0.9, 1.8, M.fabric_cream); P.bed(Ic, -4.3, 2.2, f, 0, 0.9, 1.8, M.fabric_cream); rockingHorse(Ic, -6.6, 5.4, f, 0.6); P.trunk(Ic, -5.5, 7.05, f, PI, 0.8);
    P.table(Ic, -8.4, 6.0, f, 0.8, 0.6, 0.55, M.wood_pine); P.chair(Ic, -8.4, 6.6, f, PI, M.wood_pine, M.fabric_cream); P.shelves(Ic, -3.3, 4.5, f, -PI / 2, 1.4, 1.6, 0.3, M.wood_pine, 'boxes'); P.rug(Ic, -6.5, 4.6, f, 3, 2.4, M.rug_green);
    P.bed(Ic, -9.0, -7.2, f, 0, 1.0, 1.9, M.fabric_blue); P.desk(Ic, -4.0, -0.4, f, PI, 1.2); P.chair(Ic, -4.0, 0.25 - 0.9, f, 0); P.wardrobe(Ic, -6.0, -8.15, f, 0, 1.1); P.basin(Ic, -9.75, -3.5, f, PI / 2); P.documents(Ic, -4.0, f + 0.79, -0.4, 5, 0.3);
    P.bed(Ic, 0, -5.3, f, 0, 1.5, 2.0, M.fabric_green); P.dresser(Ic, 5.6, -3.0, f, -PI / 2, 1.0); P.armchair(Ic, 1.5, 0.2, f, PI, M.fabric_green); P.rug(Ic, 0.5, -3.5, f, 3, 2.5, M.rug_green);
    P.bath(Ic, 9.3, 4.4, f, 0); P.basin(Ic, 6.4, 6.4, f, PI / 2); }
  // ---- ATTICS ----
  { for (const [x, z, f] of [[-6, -5, 14.5], [-4.5, 3, 14.5], [3, -6, 14.5], [-24, 3, 8.2], [-18, -3, 8.2], [-28, -2, 8.2], [14, 2, 8.3]]) { P.covered(Ia, x, z, f, R(1.2, 2), R(0.7, 1.1), R(0.6, 1.2), R(0, 3)); P.trunk(Ia, x + 1.6, z + R(-1, 1), f, R(0, 3)); P.crates(Ia, x - 1.4, z + 1.2, f, 3); }
    for (let i = 0; i < 6; i++) P.crates(Ia, -2 + i * 0.9, -2.5 + (i % 2) * 2.4, 14.5, 2);
    col(box(Ia, 'cistern_tank', M.lead_flashing, 2.0, 1.4, 1.2, 3.5, 14.5, 2.5)); mm(Ia, 'cistern_pipes', [cg(0.04, 0.04, 2.5, 6, 3.5, 13.2, 2.0)], M.pipe_copper);
    rockingHorse(Ia, -20, 1.5, 8.2, 2.1); P.documents(Ia, -18.5, 8.25, -2.2, 14, 0.7); P.documents(Ia, -5.5, 14.55, -4.4, 10, 0.6);
    for (let i = 0; i < 4; i++) P.painting(Ia, -26 + i * 0.15, 8.2 + 0.6, -4.5, 0.1 * i, 0.9, 1.1, i % 2 ? 'land' : 'man').rotation.x = -0.25;
    mm(Ia, 'catwalk_planks', [bx(0.5, 0.04, 14, 0, 14.53, -0.5)], M.raw_planks);
    P.covered(Iw, -30.0, -7.4, 10.6, 1.0, 0.8, 0.8); P.chair(Iw, -31.2, -5.5, 10.6, 0.8, M.wood_pine, M.fabric_cream); P.painting(Iw, -28.5, 11.8, -4.47, PI, 0.5, 0.6, 'lady').rotation.y = 0; }
  // ---- BASEMENT ----
  { const f = -2.6; P.boiler(Ib, 4.0, -3.0, f); P.shelves(Ib, -0.7, -3.0, f, PI / 2, 2.0, 2.0, 0.4, M.wood_pine, 'tins');
    const pp = []; for (const z of [-8.2, -7.9]) pp.push(cg(0.06, 0.06, 20, 10, 0, 0.35, z, 0, PI / 2)); mm(Ib, 'corridor_pipes', pp, M.pipe_copper);
    for (const x of [-7, 0, 6]) P.pendant(Ib, x, 0.4, -7.5, M.enamel_cream);
    for (const [x, z, ry] of [[-9.75, -3, PI / 2], [-9.75, -5.2, PI / 2], [-5.5, -6.3, 0], [-3.3, -6.3, 0], [-1.25, -3.0, -PI / 2]]) P.wineRack(Ib, x, z, f, ry, 2, 2.2);
    for (let i = 0; i < 4; i++) P.shelves(Ib, -9.0 + i * 2.2, 2.1, f, 0, 1.8, 2.4, 0.45, M.steel_aged, 'boxes'); for (let i = 0; i < 3; i++) P.shelves(Ib, -8.5 + i * 2.6, 6.9, f, PI, 2.0, 2.4, 0.45, M.steel_aged, 'boxes');
    P.table(Ib, -4.0, 4.5, f, 1.6, 0.9, 0.8, M.wood_pine); P.documents(Ib, -4.0, f + 0.81, 4.5, 12, 0.5); P.chair(Ib, -4.0, 5.2, f, PI, M.wood_pine, M.wood_pine); P.tableLamp(Ib, -3.4, f + 0.8, 4.3);
    mesh(Ib, 'coal_heap', new THREE.SphereGeometry(1.6, 16, 8, 0, PI * 2, 0, PI / 2).scale(1.4, 0.7, 1), M.soot, 7.5, f, 5.5); col(box(Ib, 'coal_chute', M.steel_aged, 0.6, 0.1, 2.2, 8.8, f + 2.2, 6.6)).rotation.x = 0.7;
    P.crates(Ib, 3, 3, f, 4); P.sacks(Ib, 3.0, 6.4, f, 3);
    for (let i = 0; i < 6; i++) col(mm(Ib, 'barrel', [cg(0.35, 0.35, 0.9, 16, -29 + i * 1.1, -2.4 + 0.45, -5.5, 0, 0)], M.wood_furniture));
    for (let x = -30; x < -13; x += 3) mm(Ib, 'cellar_arch_rib', [bx(0.4, 0.4, 12.6, x, -0.0, 0)], M.cellar_stone);
    { const wg = grp(Ib, 'old_well', -22, -2.4, 2.0); col(mesh(wg, 'well_ring', new THREE.CylinderGeometry(0.9, 0.95, 0.8, 32, 1, true), M.basalt_dressed, 0, 0.4, 0)); mesh(wg, 'well_ring_in', new THREE.CylinderGeometry(0.7, 0.7, 0.8, 32, 1, true), M.soot, 0, 0.4, 0); mesh(wg, 'well_cap', new THREE.TorusGeometry(0.8, 0.12, 8, 32).rotateX(PI / 2), M.basalt_dressed, 0, 0.8, 0); const G2 = []; for (let i = -3; i <= 3; i++) G2.push(bx(0.03, 0.03, 1.5, i * 0.2, 0.82, 0)); mm(wg, 'well_grate', G2, M.iron_int); }
    for (const x of [-26, -18]) P.pendant(Ib, x, -0.1, 0, M.enamel_cream); }
  // ---- WEST WING ----
  { const g = 0.5; P.fireplace(Iw, -14.7, -2, g, -PI / 2, 2.4, M.basalt_dressed); P.table(Iw, -17.0, 2.6, g, 1.0, 3.6, 0.78, M.panel_oak); for (const s of [-1, 1]) col(box(Iw, 'refectory_bench', M.panel_oak, 0.35, 0.45, 3.2, -17.0 + s * 0.85, g, 2.6));
    /* retratos do salão antigo: Frames do jogo (um deles esconde a fechadura de Margaret) */ P.trunk(Iw, -20.3, 5.6, g, PI / 2, 1.0); P.candlestick(Iw, -17, g + 0.78, 2.0); P.candlestick(Iw, -17, g + 0.78, 3.2); P.rug(Iw, -17, 2.6, g, 2.2, 4.6, M.rug_red);
    P.fireplace(Iw, -31.2, 1.5, g, PI / 2, 1.5, M.basalt_dressed); P.desk(Iw, -24.5, 3.0, g, PI, 1.6); P.chair(Iw, -24.5, 2.3, g, 0, M.wood_mahogany, M.leather_brown); P.shelves(Iw, -27.5, 0.3, g, 0, 3.0, 2.8, 0.4, M.wood_mahogany, 'books');
    P.table(Iw, -26, 7.4, g, 1.6, 1.0, 0.85); P.chartOnWall(Iw, -26, g + 0.87, 7.4, 0, 1.3, 0.85).rotation.x = -PI / 2; P.wardrobe(Iw, -21.4, 5.4, g, -PI / 2, 1.0, 2.0, M.panel_oak); P.keys(Iw, -21.15, 1.8, 1.4, -PI / 2);
    P.covered(Iw, -26, -3, g, 2.2, 0.9, 0.9, 0.1); P.covered(Iw, -28.5, -1.2, g, 0.8, 0.8, 1.0); P.covered(Iw, -23.5, -1.0, g, 0.8, 0.8, 1.0); P.covered(Iw, -29.5, -5.0, g, 1.6, 1.0, 0.8, 0.4); P.crates(Iw, -30.5, -7.6, g, 3); mm(Iw, 'rolled_rug', [cg(0.18, 0.18, 2.4, 12, -23, g + 0.18, -5.6, 0, PI / 2)], M.rug_red);
    const f = 4.3; P.bed(Iw, -13.8, 3.2, f, -PI / 2, 1.4, 2.0, M.fabric_cream); P.dresser(Iw, -18.0, 6.0, f, PI, 1.0); P.armchair(Iw, -19.5, 1.2, f, PI / 4, M.fabric_cream); P.table(Iw, -18.6, 2.2, f, 0.6, 0.45, 0.72, M.wood_mahogany);
    for (let i = 0; i < 4; i++) mm(Iw, 'photo_frame', [bx(0.14, 0.18, 0.02, -18.4 + i * 0.2, f + 0.95, 5.85, 0, -0.2)], M.brass); P.wardrobe(Iw, -20.5, 4.5, f, PI / 2, 1.2); P.rug(Iw, -16, 3.2, f, 3, 2.2, M.rug_green);
    P.desk(Iw, -25, -3.2, f, 0, 1.6); P.chair(Iw, -25, -2.5, f, PI); P.bookcase(Iw, -26.5, -0.35, f, PI, 3.0, 2.6); P.globe(Iw, -22.2, -5.5, f); col(box(Iw, 'iron_safe', M.iron_int, 0.8, 1.0, 0.7, -30.3, f, -2.5)); P.documents(Iw, -25, f + 0.79, -3.2, 8, 0.4); P.tableLamp(Iw, -24.4, f + 0.78, -3.4);
    P.chartOnWall(Iw, -32.5, f + 1.9, -6.6, PI / 2, 0.9, 0.7);
    P.bed(Iw, -29.3, 3.5, f, PI / 2, 1.2, 1.9, M.fabric_blue); P.wardrobe(Iw, -25.0, 0.4, f, 0, 1.2); P.trunk(Iw, -24.5, 7.6, f, 0, 0.9); for (let i = 0; i < 3; i++) P.painting(Iw, -22.0, f + 0.6, 5.5 - i * 0.1, -PI / 2 + 0.2, 0.8, 1.0, 'land').rotation.z = 0.0;
    P.chair(Iw, -14.5, -1.0 - 1.0, f, 0, M.panel_oak, M.fabric_red); P.painting(Iw, -16.5, f + 2.1, -6.27, 0, 1.0, 0.8, 'land'); }
  // ---- EAST WING ----
  { const g = 1.0; P.table(Ie, 15.3, 0, g, 5.6, 1.3, 0.76); for (let i = 0; i < 5; i++) { const x = 13.2 + i * 1.05; P.chair(Ie, x, -0.95, g, 0, M.wood_mahogany, M.fabric_red); P.chair(Ie, x, 0.95, g, PI, M.wood_mahogany, M.fabric_red); } P.chair(Ie, 12.0, 0, g, PI / 2, M.wood_mahogany, M.fabric_red); P.chair(Ie, 18.6, 0, g, -PI / 2, M.wood_mahogany, M.fabric_red);
    P.tableware(Ie, 15.3, 0, g + 0.76, 5.2, 1.3, 5); P.candlestick(Ie, 14.3, g + 0.76, 0); P.candlestick(Ie, 16.3, g + 0.76, 0);
    P.sideboard(Ie, 15.6, -5.35, g, 0, 2.6); P.painting(Ie, 15.6, 3.2, -5.66, 0, 1.6, 1.0, 'land'); P.fireplace(Ie, 11.25, -3.0, g, PI / 2, 1.5, M.limestone_trim); P.painting(Ie, 11.25, 3.2, -3.0, PI / 2, 0.8, 1.0, 'man');
    P.chandelier(Ie, 13.6, 3.6, 0, 0.55, 8); P.chandelier(Ie, 17.0, 3.6, 0, 0.55, 8); P.rug(Ie, 15.3, 0, g, 6.5, 3.4, M.rug_red); P.curtains(Ie, 12.4, g + 0.9, 5.55, PI, 1.2, 2.8, M.fabric_red);
    P.fireplace(Ie, 28.4, -1.0, g, -PI / 2, 1.4, M.trim_paint_white); P.armchair(Ie, 26.2, 0.2, g, -PI / 2 - 0.5, M.fabric_cream); P.armchair(Ie, 26.2, -2.3, g, -PI / 2 + 0.5, M.fabric_cream); P.table(Ie, 22.0, -4.6, g, 1.2, 0.7, 0.75, M.wood_pine); P.chair(Ie, 22.0, -4.0, g, PI); P.rug(Ie, 25.5, -1, g, 3.2, 3.2, M.rug_green);
    for (const [x, z] of [[20.6, 5.0], [27.6, 4.7], [20.6, -5.1]]) potPalm(Ie, x, z, g);
    const f = 5.0; P.bed(Ie, 11.4, -3.6, f, PI / 2, 1.2, 2.0, M.fabric_blue); P.dresser(Ie, 13.5, -5.4, f, 0, 1.0); P.desk(Ie, 17.4, -4.6, f, -PI / 2, 1.1); P.chair(Ie, 16.8, -4.6, f, PI / 2); P.bookcase(Ie, 18.3, 1.6, f, -PI / 2, 1.6, 1.8); P.documents(Ie, 17.4, f + 0.79, -4.4, 4, 0.2);
    gramophone(Ie, 13.0, 4.8, f); col(box(Ie, 'window_seat', M.fabric_cream, 2.6, 0.5, 0.7, 16.6, f, 7.4)); P.rug(Ie, 14.5, 0, f, 3, 3, M.rug_blue);
    P.bed(Ie, 21.2, -4.3, f, 0, 1.4, 2.0, M.fabric_green); P.wardrobe(Ie, 23.4, 3.0, f, -PI / 2, 1.0); P.trunk(Ie, 19.5, 4.5, f, 0.3, 0.8); P.chair(Ie, 22.5, 4.6, f, PI);
    P.bath(Ie, 27.6, -3.5, f, 0); P.basin(Ie, 24.2, -4.2, f, PI / 2); P.wc(Ie, 25.6, -5.4, f, 0); P.chair(Ie, 25, 3.8, f, PI * 0.8); P.painting(Ie, 23.92, 6.6, 1.5, PI / 2, 0.6, 0.8, 'lady');
    // turret top room - the one lit window
    const t = 12.6; P.desk(Ie, TX + 0.9, TZ + 1.3, t, PI * 0.75, 1.0); P.tableLamp(Ie, TX + 1.3, t + 0.78, TZ + 1.0); P.chair(Ie, TX + 0.3, TZ + 0.7, t, PI * 0.75 - PI); P.documents(Ie, TX + 0.9, t + 0.79, TZ + 1.3, 9, 0.3);
    P.chartOnWall(Ie, TX - 2.55, t + 1.6, TZ + 0.5, PI / 2, 0.6, 0.45); col(box(Ie, 'turret_cot', M.linen_white, 0.8, 0.45, 1.9, TX - 1.3, t, TZ - 0.6, 0.6));
    // kitchen & service
    P.range(Ie, 27.25, -9.0, g, -PI / 2, 1.8); P.table(Ie, 22.6, -9.6, g, 3.0, 1.2, 0.86, M.wood_pine); P.hangingRail(Ie, 22.6, 3.2, -9.6, 0, 2.2); for (const x of [21.6, 23.6]) { P.chair(Ie, x, -10.5, g, 0, M.wood_pine, M.wood_pine); }
    P.shelves(Ie, 18.7, -11.5, g, PI / 2, 1.8, 2.2, 0.35, M.wood_pine, 'jars'); P.shelves(Ie, 24.5, -12.7, g, PI, 2.2, 2.2, 0.35, M.wood_pine, 'pots');
    { const bb = grp(Ie, 'servants_bell_board', 21.0, 3.3, -6.15, PI); mm(bb, 'bell_board', [bx(1.6, 0.6, 0.05, 0, 0, 0)], M.wood_mahogany); mm(bb, 'bells', Array.from({ length: 10 }, (_, i) => sg(0.04, -0.65 + i * 0.145, -0.1, 0.06, 8, 6)), M.brass); }
    P.sink(Ie, 18.75, -15.0, g, PI / 2); col(mm(Ie, 'copper_boiler', [cg(0.4, 0.45, 0.9, 20, 21.8, g + 0.45, -17.1)], M.copper_pan)); P.bucket(Ie, 22.4, -16.8, g); P.bucket(Ie, 19.6, -16.9, g, M.copper_pan); col(box(Ie, 'mangle', M.iron_int, 0.6, 1.1, 0.5, 20.6, g, -13.6));
    P.shelves(Ie, 27.3, -15.3, g, -PI / 2, 4.0, 2.4, 0.4, M.wood_pine, 'jars'); P.shelves(Ie, 25.3, -17.3, g, 0, 2.8, 2.4, 0.4, M.wood_pine, 'tins'); P.sacks(Ie, 23.6, -14.0, g, 3); col(box(Ie, 'meat_safe', M.wood_pine, 0.6, 1.4, 0.5, 23.5, g, -17.2)); }
}
function piano(p, x, z, y, ry) { const g = grp(p, 'grand_piano', x, y, z, ry); const s = new THREE.Shape(); s.moveTo(-0.75, 0); s.lineTo(0.75, 0); s.lineTo(0.75, -0.8); s.quadraticCurveTo(0.7, -1.9, 0.1, -1.95); s.quadraticCurveTo(-0.3, -1.9, -0.45, -1.3); s.quadraticCurveTo(-0.6, -0.9, -0.75, -0.8); s.closePath(); const b = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }); b.rotateX(PI / 2); b.translate(0, 1.0, 0); col(mesh(g, 'piano_case', b, M.telescope_black)); mm(g, 'piano_legs', [cg(0.05, 0.04, 0.68, 8, -0.65, 0.34, -0.1), cg(0.05, 0.04, 0.68, 8, 0.65, 0.34, -0.1), cg(0.05, 0.04, 0.68, 8, 0.1, 0.34, -1.8)], M.telescope_black); mm(g, 'piano_keys', [bx(1.3, 0.04, 0.16, 0, 0.72, 0.08)], M.enamel_cream); const lid = mesh(g, 'piano_lid', new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }).rotateX(PI / 2).translate(0, 1.0, 0), M.telescope_black); lid.rotation.z = 0.0; mm(g, 'piano_bench', [bx(0.8, 0.06, 0.35, 0, 0.5, 0.6), ...[[-.35, .45], [.35, .45], [-.35, .75], [.35, .75]].map(([a, b]) => bx(0.04, 0.48, 0.04, a, 0.24, b))], M.telescope_black); }
function rockingHorse(p, x, z, y, ry) { const g = grp(p, 'rocking_horse', x, y, z, ry); mm(g, 'horse_body', [sg(0.3, 0, 0.75, 0, 12, 8, 1.6, 0.8, 0.7), bx(0.12, 0.35, 0.12, 0.42, 0.95, 0, 0, 0, -0.6), sg(0.12, 0.55, 1.1, 0, 10, 8, 1.4, 0.8, 0.8), ...[[-0.3, 0.12], [-0.3, -0.12], [0.3, 0.12], [0.3, -0.12]].map(([a, b]) => cg(0.035, 0.035, 0.45, 6, a, 0.45, b))], M.enamel_cream); mm(g, 'horse_rockers', [new THREE.TorusGeometry(1.2, 0.03, 6, 24, 0.9).rotateZ(PI + (PI - 0.9) / 2).translate(0, 1.42, 0.14), new THREE.TorusGeometry(1.2, 0.03, 6, 24, 0.9).rotateZ(PI + (PI - 0.9) / 2).translate(0, 1.42, -0.14)], M.wood_mahogany); mm(g, 'horse_saddle', [bx(0.25, 0.04, 0.3, 0, 0.98, 0)], M.fabric_red); }
function gramophone(p, x, z, y) { const g = grp(p, 'gramophone', x, y, z); P.table(g, 0, 0, 0, 0.6, 0.5, 0.75, M.wood_mahogany); mm(g, 'gramophone_box', [bx(0.4, 0.15, 0.4, 0, 0.83, 0)], M.wood_mahogany); const h = new THREE.ConeGeometry(0.28, 0.5, 24, 1, true); h.rotateZ(-PI / 2.5); h.translate(0.15, 1.2, 0); const hm = mm(g, 'gramophone_horn', [h, cg(0.02, 0.02, 0.3, 6, 0, 0.98, 0)], M.brass); hm.material.side = THREE.DoubleSide; }
function potPalm(p, x, z, y) { const g = grp(p, 'potted_palm', x, y, z, R(0, 6)); const prof = [[0.2, 0], [0.26, 0.4], [0.28, 0.45], [0, 0.45]].map(([a, b]) => new THREE.Vector2(a, b)); mesh(g, 'pot', new THREE.LatheGeometry(prof, 20), M.terracotta_int); const L = []; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; const f = new THREE.PlaneGeometry(0.18, 0.9, 1, 4); const pa = f.attributes.position; for (let k = 0; k < pa.count; k++) { const v = pa.getY(k) + 0.45; pa.setZ(k, -v * v * 0.5); } f.rotateX(-0.6); f.translate(0, 0.9, 0.35); f.rotateY(a); L.push(f); } L.push(cg(0.02, 0.03, 0.5, 5, 0, 0.7, 0)); mm(g, 'palm_fronds', L, M.plant_green); }
