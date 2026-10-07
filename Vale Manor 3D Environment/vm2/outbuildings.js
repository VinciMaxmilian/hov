import { THREE, PI, M, R, rnd, mesh, box, cyl, grp, bx, cg, sg, merge, mm, col, walk, proxy, room, slab, wall, ringWall, stairRun, spiral, gableRoof, pyr, flatRect, sectorSlab, balus, interiorGroups, glassMeshes } from './core.js';
import * as P from './props.js';
import { paneDirt } from './tex.js';
const wn = (at, y, w, h, style = '', x = {}) => ({ at, y, w, h, kind: 'win', style, ...x });
const dn = (at, y, w, h, x = {}) => ({ at, y, w, h, kind: 'door', ...x });
const ho = (at, y, w, h) => ({ at, y, w, h, kind: 'hole' });
const frame = g => (g.userData.frame = true, g);

// ================= OBSERVATORY + GALLERY =================
export function buildObservatory(model, toW, obsW) {
  const MX = obsW.x, O = frame(grp(model, 'observatory_1911', MX, 0, obsW.z)); interiorGroups.push({ g: O, c: [MX, 4, obsW.z], keep: true });
  walk(col(mesh(O, 'observatory_plinth', new THREE.CylinderGeometry(3.95, 4.15, 1.0, 8).rotateY(PI / 8), M.limestone_trim, 0, 0.5, 0)));
  mesh(O, 'plinth_floor', new THREE.CylinderGeometry(3.0, 3.0, 0.02, 8).rotateY(PI / 8), M.flags_interior, 0, 1.01, 0);
  room(O, 'obs_lower', 'Observatory instrument room', [[-2.8, 2.8, -2.8, 2.8]], 1.0, 4.7, { building: 'Observatory', floor: 'Lower', light: [1.3, 3.6, -1.2], i: 9, dist: 8 });
  room(O, 'obs_upper', 'Observing floor', [[-2.8, 2.8, -2.8, 2.8]], 5.0, 11.4, { building: 'Observatory', floor: 'Dome', light: [-1.4, 6.6, 1.2], i: 5, dist: 8, col: 0xff7a5a });
  const ow = (ang, y, w, h) => ({ ang, y, w, h, kind: 'win', style: 'surround one', trim: M.limestone_trim, frame: M.wrought_iron });
  ringWall(O, { name: 'observatory_drum', cx: 0, cz: 0, r: 3.2, seg: 8, a0: PI / 8, t: 0.45, y0: 1.0, h: 6.7, ext: M.ashlar_1911, int: M.plaster, ext0: 0.1, open: [{ ang: 0, y: 1.0, w: 1.1, h: 2.4, kind: 'door', open: 1.4, trim: M.limestone_trim }, ow(PI / 2, 2.2, 0.6, 1.5), ow(3 * PI / 2, 2.2, 0.6, 1.5), ow(PI / 2, 5.7, 0.55, 1.2), ow(3 * PI / 2, 5.7, 0.55, 1.2), ow(PI, 5.3, 0.4, 2.0), ow(PI, 2.2, 0.5, 1.4)] });
  const oct = r => { const s = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = i * PI / 4 + PI / 8; s[i ? 'lineTo' : 'moveTo'](r * Math.sin(a), r * Math.cos(a)); } s.closePath(); return s; };
  const ring = (ro, ri, d, y, m, n) => { const s = oct(ro); s.holes.push(oct(ri)); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.rotateX(-PI / 2); mesh(O, n, g, m, 0, y, 0); };
  ring(3.75, 2.9, 0.4, 7.7, M.limestone_trim, 'observatory_cornice'); ring(3.6, 3.3, 0.18, 7.4, M.limestone_trim, 'observatory_frieze');
  const w = 0.32, ps = 3 * PI / 2 + w / 2, pl = 2 * PI - w;
  mesh(O, 'dome_copper', new THREE.SphereGeometry(3.35, 96, 32, ps, pl, 0, PI / 2), M.copper_verdigris, 0, 8.1, 0); col(O.children[O.children.length - 1]);
  mesh(O, 'dome_inner_boards', new THREE.SphereGeometry(3.2, 64, 24, ps, pl, 0, PI / 2), M.dome_interior_wood, 0, 8.1, 0);
  const ribs = []; for (const s of [-1, 1]) { const g = new THREE.TorusGeometry(3.28, 0.07, 8, 32, PI / 2); g.rotateY(PI / 2); g.rotateY(s * w / 2 * 0.98); ribs.push(g.translate(0, 8.1, 0)); } for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI; if (Math.abs(Math.atan2(Math.sin(a - PI), Math.cos(a - PI))) < 0.3) continue; const g = new THREE.TorusGeometry(3.36, 0.03, 4, 24, PI / 2); g.rotateY(PI / 2); g.rotateY(a); ribs.push(g.translate(0, 8.1, 0)); }
  mm(O, 'dome_ribs_and_slit', ribs, M.copper_verdigris);
  const shutter = new THREE.SphereGeometry(3.4, 16, 12, 3 * PI / 2 + w / 2, 0.36, 0.05, PI / 2 - 0.05); mesh(O, 'dome_shutter_open', shutter, M.copper_verdigris, 0, 8.1, 0);
  mm(O, 'dome_finial', [cg(0.04, 0.12, 0.9, 12, 0, 11.85, 0), sg(0.16, 0, 12.4, 0, 16, 10)], M.copper_verdigris);
  const G2 = [new THREE.TorusGeometry(3.1, 0.06, 8, 96).rotateX(PI / 2).translate(0, 8.12, 0)]; for (let i = 0; i < 96; i++) { const a = i / 96 * 2 * PI; G2.push(bx(0.05, 0.08, 0.1, Math.sin(a) * 3.02, 8.05, Math.cos(a) * 3.02, a)); } for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * PI + PI / 8; G2.push(cg(0.09, 0.09, 0.1, 16, Math.sin(a) * 3.0, 8.0, Math.cos(a) * 3.0, 0, PI / 2)); }
  mm(O, 'dome_rotation_rail_and_gear', G2, M.iron_int);
  mm(O, 'dome_crank_wheel', [new THREE.TorusGeometry(0.3, 0.025, 6, 24).rotateY(PI / 2).translate(-2.55, 6.4, -0.8), ...[0, 1, 2, 3].map(i => cg(0.012, 0.012, 0.58, 4, -2.55, 6.4, -0.8, i * PI / 4)), cg(0.02, 0.02, 0.4, 6, -2.4, 6.4, -0.8, 0, PI / 2), cg(0.008, 0.008, 1.6, 4, -2.55, 7.2, -0.8)], M.brass);
  // pier, spiral, floor
  col(cyl(O, 'telescope_pier', M.ashlar_1911, 0.45, 0.55, 4.6, 32, 0, 1.0, 0));
  const a0 = 0.65, sp = spiral(O, { name: 'observatory_spiral', cx: 0, cz: 0, r0: 0.62, r1: 2.25, y0: 1.0, y1: 5.0, a0, P: 4.0, mat: M.iron_int, post: false, rail: true, risers: false });
  const hole = 2.3; sectorSlab(O, 'observing_floor', 0, 0, 2.85, 5.0, 0.22, sp.aEnd, 2 * PI - hole, M.floorboards, M.wood_pine);
  balus(O, 'observing_floor_guard', 0.6 * Math.sin(sp.aEnd - hole), 0.6 * Math.cos(sp.aEnd - hole), 2.4 * Math.sin(sp.aEnd - hole), 2.4 * Math.cos(sp.aEnd - hole), 5.0, M.iron_int);
  // telescope: equatorial mount aimed at the meridian (north, latitude 47.6)
  { const T = grp(O, 'refractor_telescope', 0, 5.6, 0); mm(T, 'mount_base', [bx(0.6, 0.12, 0.6, 0, 0.06, 0), cg(0.12, 0.18, 0.5, 16, 0, 0.36, 0)], M.telescope_black);
    const ax = grp(T, 'polar_axis', 0, 0.62, 0); ax.rotation.x = -(PI / 2 - 0.83); mm(ax, 'polar_axis_housing', [cg(0.09, 0.09, 0.7, 16, 0, 0.25, 0), cg(0.12, 0.12, 0.12, 16, 0, -0.1, 0)], M.telescope_black);
    const dec = grp(ax, 'declination_axis', 0, 0.62, 0); dec.rotation.z = 0.0; mm(dec, 'dec_axis', [cg(0.05, 0.05, 0.9, 12, 0, 0, 0, 0, PI / 2), cg(0.12, 0.12, 0.18, 16, -0.45, 0, 0, 0, PI / 2)], M.telescope_black);
    const tube = grp(dec, 'tube', 0.3, 0, 0); tube.rotation.x = -0.35; mm(tube, 'tube_body', [cg(0.1, 0.1, 2.5, 32, 0, 0, 0.2, PI / 2), cg(0.12, 0.12, 0.35, 32, 0, 0, 1.4, PI / 2), cg(0.11, 0.11, 0.05, 32, 0, 0, -0.2, PI / 2)], M.telescope_brass);
    mm(tube, 'eyepiece', [cg(0.03, 0.03, 0.25, 12, 0, 0, -1.15, PI / 2), cg(0.02, 0.02, 0.12, 8, 0, -0.08, -1.25)], M.telescope_black); mm(tube, 'finder', [cg(0.03, 0.03, 0.6, 12, 0.14, 0.12, 0.2, PI / 2)], M.telescope_brass);
    mm(dec, 'counterweight', [cg(0.13, 0.13, 0.2, 20, -0.55, 0, 0, 0, PI / 2)], M.steel_aged); col(box(T, 'clock_drive', M.wood_mahogany, 0.3, 0.3, 0.3, 0.3, 0.12, 0.25)); }
  // props
  P.desk(O, 1.3, -1.4, 1.0, -PI / 4 - PI / 2 + PI, 1.2); P.chair(O, 0.9, -0.9, 1.0, PI * 0.75 + PI); P.documents(O, 1.3, 1.79, -1.4, 8, 0.25); P.tableLamp(O, 1.65, 1.78, -1.2);
  P.shelves(O, -2.2, -1.2, 1.0, PI / 2 + PI / 8, 1.2, 2.4, 0.35, M.wood_mahogany, 'books'); P.shelves(O, -2.2, 1.0, 1.0, PI / 2 - PI / 8, 1.0, 2.0, 0.35, M.wood_mahogany, 'tins'); P.globe(O, 1.9, 1.2, 1.0);
  P.chartOnWall(O, 2.73, 3.2, -0.6, -PI / 2, 0.9, 0.7); P.chartOnWall(O, -1.1, 3.4, -2.73, 0, 0.8, 0.6);
  P.table(O, -1.5, 1.2, 5.0, 1.0, 0.7, 0.85, M.wood_mahogany); P.chartOnWall(O, -1.5, 5.86, 1.2, 0, 0.9, 0.6).rotation.x = -PI / 2; P.stool(O, -0.9, 1.7, 5.0); P.documents(O, -1.7, 5.87, 1.0, 4, 0.2); P.candlestick(O, -1.9, 5.85, 1.4);
  col(box(O, 'instrument_case', M.wood_mahogany, 0.8, 0.9, 0.45, 1.6, 5.0, 1.6, -PI / 4)); mm(O, 'sextant_on_case', [new THREE.TorusGeometry(0.15, 0.01, 4, 16, PI / 3).translate(1.6, 6.0, 1.6)], M.brass);
  // gallery
  const A = toW(7.6, -9.0), B = new THREE.Vector3(MX, 0, obsW.z + 3.05), d = new THREE.Vector3().subVectors(B, A), L = Math.hypot(d.x, d.z), a = Math.atan2(d.x, d.z);
  const G = frame(grp(model, 'observatory_gallery', (A.x + B.x) / 2, 0, (A.z + B.z) / 2, a));
  room(G, 'gallery_corr', 'Observatory gallery', [[-1.2, 1.2, -L / 2, L / 2]], 1.0, 3.9, { building: 'Observatory', floor: 'Ground', fm: M.flags_interior, wm: M.plaster, i: 6, dist: 9 });
  const gw = z => wn(z, 1.9, 0.7, 1.4, 'surround one', { trim: M.limestone_trim, frame: M.wrought_iron });
  for (const s of [-1, 1]) { wall(G, { t: 0.4, y0: 0, h: 4.2, ext: M.ashlar_1911, int: 'auto', a: s > 0 ? [1.4, L / 2 + 0.2] : [-1.4, -L / 2 - 0.2], b: s > 0 ? [1.4, -L / 2 - 0.2] : [-1.4, L / 2 + 0.2], open: [gw(-L * 0.25), gw(L * 0.1)], name: 'gallery_wall' }); }
  slab(G, 'gallery_ceiling', -1.2, 1.2, -L / 2, L / 2, 4.2, 0.3, M.lead_flashing, M.ceiling_plaster); mm(G, 'gallery_parapet', [bx(3.1, 0.35, L, 0, 4.3, 0)], M.lead_flashing).visible = false;
  mm(G, 'gallery_coping', [bx(0.6, 0.15, L + 0.4, 1.4, 4.25, 0), bx(0.6, 0.15, L + 0.4, -1.4, 4.25, 0)], M.limestone_trim);
  mm(G, 'gallery_base', [bx(3.0, 1.0, L, 0, 0.5, 0)], M.limestone_trim);
  P.rug(G, 0, 0, 1.0, 1.2, L - 1, M.rug_blue); P.pendant(G, 0, 3.6, -L * 0.2, M.brass); P.pendant(G, 0, 3.6, L * 0.25, M.brass);
  return { MX, obsW };
}

// ================= CARS =================
function prof(pts) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); return s; }
function ext(shape, w, bev = 0.05) { const g = new THREE.ExtrudeGeometry(shape, { depth: w - bev * 2, bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 3, curveSegments: 12 }); g.translate(0, 0, -(w - bev * 2) / 2); g.rotateY(-PI / 2); return g; }
function wheel(g, r, w, x, z, spokes = 0, m = M.chrome) {
  const tube = r * 0.32, t = new THREE.TorusGeometry(r - tube, tube, 12, 32); t.scale(1, 1, w / (tube * 2)); t.rotateY(PI / 2); t.translate(x, r, z); mesh(g, 'tire', t, M.rubber);
  const L = [cg(r * 0.68, r * 0.68, w * 0.3, 24, x, r, z, 0, PI / 2), cg(r * 0.25, r * 0.3, w * 0.7, 16, x + Math.sign(x) * 0.02, r, z, 0, PI / 2)];
  for (let i = 0; i < spokes; i++) { const a = i / spokes * PI * 2; L.push(cg(0.008, 0.008, r * 0.65, 3, x, r + Math.cos(a) * r * 0.33, z + Math.sin(a) * r * 0.33, a)); }
  mm(g, 'wheel_rim', L, spokes ? M.paint_1934_black : m); if (spokes) mm(g, 'hubcap', [cg(r * 0.18, r * 0.18, w * 0.8, 16, x, r, z, 0, PI / 2)], M.chrome);
}
const carGlass = (g, pts, w) => mesh(g, 'car_windows', ext(prof(pts), w + 0.02, 0.0), M.car_glass);
function sedan1934(p, x, z, ry) { const g = grp(p, 'car_1934_sedan', x, 0, z, ry), pm = M.paint_1934_black;
  col(mesh(g, 'sedan_body', ext(prof([[-2.3, 0.45], [2.25, 0.45], [2.3, 0.75], [2.2, 1.1], [0.9, 1.15], [0.75, 1.2], [0.55, 1.85], [-1.3, 1.9], [-1.95, 1.7], [-2.3, 1.1]]), 1.5, 0.06), pm));
  carGlass(g, [[0.5, 1.25], [0.62, 1.78], [-1.25, 1.83], [-1.75, 1.62], [-1.8, 1.25]], 1.5);
  const fd = new THREE.Shape(); fd.moveTo(-0.62, 0); fd.quadraticCurveTo(0, 0.8, 0.75, 0.05); fd.lineTo(0.55, 0.0); fd.quadraticCurveTo(0, 0.58, -0.45, 0); fd.closePath();
  for (const s of [-1, 1]) for (const zz of [1.45, -1.45]) { const fg = ext(fd, 0.36, 0.03); fg.translate(s * 0.82, 0.4, zz); mesh(g, 'fender', fg, pm); }
  for (const s of [-1, 1]) mm(g, 'running_board', [bx(0.32, 0.05, 1.7, s * 0.86, 0.47, 0)], M.rubber);
  mm(g, 'grille_and_lamps', [bx(0.75, 0.62, 0.06, 0, 0.88, 2.28), ...Array.from({ length: 9 }, (_, i) => bx(0.015, 0.58, 0.03, -0.32 + i * 0.08, 0.88, 2.32)), cg(0.17, 0.12, 0.2, 20, -0.62, 1.2, 2.0, PI / 2), cg(0.17, 0.12, 0.2, 20, 0.62, 1.2, 2.0, PI / 2), bx(1.8, 0.1, 0.1, 0, 0.42, 2.45), bx(1.8, 0.1, 0.1, 0, 0.42, -2.45), cg(0.02, 0.02, 0.5, 6, 0, 1.0, 2.05, 0, PI / 2)], M.chrome);
  mm(g, 'headlamp_lenses', [cg(0.15, 0.15, 0.02, 20, -0.62, 1.2, 2.1, PI / 2), cg(0.15, 0.15, 0.02, 20, 0.62, 1.2, 2.1, PI / 2)], M.headlamp_glass);
  for (const xx of [-0.82, 0.82]) for (const zz of [1.45, -1.45]) wheel(g, 0.38, 0.18, xx, zz, 24); wheel(g, 0.38, 0.18, 0, -2.42, 24); g.children[g.children.length - 2].rotation.z = 0;
  return g; }
function pickup1957(p, x, z, ry) { const g = grp(p, 'car_1957_pickup', x, 0, z, ry), pm = M.paint_1957_sage;
  col(mesh(g, 'pickup_cab', ext(prof([[-0.6, 0.5], [2.45, 0.5], [2.47, 0.85], [2.35, 1.15], [1.0, 1.2], [0.75, 1.25], [0.55, 1.85], [-0.45, 1.88], [-0.6, 1.75]]), 1.88, 0.08), pm));
  carGlass(g, [[0.5, 1.3], [0.65, 1.78], [-0.4, 1.8], [-0.5, 1.3]], 1.88);
  col(mm(g, 'pickup_bed', [bx(1.88, 0.55, 0.06, 0, 0.83, -0.68), bx(1.88, 0.55, 0.06, 0, 0.83, -2.45), bx(0.06, 0.55, 1.8, -0.91, 0.83, -1.56), bx(0.06, 0.55, 1.8, 0.91, 0.83, -1.56), bx(1.88, 0.06, 1.8, 0, 0.58, -1.56)], pm));
  mm(g, 'pickup_bed_boards', [bx(1.76, 0.02, 1.7, 0, 0.62, -1.56)], M.raw_planks);
  mm(g, 'pickup_chrome', [bx(1.7, 0.22, 0.05, 0, 0.75, 2.47), bx(2.0, 0.15, 0.12, 0, 0.5, 2.52), bx(2.0, 0.12, 0.1, 0, 0.5, -2.5), cg(0.12, 0.12, 0.05, 16, -0.7, 0.98, 2.42, PI / 2), cg(0.12, 0.12, 0.05, 16, 0.7, 0.98, 2.42, PI / 2)], M.chrome);
  for (const xx of [-0.86, 0.86]) for (const zz of [1.7, -1.6]) wheel(g, 0.4, 0.25, xx, zz); return g; }
function wagon1966(p, x, z, ry) { const g = grp(p, 'car_1966_station_wagon', x, 0, z, ry);
  col(mesh(g, 'wagon_body', ext(prof([[-2.65, 0.35], [2.65, 0.35], [2.7, 0.65], [2.6, 0.95], [1.1, 1.0], [0.6, 1.05], [0.2, 1.55], [-2.4, 1.58], [-2.6, 1.5], [-2.7, 0.9]]), 1.95, 0.06), M.paint_1966_maroon));
  carGlass(g, [[0.15, 1.1], [0.35, 1.48], [-2.35, 1.5], [-2.58, 1.1]], 1.95);
  mesh(g, 'wagon_wood_panels', ext(prof([[-2.55, 0.5], [1.9, 0.5], [1.9, 0.92], [-2.55, 0.92]]), 1.99, 0.0), M.wagon_wood_panel);
  mm(g, 'wagon_roof', [bx(1.82, 0.04, 2.7, 0, 1.6, -1.05)], M.paint_1966_cream); mm(g, 'wagon_roof_rack', [bx(0.04, 0.05, 2.4, -0.7, 1.67, -1.05), bx(0.04, 0.05, 2.4, 0.7, 1.67, -1.05), ...[-2, -1, 0].map(i => bx(1.44, 0.03, 0.04, 0, 1.68, i * 0.8 - 0.25))], M.chrome);
  mm(g, 'wagon_chrome', [bx(2.0, 0.14, 0.14, 0, 0.42, 2.72), bx(2.0, 0.14, 0.14, 0, 0.42, -2.72), bx(1.6, 0.25, 0.04, 0, 0.75, 2.69), cg(0.09, 0.09, 0.05, 16, -0.72, 0.78, 2.69, PI / 2), cg(0.09, 0.09, 0.05, 16, 0.72, 0.78, 2.69, PI / 2)], M.chrome);
  for (const xx of [-0.86, 0.86]) for (const zz of [1.7, -1.6]) wheel(g, 0.35, 0.22, xx, zz); return g; }
function estate1988(p, x, z, ry) { const g = grp(p, 'car_1988_estate', x, 0, z, ry);
  col(mesh(g, 'estate_body', ext(prof([[-2.4, 0.33], [2.4, 0.33], [2.42, 0.7], [2.3, 0.82], [1.0, 0.95], [0.3, 1.4], [-2.3, 1.43], [-2.4, 1.3]]), 1.75, 0.04), M.paint_1988_navy));
  carGlass(g, [[0.25, 1.0], [0.45, 1.35], [-2.25, 1.37], [-2.35, 1.0]], 1.75);
  mm(g, 'estate_trim', [bx(1.8, 0.2, 0.18, 0, 0.42, 2.42), bx(1.8, 0.2, 0.18, 0, 0.42, -2.42), bx(0.04, 0.06, 2.6, -0.7, 1.48, -0.95), bx(0.04, 0.06, 2.6, 0.7, 1.48, -0.95), bx(0.02, 0.08, 4.2, -0.88, 0.62, 0), bx(0.02, 0.08, 4.2, 0.88, 0.62, 0)], M.rubber);
  mm(g, 'estate_lamps', [bx(1.5, 0.16, 0.03, 0, 0.66, 2.42)], M.headlamp_glass);
  for (const xx of [-0.78, 0.78]) for (const zz of [1.45, -1.45]) wheel(g, 0.32, 0.2, xx, zz, 0, M.steel_aged); return g; }

// ================= CARRIAGE HOUSE =================
export function buildCarriage(model) {
  const CH = frame(grp(model, 'carriage_house_garage', 72, 0, 2, -0.05)); interiorGroups.push({ g: CH, c: [72, 3, 2], keep: true });
  const I = grp(CH, 'garage_interior'); I.userData.frameRef = CH;
  room(CH, 'garage', 'Garage', [[-11.75, 11.75, -4.75, 4.75]], 0.15, 4.25, { building: 'Carriage house', floor: 'Ground', fm: M.concrete_garage, wm: M.raw_planks, light: [-1, 3.6, 0.5], i: 26, dist: 16, col: 0xffd6a0 });
  room(CH, 'garage_office', 'Garage office', [[5.8, 11.75, -4.75, -1.6]], 0.16, 4.25, { building: 'Carriage house', floor: 'Ground', slab: false, wm: M.paper_ochre_stripe, light: [8.7, 3.2, -3.2], i: 8 });
  room(CH, 'garage_loft', 'Hay loft', [[-11.75, 11.75, -4.75, 4.75]], 4.5, 10, { building: 'Carriage house', floor: 'Loft', fm: M.raw_planks, wm: M.raw_planks, holes: [[-10.55, -9.65, -4.5, -2.9]], on: false, i: 6, light: [0, 6.5, 0] });
  const CW = { t: 0.25, y0: 0, h: 7.5, ext: M.board_batten_oxblood, int: 'auto' }, bays = [-8.4, -2.8, 2.8, 8.4];
  const lw = at => wn(at, 5.4, 0.9, 1.0, 'one', {}), gw = at => wn(at, 1.6, 1.0, 1.2, '', {});
  wall(CH, { ...CW, name: 'garage_s', a: [-12, 4.875], b: [12, 4.875], open: [...bays.map(x => ho(x, 0.15, 4.0, 3.9)), ...bays.map(lw)] });
  wall(CH, { ...CW, name: 'garage_n', a: [12, -4.875], b: [-12, -4.875], open: [gw(-6), gw(0), gw(6), dn(-10, 0.15, 1.0, 2.2, { open: 0.9, leafM: M.door_green })] });
  wall(CH, { ...CW, name: 'garage_w', a: [-11.875, -5], b: [-11.875, 5], open: [ho(0, 4.6, 1.6, 2.0), dn(2.5, 0.15, 1.0, 2.2, { open: 1.2, leafM: M.door_green })] });
  wall(CH, { ...CW, name: 'garage_e', a: [11.875, 5], b: [11.875, -5], open: [gw(-3.2)] });
  wall(CH, { kind: 'part', t: 0.12, name: 'office_w', a: [5.8, -4.75], b: [5.8, -1.6], y0: 0.15, h: 4.1, open: [wn(-3.2, 1.2, 1.2, 1.0, 'one', { frame: M.wood_pine })] });
  wall(CH, { kind: 'part', t: 0.12, name: 'office_s', a: [5.8, -1.6], b: [11.75, -1.6], y0: 0.15, h: 4.1, open: [dn(7.0, 0.15, 0.9, 2.1, { open: 1.0, leafM: M.wood_pine })] });
  slab(CH, 'office_floor', 5.86, 11.75, -4.75, -1.66, 0.17, 0.02, M.floorboards, null);
  gableRoof(CH, { name: 'garage_roof', span: 10, rise: 5, len: 24, x: 0, y: 7.5, z: 0, alongX: true, mats: [M.slate_mossy, M.slate_wet], wall: M.board_batten_oxblood, over: 0.6 });
  mm(CH, 'stone_base', [bx(24.3, 0.6, 0.3, 0, 0.3, 5.0), bx(24.3, 0.6, 0.3, 0, 0.3, -5.0), bx(0.3, 0.6, 10, -12, 0.3, 0), bx(0.3, 0.6, 10, 12, 0.3, 0)], M.ashlar_1911).visible = false;
  { const L = []; for (let x = -11.8; x <= 11.8; x += 0.6) for (const zz of [5.01, -5.01]) L.push(bx(0.06, 3.4, 0.04, x, 5.8, zz)); mm(CH, 'battens_upper', L, M.board_batten_oxblood); }
  box(CH, 'cupola_base', M.trim_paint_white, 2, 2.2, 2, 0, 11.4, 0);
  mm(CH, 'cupola_louvers', [0, 1, 2, 3, 4, 5].flatMap(i => [bx(1.5, 0.05, 0.12, 0, 12.1 + i * 0.18, 1.0, 0, 0.6), bx(1.5, 0.05, 0.12, 0, 12.1 + i * 0.18, -1.0, 0, -0.6)]), M.trim_paint_white);
  pyr(CH, 'cupola_roof', M.copper_verdigris, 2.6, 2.6, 1.8, 0, 13.6, 0);
  mm(CH, 'weathervane', [cg(0.025, 0.025, 1.4, 5, 0, 16.0, 0), bx(0.04, 0.08, 1.2, 0, 16.4, 0), bx(0.03, 0.25, 0.25, 0, 16.4, -0.55), cg(0.008, 0.008, 0.6, 4, 0, 16.0, 0, 0, PI / 2), cg(0.008, 0.008, 0.6, 4, 0, 16.0, 0, PI / 2)], M.wrought_iron);
  // bay doors with strap hinges and drop bolts
  bays.forEach((bxp, i) => {
    mm(CH, 'bay_surround', [bx(4.5, 0.4, 0.3, bxp, 4.25, 5.05), bx(0.25, 3.9, 0.3, bxp - 2.12, 2.1, 5.05), bx(0.25, 3.9, 0.3, bxp + 2.12, 2.1, 5.05), bx(0.5, 0.6, 0.34, bxp, 4.45, 5.08)], M.trim_paint_white);
    for (const s of [-1, 1]) { const H = grp(CH, 'carriage_door_leaf', bxp + s * 2.0, 0.17, 5.06, i === 0 ? 0 : s * (PI / 2 + 0.12));
      col(mm(H, 'door_boards', [bx(2.0, 3.85, 0.08, -s * 1.0, 1.925, 0)], M.door_green));
      mm(H, 'door_braces', [bx(1.9, 0.12, 0.04, -s * 1.0, 0.4, 0.06), bx(1.9, 0.12, 0.04, -s * 1.0, 3.45, 0.06), bx(0.12, 3.3, 0.04, -s * 1.0, 1.92, 0.06, 0, 0, s * 0.52)], M.trim_paint_white);
      mm(H, 'strap_hinges', [0.6, 1.9, 3.2].flatMap(y => [bx(0.9, 0.06, 0.02, -s * 0.45, y, 0.09), cg(0.03, 0.03, 0.12, 8, 0, y, 0.05)]).concat([bx(0.04, 0.5, 0.04, -s * 1.85, 0.4, 0.08), bx(0.25, 0.05, 0.03, -s * 1.7, 1.5, 0.09)]), M.wrought_iron); }
  });
  flatRect(CH, 'carriage_apron_gravel', M.gravel_wet, 30, 16, 1, 13, 0.06);
  for (const s of [-0.75, 0.75]) { flatRect(CH, 'tire_track_empty_bay', M.tire_track, 0.22, 9, -2.8 + s, 9.3, 0.07); flatRect(I, 'tire_track_floor', M.tire_track, 0.22, 4.4, -2.8 + s, 2.4, 0.175); }
  mesh(I, 'oil_stain', new THREE.CircleGeometry(0.6, 20).rotateX(-PI / 2).scale(1, 1, 0.7), M.puddle, -2.8, 0.178, 1.0);
  for (const b of [-8.4, 2.8, 8.4]) mesh(I, 'oil_stain', new THREE.CircleGeometry(0.45, 16).rotateX(-PI / 2), M.tire_track, b, 0.176, 1.2 + R(-0.4, 0.4));
  // cars
  pickup1957(I, -8.4, 1.8, PI + 0.0); I.children[I.children.length - 1].rotation.y = 0;
  wagon1966(I, 2.8, 1.6, 0.02); sedan1934(I, 8.4, 0.9, -0.02); estate1988(CH, 14.6, 15.4, 1.25);
  // pit in empty bay, covered by planks
  mm(I, 'inspection_pit_cover', Array.from({ length: 10 }, (_, i) => bx(1.0, 0.05, 0.42, -2.8 + (i === 7 ? 0.25 : 0), 0.19, -1.9 + i * 0.44, i === 7 ? 0.2 : 0)), M.raw_planks);
  // workshop
  col(mm(I, 'workbench', [bx(6.0, 0.08, 0.8, -7.5, 1.0, -4.3), bx(5.9, 0.04, 0.7, -7.5, 0.35, -4.3), ...[-10.4, -8.5, -6.5, -4.6].map(x => bx(0.08, 1.0, 0.7, x, 0.55, -4.3))], M.wood_pine));
  mm(I, 'bench_vise', [bx(0.2, 0.15, 0.25, -5.2, 1.12, -3.95), cg(0.015, 0.015, 0.3, 6, -5.2, 1.12, -3.75, PI / 2)], M.steel_aged);
  mm(I, 'pegboard', [bx(5.5, 1.4, 0.03, -7.5, 1.9, -4.72)], M.pegboard);
  { const T = [], O = []; for (let i = 0; i < 16; i++) { const x = -10 + i * 0.33, y = 1.9 + (i % 2 ? 0.35 : -0.25); if (i === 5 || i === 11) { O.push(bx(0.06, 0.32, 0.005, x, y, -4.7), bx(0.14, 0.04, 0.005, x, y + 0.16, -4.7)); continue; } T.push(bx(0.04, 0.28, 0.03, x, y, -4.68), bx(0.12, 0.05, 0.03, x, y + 0.15, -4.68)); } mm(I, 'hanging_tools', T, M.steel_aged); mm(I, 'missing_tool_outlines', O, M.linen_white); }
  P.shelves(I, -11.45, -2.2, 0.15, PI / 2, 2.4, 2.4, 0.45, M.steel_aged, 'tins'); col(box(I, 'tool_cabinet', M.enamel_green, 0.8, 1.3, 0.5, -3.6, 0.15, -4.4));
  mm(I, 'spare_tires', [0, 1, 2, 3].map(i => new THREE.TorusGeometry(0.28, 0.1, 10, 24).rotateX(PI / 2).translate(-11.2, 0.25 + i * 0.2, 0.8)), M.rubber);
  for (let i = 0; i < 3; i++) col(box(I, 'fuel_can', M.red_can, 0.35, 0.45, 0.18, -11.3, 0.15, 3.0 + i * 0.25));
  col(cyl(I, 'oil_drum', M.oil_drum, 0.3, 0.3, 0.9, 20, -10.9, 0.15, 4.2)); mm(I, 'drum_pump', [cg(0.02, 0.02, 0.5, 6, -10.9, 1.3, 4.2)], M.red_can);
  { const ch = grp(I, 'battery_charger_cart', -4.6, 0.15, -3.0); col(mm(ch, 'charger', [bx(0.5, 0.45, 0.35, 0, 0.6, 0), bx(0.55, 0.04, 0.4, 0, 0.35, 0)], M.enamel_cream)); mm(ch, 'charger_wheels', [cg(0.08, 0.08, 0.04, 12, -0.25, 0.08, 0, 0, PI / 2), cg(0.08, 0.08, 0.04, 12, 0.25, 0.08, 0, 0, PI / 2)], M.rubber); mm(ch, 'charger_leads', [new THREE.TorusGeometry(0.15, 0.01, 4, 16).translate(0.3, 0.9, 0)], M.red_can); col(box(I, 'battery', M.oil_drum, 0.3, 0.22, 0.18, -4.1, 0.15, -3.1)); }
  mm(I, 'trolley_jack', [bx(0.3, 0.12, 0.9, 0.0, 0.25, -3.4), cg(0.015, 0.015, 1.0, 5, 0, 0.6, -3.0, -0.8)], M.red_can);
  for (const x of [-7, -1.5, 4]) P.pendant(I, x, 3.6, 0.5, M.enamel_green); P.pendant(I, 8.7, 3.4, -3.2, M.enamel_cream);
  P.desk(I, 9.5, -4.2, 0.17, 0, 1.4, M.wood_pine); P.chair(I, 9.5, -3.5, 0.17, PI, M.wood_pine, M.leather_brown); col(box(I, 'filing_cabinet', M.steel_aged, 0.5, 1.3, 0.6, 11.3, 0.17, -2.4)); P.keys(I, 11.68, 1.8, -3.6, -PI / 2);
  mm(I, 'ledger', [bx(0.3, 0.04, 0.4, 9.3, 0.97, -4.2)], M.book_green); mm(I, 'wall_calendar', [bx(0.4, 0.55, 0.01, 7.5, 2.0, -4.73)], M.paper_sheet); P.documents(I, 9.8, 0.97, -4.1, 5, 0.2);
  stairRun(I, { name: 'loft_ladder', x: -10.1, z: -2.6, dir: '-z', w: 0.7, y0: 0.15, y1: 4.5, tread: 0.1, riser: 0.24, mat: M.raw_planks, open: true, nosing: false });
  for (let i = 0; i < 9; i++) col(box(I, 'hay_bale', M.sacking, 1.0, 0.45, 0.5, R(-8, 8), 4.5 + (i % 3) * 0.45, R(-4, -2)));
  P.crates(I, 6, 2, 4.5, 4); P.trunk(I, 3, -3.5, 4.5, 0.4);
  return CH;
}

// ================= GREENHOUSE =================
const pots = [];
function pot(p, x, z, y, r) { const pr = [[r * 0.65, 0], [r, r * 1.3], [r * 1.08, r * 1.35], [r * 1.08, r * 1.5], [r * 0.95, r * 1.5], [r * 0.9, r * 1.35]].map(([a, b]) => new THREE.Vector2(a, b)); const g = new THREE.LatheGeometry(pr, 14); g.translate(x, y, z); pots.push(g); const s = new THREE.CircleGeometry(r * 0.9, 12).rotateX(-PI / 2).translate(x, y + r * 1.3, z); pots.push(null); return [g, s]; }
function plantKinds(L, x, y, z, kind, s = 1) {
  if (kind === 'fern') { for (let i = 0; i < 9; i++) { const f = new THREE.PlaneGeometry(0.12 * s, 0.6 * s, 1, 4); const pa = f.attributes.position; for (let k = 0; k < pa.count; k++) { const v = pa.getY(k) / (0.6 * s) + 0.5; pa.setZ(k, -v * v * 0.35 * s); } f.translate(0, 0.3 * s, 0); f.rotateX(-0.5); f.rotateY(i / 9 * 6.28 + R(-0.2, 0.2)); f.translate(x, y, z); L.green.push(f); } }
  else if (kind === 'palm') { L.stem.push(cg(0.03 * s, 0.05 * s, 0.9 * s, 6, x, y + 0.45 * s, z)); for (let i = 0; i < 8; i++) { const f = new THREE.PlaneGeometry(0.22 * s, 0.9 * s, 1, 5); const pa = f.attributes.position; for (let k = 0; k < pa.count; k++) { const v = pa.getY(k) / (0.9 * s) + 0.5; pa.setZ(k, -v * v * 0.6 * s); } f.translate(0, 0.45 * s, 0); f.rotateX(-0.9); f.rotateY(i / 8 * 6.28); f.translate(x, y + 0.9 * s, z); L.dark.push(f); } }
  else if (kind === 'broad') { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; L.stem.push(cg(0.012, 0.015, 0.8 * s, 4, x + Math.sin(a) * 0.1, y + 0.4 * s, z + Math.cos(a) * 0.1)); const f = new THREE.PlaneGeometry(0.35 * s, 0.7 * s, 1, 3); const pa = f.attributes.position; for (let k = 0; k < pa.count; k++) pa.setZ(k, -Math.abs(pa.getX(k)) * 0.6); f.rotateX(-1.1); f.translate(0, 0.8 * s, 0.25 * s); f.rotateY(a); f.translate(x, y, z); L.green.push(f); } }
  else if (kind === 'cactus') { L.cactus.push(cg(0.07 * s, 0.08 * s, 0.4 * s, 10, x, y + 0.2 * s, z), sg(0.07 * s, x, y + 0.4 * s, z, 10, 6), cg(0.04 * s, 0.04 * s, 0.18 * s, 8, x + 0.1 * s, y + 0.3 * s, z, 0, 0.5)); }
  else if (kind === 'flower') { for (let i = 0; i < 7; i++) { const a = R(0, 6.28), rr = R(0.02, 0.14) * s; L.stem.push(cg(0.006, 0.006, 0.35 * s, 3, x + Math.sin(a) * rr, y + 0.17 * s, z + Math.cos(a) * rr)); (rnd() < 0.5 ? L.red : L.white).push(sg(0.05 * s, x + Math.sin(a) * rr, y + 0.35 * s, z + Math.cos(a) * rr, 6, 4)); } L.green.push(sg(0.16 * s, x, y + 0.1 * s, z, 8, 6, 1, 0.5, 1)); }
  else if (kind === 'citrus') { L.stem.push(cg(0.03, 0.05, 0.9 * s, 6, x, y + 0.45 * s, z)); L.dark.push(sg(0.45 * s, x, y + 1.15 * s, z, 12, 8)); for (let i = 0; i < 9; i++) { const a = R(0, 6.28), b = R(0.2, 1.2); L.orange.push(sg(0.05, x + Math.sin(a) * Math.sin(b) * 0.44 * s, y + 1.15 * s + Math.cos(b) * 0.44 * s, z + Math.cos(a) * Math.sin(b) * 0.44 * s, 6, 4)); } }
  else if (kind === 'dying') { for (let i = 0; i < 6; i++) { const f = new THREE.PlaneGeometry(0.08, 0.4 * s, 1, 3); f.translate(0, 0.2 * s, 0); f.rotateX(-1.2); f.rotateY(i); f.translate(x, y, z); L.yellow.push(f); } }
  else if (kind === 'seedlings') { for (let i = 0; i < 24; i++) L.green.push(new THREE.ConeGeometry(0.015, 0.06, 4).translate(x - 0.25 + (i % 6) * 0.1, y + 0.03, z - 0.15 + Math.floor(i / 6) * 0.1)); }
}
export function buildGreenhouse(model) {
  const GH = frame(grp(model, 'victorian_greenhouse', -76, 0, -6)); interiorGroups.push({ g: GH, c: [-76, 2, -6], keep: true });
  for (const [id, x0, x1, lx] of [['greenhouse_w', -11, -3.7, -7.3], ['greenhouse_c', -3.7, 3.7, 0], ['greenhouse_e', 3.7, 11, 7.3]]) room(GH, id, 'Greenhouse', [[x0, x1, -4, 4]], 0.1, 6.2, { building: 'Greenhouse', floor: 'Ground', slab: false, light: [lx, 3.4, 0], i: 16, dist: 11, col: 0xffb35a });
  wall(GH, { t: 0.3, y0: 0, h: 0.8, ext: M.brick_service, int: M.brick_service, a: [-11, 4], b: [11, 4], open: [ho(0, 0, 1.2, 0.8)], auto: false, name: 'gh_base_s' });
  wall(GH, { t: 0.3, y0: 0, h: 0.8, ext: M.brick_service, int: M.brick_service, a: [11, -4], b: [-11, -4], open: [ho(4.6, 0, 1.0, 0.8)], auto: false, name: 'gh_base_n' });
  wall(GH, { t: 0.3, y0: 0, h: 0.8, ext: M.brick_service, int: M.brick_service, a: [-11, -4], b: [-11, 4], auto: false, name: 'gh_base_w' }); wall(GH, { t: 0.3, y0: 0, h: 0.8, ext: M.brick_service, int: M.brick_service, a: [11, 4], b: [11, -4], auto: false, name: 'gh_base_e' });
  slab(GH, 'gh_floor', -10.85, 10.85, -3.85, 3.85, 0.1, 0.1, M.flags_interior, null); flatRect(GH, 'gh_path', M.gravel_wet, 21, 1.2, 0, 0, 0.11);
  // glazing: walls + elliptical arch
  const ar = th => [4 * Math.cos(th), 3.4 + 2.8 * Math.sin(th)];
  const pane = [], paneR = [], frameL = [], NA = 16;
  const quad = (a, b, c, d, list = pane) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); list.push(g); };
  for (let x = -11; x < 10.99; x += 0.55) {
    for (const zs of [4, -4]) for (let y = 0.8; y < 3.39; y += 0.65) { if (zs > 0 && Math.abs(x + 0.275) < 0.7 && y < 3) continue; const miss = Math.abs(x - 4.95) < 0.1 && zs < 0 && Math.abs(y - 2.1) < 0.1; if (miss) continue; quad([x, y, zs], [x + 0.55, y, zs], [x + 0.55, y + 0.65, zs], [x, y + 0.65, zs], rnd() < 0.05 ? paneR : pane); }
    for (let i = 0; i < NA; i++) { const [z0, y0] = ar(i / NA * PI), [z1, y1] = ar((i + 1) / NA * PI); quad([x, y0, z0], [x + 0.55, y0, z0], [x + 0.55, y1, z1], [x, y1, z1], rnd() < 0.06 ? paneR : pane); }
  }
  for (const xe of [-11, 11]) { for (let z = -4; z < 3.99; z += 0.5) for (let y = 0.8; y < 3.39; y += 0.65) { if (xe > 0 && false) continue; quad([xe, y, z], [xe, y, z + 0.5], [xe, y + 0.65, z + 0.5], [xe, y + 0.65, z]); } for (let i = 0; i < NA; i++) { const [z0, y0] = ar(i / NA * PI), [z1, y1] = ar((i + 1) / NA * PI); quad([xe, 3.4, z0], [xe, y0, z0], [xe, y1, z1], [xe, 3.4, z1]); } }
  const pm = M.greenhouse_pane; pm.map = paneDirt(); pm.alphaMap = null; pm.needsUpdate = true;
  const gl = mesh(GH, 'greenhouse_glass_panes', merge(pane, true), pm); gl.userData.keepUV = true; gl.castShadow = false;
  const gr = mesh(GH, 'greenhouse_replaced_panes', merge(paneR, true), M.glass_window); gr.userData.keepUV = true;
  for (let x = -11; x <= 11.01; x += 1.1) { const pts = []; for (let i = 0; i <= 24; i++) { const [z, y] = ar(i / 24 * PI); pts.push(new THREE.Vector3(x, y, z)); } frameL.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.035, 5)); for (const zs of [4, -4]) frameL.push(bx(0.07, 2.6, 0.07, x, 2.1, zs)); }
  for (let x = -11; x <= 11.01; x += 0.55) for (const zs of [4, -4]) frameL.push(bx(0.025, 2.6, 0.04, x, 2.1, zs));
  for (let i = 0; i <= NA; i++) { const [z, y] = ar(i / NA * PI); frameL.push(bx(22, 0.03, 0.03, 0, y, z)); }
  for (let y = 0.8; y < 3.5; y += 0.65) for (const zs of [4, -4]) frameL.push(bx(22, 0.04, 0.05, 0, y, zs));
  for (const xe of [-11, 11]) { for (let z = -4; z <= 4.01; z += 0.5) { const yt = 3.4 + 2.8 * Math.sqrt(Math.max(0, 1 - (z / 4) ** 2)); frameL.push(bx(0.04, yt - 0.8, 0.04, xe, 0.8 + (yt - 0.8) / 2, z)); } }
  frameL.push(bx(22, 0.3, 0.6, 0, 6.25, 0), bx(0.6, 0.6, 0.6, -11.2, 6.2, 0), bx(0.6, 0.6, 0.6, 11.2, 6.2, 0));
  for (let x = -9; x <= 9; x += 3) frameL.push(bx(1.2, 0.04, 0.5, x, 6.48, 0.3, 0, 0.35));
  mm(GH, 'greenhouse_iron_frame', frameL, M.trim_paint_white);
  mm(GH, 'greenhouse_finials', [cg(0.03, 0.06, 0.8, 8, -11.2, 6.9, 0), sg(0.08, -11.2, 7.35, 0), cg(0.03, 0.06, 0.8, 8, 11.2, 6.9, 0), sg(0.08, 11.2, 7.35, 0)], M.trim_paint_white);
  proxy(GH, 'gh_wall_proxy_s', bx(22, 3, 0.1, 0, 1.5, 4.0), false); proxy(GH, 'gh_wall_proxy_n', bx(22, 3, 0.1, 0, 1.5, -4.0), false); proxy(GH, 'gh_wall_proxy_w', bx(0.1, 3, 8, -11, 1.5, 0), false); proxy(GH, 'gh_wall_proxy_e', bx(0.1, 3, 8, 11, 1.5, 0), false);
  // vestibule
  const vg = []; for (const [a, b, c, d] of [[[-1.5, 0, 6.4], [1.5, 0, 6.4], [1.5, 3.2, 6.4], [-1.5, 3.2, 6.4]], [[-1.5, 0, 4], [-1.5, 0, 6.4], [-1.5, 3.2, 6.4], [-1.5, 3.2, 4]], [[1.5, 0, 6.4], [1.5, 0, 4], [1.5, 3.2, 4], [1.5, 3.2, 6.4]]]) quad(a, b, c, d, vg); const vm = mesh(GH, 'vestibule_glass', merge(vg, true), pm); vm.userData.keepUV = true;
  mm(GH, 'vestibule_frame', [bx(3.1, 0.1, 2.5, 0, 3.2, 5.2), bx(0.1, 3.2, 0.1, -1.5, 1.6, 6.4), bx(0.1, 3.2, 0.1, 1.5, 1.6, 6.4), bx(0.1, 2.3, 0.1, -0.55, 1.15, 6.42), bx(0.1, 2.3, 0.1, 0.55, 1.15, 6.42), bx(0.1, 3.2, 0.1, -1.5, 1.6, 4.0), bx(0.1, 3.2, 0.1, 1.5, 1.6, 4.0)], M.trim_paint_white);
  gableRoof(GH, { name: 'vestibule_roof', span: 3, rise: 1.4, len: 2.4, x: 0, y: 3.2, z: 5.2, mats: [pm, pm], over: 0.1, endOver: 0.05, t: 0.04, gutter: false, barge: true });
  proxy(GH, 'vest_proxy_w', bx(0.1, 3, 2.4, -1.5, 1.5, 5.2), false); proxy(GH, 'vest_proxy_e', bx(0.1, 3, 2.4, 1.5, 1.5, 5.2), false); proxy(GH, 'vest_proxy_s1', bx(0.95, 3, 0.1, -1.0, 1.5, 6.4), false); proxy(GH, 'vest_proxy_s2', bx(0.95, 3, 0.1, 1.0, 1.5, 6.4), false);
  { const H = grp(GH, 'vestibule_door_open', 0.55, 0, 6.42, -1.2); mm(H, 'glazed_door', [bx(1.1, 2.3, 0.05, -0.55, 1.15, 0)], M.trim_paint_white).material = M.glass_window; mm(H, 'glazed_door_frame', [bx(1.1, 0.08, 0.06, -0.55, 0.04, 0), bx(1.1, 0.08, 0.06, -0.55, 2.26, 0), bx(0.06, 2.3, 0.06, -1.07, 1.15, 0)], M.trim_paint_white); }
  // boiler house
  box(GH, 'boiler_house', M.brick_service, 4, 3.2, 3.2, 6, 0, -5.6); col(GH.children[GH.children.length - 1]);
  gableRoof(GH, { name: 'boiler_house_roof', span: 3.2, rise: 1.5, len: 4, x: 6, y: 3.2, z: -5.6, alongX: true, mats: [M.slate_mossy, M.slate_mossy], wall: M.brick_service, over: 0.3 });
  col(box(GH, 'boiler_chimney', M.brick_service, 0.9, 8.5, 0.9, 7.4, 0, -6.4)); mm(GH, 'boiler_smoke_cowl', [cg(0.25, 0.3, 0.6, 12, 7.4, 8.8, -6.4)], M.wrought_iron);
  mm(GH, 'heating_pipes', [cg(0.06, 0.06, 21, 10, 0, 0.4, -3.6, 0, PI / 2), cg(0.06, 0.06, 21, 10, 0, 0.55, -3.6, 0, PI / 2), cg(0.06, 0.06, 21, 10, 0, 0.4, 3.6, 0, PI / 2), cg(0.06, 0.06, 21, 10, 0, 0.55, 3.6, 0, PI / 2)], M.boiler_iron);
  // benches and plants
  const L = { green: [], dark: [], stem: [], cactus: [], red: [], white: [], orange: [], yellow: [] }, PT = [];
  for (const zs of [-2.5, 2.5]) { const sl = []; for (let i = 0; i < 12; i++) sl.push(bx(19, 0.04, 0.1, 0, 0.92, zs - 0.66 + i * 0.12)); for (let x = -9.5; x <= 9.5; x += 2.375) sl.push(bx(0.08, 0.9, 0.08, x, 0.45, zs - 0.6), bx(0.08, 0.9, 0.08, x, 0.45, zs + 0.6)); sl.push(bx(19, 0.03, 1.3, 0, 0.3, zs)); col(mm(GH, 'staging_bench', sl, M.wood_pine)); }
  const kinds = ['fern', 'palm', 'broad', 'cactus', 'flower', 'flower', 'fern', 'dying', 'seedlings', 'broad'];
  for (const zs of [-2.5, 2.5]) for (let x = -9.2; x < 9.4; x += R(0.45, 0.85)) { const k = kinds[(rnd() * kinds.length) | 0], r = R(0.09, 0.17), zz = zs + R(-0.35, 0.35); if (k === 'seedlings') { PT.push(bx(0.6, 0.06, 0.4, x, 0.97, zz)); plantKinds(L, x, 1.0, zz, k); continue; } PT.push(...pot(GH, x, zz, 0.94, r).filter(Boolean)); plantKinds(L, x, 0.94 + r * 1.3, zz, k, R(0.6, 1.1)); }
  for (const zs of [-2.5, 2.5]) for (let x = -9; x < 9.4; x += R(0.5, 1.2)) { const r = R(0.08, 0.14); PT.push(...pot(GH, x, zs + R(-0.4, 0.4), 0.33, r).filter(Boolean)); if (rnd() < 0.5) plantKinds(L, x, 0.33 + r * 1.3, zs, 'fern', 0.6); }
  for (const [x, z, k, s] of [[-10.0, 0, 'citrus', 1.2], [10.0, 0, 'palm', 1.7], [-5, 0, 'broad', 1.3], [5.5, 0, 'citrus', 1.0]]) { PT.push(...pot(GH, x, z, 0.1, 0.32).filter(Boolean)); plantKinds(L, x, 0.55, z, k, s); }
  for (const zs of [3.9, -3.9]) for (let x = -10; x < 10; x += 3.3) { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, [z, y] = ar(Math.min(t * 1.2, 1) * PI / 2 * (zs > 0 ? 1 : 1)); pts.push(new THREE.Vector3(x + Math.sin(t * 9) * 0.1, 0.9 + t * 4.5, zs * (1 - t * 0.35))); } L.stem.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 4)); for (let i = 0; i < 30; i++) { const t = rnd(), q = new THREE.CatmullRomCurve3(pts).getPoint(t); const f = new THREE.PlaneGeometry(0.1, 0.12); f.rotateY(R(0, 6)); f.translate(q.x + R(-0.1, 0.1), q.y, q.z + R(-0.1, 0.1)); L.green.push(f); } }
  mm(GH, 'terracotta_pots', PT, M.terracotta_int); mm(GH, 'plants_green', L.green, M.plant_green); mm(GH, 'plants_dark', L.dark, M.plant_dark); mm(GH, 'plant_stems', L.stem, M.plant_dark); mm(GH, 'cacti', L.cactus, M.cactus); mm(GH, 'flowers_red', L.red, M.flower_red); mm(GH, 'flowers_white', L.white, M.flower_white); mm(GH, 'citrus_fruit', L.orange, M.orange_fruit); mm(GH, 'plants_dying', L.yellow, M.plant_yellow);
  for (const [x, z] of [[-8, 1.0], [3, -0.9], [8.6, 0.8]]) { const wc = grp(GH, 'watering_can', x, 0.11, z, R(0, 6)); mm(wc, 'can', [cg(0.12, 0.13, 0.25, 16, 0, 0.13, 0), cg(0.015, 0.025, 0.35, 6, 0.16, 0.25, 0, 0, -0.9), new THREE.TorusGeometry(0.09, 0.012, 4, 12, PI).translate(0, 0.3, 0)], M.copper_pan); }
  P.tools(GH, -10.7, 0.1, -2.0, PI / 2, 4); P.sacks(GH, -10.3, 1.2, 0.1, 2); P.shelves(GH, 10.6, 2.6, 0.1, -PI / 2, 1.2, 1.8, 0.3, M.wood_pine, 'pots');
  for (const x of [-7.3, 0, 7.3]) { const lg = grp(GH, 'greenhouse_lantern', x, 3.6, 0); mm(lg, 'lantern_frame', [cg(0.006, 0.006, 2.4, 3, 0, 1.4, 0), bx(0.24, 0.03, 0.24, 0, 0.18, 0), bx(0.24, 0.03, 0.24, 0, -0.18, 0), new THREE.ConeGeometry(0.18, 0.15, 4).rotateY(PI / 4).translate(0, 0.26, 0)], M.brass); mm(lg, 'lantern_glow', [bx(0.2, 0.32, 0.2, 0, 0, 0)], M.shade_silk); }
  mm(GH, 'hose_coil', [new THREE.TorusGeometry(0.3, 0.02, 4, 32).rotateX(PI / 2).translate(9.5, 0.15, -0.9), new THREE.TorusGeometry(0.26, 0.02, 4, 32).rotateX(PI / 2).translate(9.5, 0.19, -0.9)], M.enamel_green);
  mm(GH, 'irrigation_taps', [cg(0.02, 0.02, 0.6, 6, -10.8, 0.7, 2.5), cg(0.05, 0.05, 0.03, 10, -10.8, 1.0, 2.5, 0, PI / 2)], M.brass);
  // kitchen garden, cold frames
  for (let i = 0; i < 8; i++) { const x = -10 + (i % 4) * 6.4, z = 12 + Math.floor(i / 4) * 8; box(GH, 'raised_bed', M.cedar_shingle, 4.8, 0.45, 1.6, x, 0, z); box(GH, 'raised_bed_soil', M.soil_bed, 4.6, 0.02, 1.4, x, 0.45, z); const V = []; for (let k = 0; k < 8; k++) V.push(new THREE.IcosahedronGeometry(R(0.16, 0.3), 1).translate(x - 2 + k * 0.55, 0.6, z + R(-0.3, 0.3))); if (i % 3) mm(GH, 'bed_brassicas', V, i % 2 ? M.salal : M.fern); }
  for (const x of [-10, -6.8]) { box(GH, 'cold_frame', M.cedar_shingle, 2.6, 0.5, 1.3, x, 0, 30); const l = box(GH, 'cold_frame_light', pm, 2.6, 0.04, 1.35, x, 0.55, 30); l.rotation.x = 0.12; }
  flatRect(GH, 'kitchen_garden_path', M.gravel_wet, 1.6, 26, 0, 21, 0.055); flatRect(GH, 'kitchen_garden_cross_path', M.gravel_wet, 26, 1.6, 0, 16, 0.055);
  box(GH, 'kitchen_garden_hedge_w', M.yew_hedge, 1.0, 1.4, 24, -14, 0, 21); box(GH, 'kitchen_garden_hedge_s_w', M.yew_hedge, 12, 1.4, 1.0, -8, 0, 33.5); box(GH, 'kitchen_garden_hedge_s_e', M.yew_hedge, 12, 1.4, 1.0, 9, 0, 33.5);
  col(cyl(GH, 'rainwater_cistern', M.cedar_shingle, 0.7, 0.65, 1.5, 24, 12.2, 0, 2.6)); mm(GH, 'cistern_hoops', [0.3, 0.8, 1.3].map(y => new THREE.TorusGeometry(0.69, 0.02, 4, 24).rotateX(PI / 2).translate(12.2, y, 2.6)), M.wrought_iron);
  mm(GH, 'compost_bays', [bx(4.5, 1.0, 0.1, 12, 0.5, -9), bx(0.1, 1.0, 1.6, 9.8, 0.5, -8.2), bx(0.1, 1.0, 1.6, 12, 0.5, -8.2), bx(0.1, 1.0, 1.6, 14.2, 0.5, -8.2)], M.cedar_shingle); mm(GH, 'compost', [sg(0.9, 10.9, 0, -8.2, 10, 6, 1, 0.6, 0.8), sg(0.9, 13.1, 0, -8.2, 10, 6, 1, 0.7, 0.8)], M.soil_bed);
  return GH;
}

// ================= GARDENER'S COTTAGE =================
export function buildCottage(model) {
  const K = frame(grp(model, 'gardeners_cottage', -102, 0, 16, 0.4)); interiorGroups.push({ g: K, c: [-102, 2, 16], keep: true });
  room(K, 'cottage_living', 'Cottage kitchen & parlour', [[-3.2, 1, -2.45, 2.45]], 0.45, 2.85, { building: "Gardener's cottage", floor: 'Ground', fm: M.floorboards, wm: M.paper_ochre_stripe, flicker: true, light: [-2.6, 1.2, -0.5], i: 10, dist: 8 });
  room(K, 'cottage_bed', 'Cottage bedroom', [[1, 3.2, -2.45, 0.3]], 0.45, 2.85, { building: "Gardener's cottage", floor: 'Ground', fm: M.floorboards, wm: M.paper_rose_floral, on: false, i: 6 });
  room(K, 'cottage_store', 'Cottage store', [[1, 3.2, 0.3, 2.45]], 0.45, 2.85, { building: "Gardener's cottage", floor: 'Ground', fm: M.floorboards, wm: M.plaster, i: 4 });
  room(K, 'cottage_loft', 'Cottage loft', [[-3.2, 3.2, -2.45, 2.45]], 3.1, 6.3, { building: "Gardener's cottage", floor: 'Loft', fm: M.raw_planks, wm: M.raw_planks, holes: [[-2.95, -2.15, -2.3, -0.9]], on: false, i: 4 });
  room(K, 'cottage_leanto', 'Potting & tool store', [[3.65, 5.7, -2.3, 1.1]], 0.15, 2.4, { building: "Gardener's cottage", floor: 'Ground', fm: M.flags_interior, wm: M.raw_planks, light: [4.7, 2.0, -0.6], i: 6 });
  const KW = { t: 0.3, y0: 0, h: 3.4, ext: M.cedar_shingle, int: 'auto' }, kw = at => wn(at, 1.25, 0.8, 1.05, '', {});
  wall(K, { ...KW, name: 'cottage_s', a: [-3.5, 2.6], b: [3.5, 2.6], open: [kw(-1.8), kw(2.2), dn(0.4, 0.45, 0.9, 2.0, { open: 1.0, leafM: M.door_green })] });
  wall(K, { ...KW, name: 'cottage_n', a: [3.5, -2.6], b: [-3.5, -2.6], open: [kw(-1.5), kw(2.1)] });
  wall(K, { ...KW, name: 'cottage_w', a: [-3.35, -2.75], b: [-3.35, 2.75] });
  wall(K, { ...KW, name: 'cottage_e', a: [3.35, 2.75], b: [3.35, -2.75], open: [dn(0.6, 0.45, 0.8, 1.95, { open: 1.2, leafM: M.raw_planks }), wn(0, 3.5, 0.6, 0.8, 'one', {})] });
  mm(K, 'cottage_stone_base', [bx(7.2, 0.45, 0.3, 0, 0.225, 2.6), bx(7.2, 0.45, 0.3, 0, 0.225, -2.6), bx(0.3, 0.45, 5.5, -3.35, 0.225, 0), bx(0.3, 0.45, 5.5, 3.35, 0.225, 0)], M.basalt_dressed);
  wall(K, { kind: 'part', t: 0.12, name: 'cottage_p_x1', a: [1, -2.45], b: [1, 2.45], y0: 0.45, h: 2.4, open: [dn(-1.0, 0.45, 0.8, 1.95), dn(1.4, 0.45, 0.8, 1.95)] });
  wall(K, { kind: 'part', t: 0.12, name: 'cottage_p_z03', a: [1, 0.3], b: [3.2, 0.3], y0: 0.45, h: 2.4 });
  gableRoof(K, { name: 'cottage_roof', span: 5.5, rise: 3.8, len: 7, x: 0, y: 3.4, z: 0, alongX: true, mats: [M.slate_mossy, M.slate_mossy], wall: M.cedar_shingle, over: 0.5 });
  { const C2 = (x, z, w, d, y0, top) => { col(box(K, 'cottage_chimney', M.basalt_dressed, w, top - y0, d, x, y0, z)); }; C2(-3.9, 0, 1.1, 0.9, 0, 8.6); box(K, 'cottage_chimney_cap', M.limestone_trim, 1.3, 0.2, 1.1, -3.9, 8.6, 0); }
  gableRoof(K, { name: 'cottage_porch_hood', span: 1.8, rise: 0.8, len: 1.0, x: 0.4, y: 2.75, z: 3.15, mats: [M.slate_mossy, M.slate_mossy], over: 0.1, t: 0.12, endOver: 0.05, gutter: false });
  // lean-to utility
  wall(K, { t: 0.15, y0: 0, h: 2.4, ext: M.cedar_shingle, int: M.raw_planks, auto: false, name: 'leanto_s', a: [3.5, 1.2], b: [5.8, 1.2], open: [dn(4.8, 0.15, 0.9, 1.95, { open: 1.3, leafM: M.raw_planks })] });
  wall(K, { t: 0.15, y0: 0, h: 2.4, ext: M.cedar_shingle, int: M.raw_planks, auto: false, name: 'leanto_e', a: [5.8, 1.2], b: [5.8, -2.4], open: [wn(-0.8, 1.2, 0.7, 0.6, 'one', {})] });
  wall(K, { t: 0.15, y0: 0, h: 2.4, ext: M.cedar_shingle, int: M.raw_planks, auto: false, name: 'leanto_n', a: [5.8, -2.4], b: [3.5, -2.4] });
  { const r = box(K, 'leanto_roof', M.slate_mossy, 2.8, 0.1, 4.1, 4.7, 2.55, -0.6); r.rotation.z = -0.2; col(r); }
  // furniture
  const f = 0.45; P.range(K, -2.8, -1.2, f, PI / 2, 1.0); P.table(K, -1.0, 0.4, f, 1.2, 0.8, 0.75, M.wood_pine); P.chair(K, -1.0, -0.15, f, 0, M.wood_pine, M.wood_pine); P.chair(K, -0.2, 0.6, f, -PI / 2, M.wood_pine, M.wood_pine);
  P.shelves(K, -2.9, 1.6, f, PI / 2, 1.2, 1.8, 0.3, M.wood_pine, 'jars'); P.shelves(K, 0.0, -2.3, f, 0, 1.4, 1.6, 0.3, M.wood_pine, 'books'); mm(K, 'ledger_open', [bx(0.45, 0.02, 0.32, -1.1, f + 0.76, 0.4, 0.2)], M.paper_sheet); mm(K, 'seed_packets', Array.from({ length: 8 }, (_, i) => bx(0.08, 0.005, 0.12, -0.7 + R(-0.15, 0.15), f + 0.756, 0.2 + R(-0.2, 0.2), R(0, 3))), M.red_can);
  mm(K, 'coat_hooks', [bx(1.0, 0.08, 0.03, 0.4, 2.0, 2.42), ...[0, 1, 2, 3].map(i => cg(0.01, 0.01, 0.08, 4, 0.0 + i * 0.27, 1.95, 2.38, PI / 2))], M.wood_pine); mm(K, 'hanging_coats', [cg(0.12, 0.2, 0.9, 10, 0.1, 1.45, 2.3), cg(0.1, 0.18, 0.8, 10, 0.65, 1.5, 2.3)], M.sacking);
  P.boots(K, -0.4, 2.15, f); P.boots(K, 0.1, 2.2, f, 0.4); P.keys(K, 0.98, 1.6, -0.2, PI / 2); P.armchair(K, -2.4, 1.6, f, PI / 2 + 0.5, M.fabric_green); P.rug(K, -1.6, 0.6, f, 1.6, 1.1, M.rug_green); P.candlestick(K, -0.8, f + 0.75, 0.6);
  P.bed(K, 2.2, -1.25, f, PI / 2, 0.9, 1.9, M.fabric_blue, false, M.iron_int); P.trunk(K, 2.6, -0.1, f, 0, 0.6); P.basin(K, 1.3, -2.15, f, 0);
  P.shelves(K, 2.95, 1.3, f, -PI / 2, 1.8, 2.0, 0.3, M.wood_pine, 'boxes'); P.tools(K, 1.4, f, 2.2, PI, 3);
  P.tools(K, 5.5, 0.15, -1.6, -PI / 2, 6); P.sacks(K, 3.9, -2.0, 0.15, 3); mm(K, 'pot_stacks', [0, 1, 2].flatMap(j => [0, 1, 2, 3, 4].map(i => cg(0.13, 0.1, 0.15, 12, 4.1 + j * 0.35, 0.22 + i * 0.1, 0.6))), M.terracotta_int);
  col(mm(K, 'potting_bench', [bx(1.8, 0.06, 0.6, 4.7, 0.9, -2.0), bx(0.06, 0.9, 0.6, 3.85, 0.45, -2.0), bx(0.06, 0.9, 0.6, 5.55, 0.45, -2.0)], M.wood_pine)); mm(K, 'knapsack_sprayer', [cg(0.15, 0.15, 0.5, 12, 5.4, 0.4, 0.4), cg(0.01, 0.01, 0.6, 4, 5.4, 0.9, 0.4, 0.6)], M.copper_pan);
  mm(K, 'fertiliser_tins', [cg(0.1, 0.1, 0.25, 12, 4.4, 1.05, -2.1), cg(0.1, 0.1, 0.2, 12, 4.7, 1.03, -2.1), cg(0.08, 0.08, 0.22, 12, 5.0, 1.04, -2.1)], M.enamel_green);
  stairRun(K, { name: 'cottage_loft_ladder', x: -2.55, z: -0.6, dir: '-z', w: 0.6, y0: 0.45, y1: 3.1, tread: 0.1, riser: 0.24, mat: M.raw_planks, open: true, nosing: false });
  P.bed(K, -1.0, -1.5, 3.1, 0, 0.8, 1.8, M.fabric_cream, false, M.wood_pine); P.crates(K, 1.8, 0.5, 3.1, 3);
  { const L = []; for (let i = 0; i < 30; i++) { const g = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6); g.rotateX(PI / 2); g.translate(6.4 + (i % 3) * 0.26, 0.12 + Math.floor(i / 3) * 0.12, -1.8 + (i % 5) * 0.03); L.push(g); } mm(K, 'cottage_woodpile', L, M.bark); }
  return K;
}
