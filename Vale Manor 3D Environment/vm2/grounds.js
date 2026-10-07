import { THREE, PI, M, R, rnd, mesh, box, cyl, grp, bx, cg, sg, merge, mm, col, walk, proxy, flatRect, flatDisc, ribbon, pyr, voids, trunks, animators, gableRoof } from './core.js';
import { flowTex } from './tex.js';

function lamp(p, x, z, y = 0) {
  const g = grp(p, 'lamp_post', x, y, z);
  const prof = [[0.2, 0], [0.22, 0.1], [0.12, 0.25], [0.09, 0.6], [0.06, 0.65], [0.05, 3.1], [0.08, 3.2]].map(([a, b]) => new THREE.Vector2(a, b));
  col(mesh(g, 'lamp_post_iron', new THREE.LatheGeometry(prof, 16), M.wrought_iron));
  mm(g, 'lamp_lantern_frame', [bx(0.4, 0.04, 0.4, 0, 3.24, 0), bx(0.44, 0.04, 0.44, 0, 3.78, 0), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => bx(0.025, 0.54, 0.025, a * 0.18, 3.5, b * 0.18)), new THREE.ConeGeometry(0.3, 0.3, 4).rotateY(PI / 4).translate(0, 3.95, 0), sg(0.04, 0, 4.15, 0)], M.wrought_iron);
  mesh(g, 'lamp_glass', new THREE.BoxGeometry(0.34, 0.5, 0.34), M.glass_window, 0, 3.5, 0);
}
function shrub(L, x, z, r, y = 0, n = 5) { for (let i = 0; i < n; i++) { const rr = r * R(0.45, 0.8); L.push(new THREE.IcosahedronGeometry(rr, 1).scale(1, R(0.65, 0.9), 1).translate(x + R(-r, r) * 0.5, y + rr * 0.6, z + R(-r, r) * 0.5)); } }
function fern(L, x, z, s = 1, y = 0) { const n = 6 + (rnd() * 4 | 0); for (let i = 0; i < n; i++) { const len = R(0.5, 0.9) * s, f = new THREE.PlaneGeometry(0.16 * s, len, 1, 4); const pa = f.attributes.position; for (let k = 0; k < pa.count; k++) { const v = pa.getY(k) / len + 0.5; pa.setZ(k, -v * v * 0.45 * len); pa.setX(k, pa.getX(k) * (1 - v * 0.7)); } f.translate(0, len / 2, 0); f.rotateX(-R(0.3, 0.7)); f.rotateY(i / n * 6.28 + R(-0.3, 0.3)); f.translate(x, y, z); L.push(f); } }
function conifer(T, Cn, x, z, h, rot = rnd() * 6.28) {
  const tr = new THREE.CylinderGeometry(0.12 + h * 0.01, 0.25 + h * 0.018, h * 0.45, 7); tr.translate(x, h * 0.225, z); T.push(tr);
  for (let i = 0; i < 4; i++) { const ht = h * (0.40 - i * 0.055), r = h * (0.16 - i * 0.03), by = h * (0.2 + i * 0.19); const c = new THREE.ConeGeometry(r, ht, 8, 2); const pa = c.attributes.position; for (let k = 0; k < pa.count; k++) { if (pa.getY(k) < 0) { pa.setX(k, pa.getX(k) * R(0.85, 1.12)); pa.setZ(k, pa.getZ(k) * R(0.85, 1.12)); pa.setY(k, pa.getY(k) + R(-0.5, 0.2)); } } c.computeVertexNormals(); c.rotateY(rot + i); c.translate(x, by + ht / 2, z); Cn.push(c); }
}
function heroConifer(T, Cn, Br, x, z, h) {
  const tr = new THREE.CylinderGeometry(0.1 + h * 0.006, 0.3 + h * 0.022, h * 0.97, 14, 6); const pa = tr.attributes.position; for (let k = 0; k < pa.count; k++) { const y = pa.getY(k) + h * 0.485; if (y < 0.6) { const s = 1 + (0.6 - y) * 0.9; pa.setX(k, pa.getX(k) * s); pa.setZ(k, pa.getZ(k) * s); } } tr.computeVertexNormals(); tr.translate(x, h * 0.485, z); T.push(tr);
  for (let i = 0; i < 5; i++) { const a = R(0, 6.28); T.push(cg(0.05, 0.12, 1.6, 6, x + Math.sin(a) * 0.6, 0.15, z + Math.cos(a) * 0.6, Math.cos(a) * 1.25, -Math.sin(a) * 1.25)); }
  for (let y = h * 0.28; y < h * 0.98; y += R(0.9, 1.4)) {
    const t = (y - h * 0.28) / (h * 0.7), len = (1 - t) * h * 0.2 + 0.6, nb = 5 + (rnd() * 3 | 0);
    for (let b = 0; b < nb; b++) { const a = b / nb * 6.28 + R(-0.3, 0.3) + y; const droop = R(0.15, 0.45);
      const g = new THREE.CylinderGeometry(0.015, 0.05, len, 4); g.translate(0, len / 2, 0); g.rotateX(PI / 2 - droop); g.rotateY(a); g.translate(x, y, z); Br.push(g);
      for (let k = 1; k <= 2; k++) { const d = len * (0.45 + k * 0.25), cx = x + Math.sin(a) * d * Math.cos(droop), cz = z + Math.cos(a) * d * Math.cos(droop), cy = y - d * Math.sin(droop); Cn.push(new THREE.IcosahedronGeometry(len * 0.35 + 0.3, 0).scale(1.3, 0.45, 1.3).rotateY(a).translate(cx, cy, cz)); } }
  }
  Cn.push(new THREE.ConeGeometry(0.6, h * 0.12, 7).translate(x, h * 0.95, z));
}
function maple(T, Cn, x, z, h) {
  const tr = new THREE.CylinderGeometry(0.2 + h * 0.008, 0.35 + h * 0.015, h * 0.55, 8); tr.translate(x, h * 0.275, z); T.push(tr);
  for (let i = 0; i < 4; i++) { const a = R(0, 6.28); T.push(cg(0.06, 0.15, h * 0.35, 5, x + Math.sin(a) * h * 0.08, h * 0.6, z + Math.cos(a) * h * 0.08, Math.cos(a) * 0.6, -Math.sin(a) * 0.6)); }
  for (let i = 0; i < 6; i++) { const r = h * R(0.12, 0.2); Cn.push(new THREE.IcosahedronGeometry(r, 1).scale(1, 0.75, 1).translate(x + R(-1, 1) * h * 0.18, h * R(0.55, 0.85), z + R(-1, 1) * h * 0.18)); }
}

export function buildGrounds(model, manor, toW, YAW, MX, obsW) {
  const ES = grp(model, 'estate_grounds'), LS = grp(manor, 'manor_landscape'); LS.userData.frameRef = manor;
  walk(flatDisc(model, 'ground_forest_floor', M.forest_floor, 430, 0, 0, 0, 72));
  // graded ground: forest floor -> long grass -> lawn -> gravel
  flatDisc(LS, 'meadow_rear', M.grass_long, 1, 2, -48, 0.02, 64, 38, 46); flatDisc(LS, 'meadow_front', M.grass_long, 1, 3, 40, 0.02, 64, 52, 36); flatDisc(LS, 'meadow_west', M.grass_long, 1, -48, 2, 0.02, 48, 30, 34);
  flatDisc(LS, 'rear_lawn', M.grass_lawn, 1, 2, -50, 0.03, 64, 32, 38); flatDisc(LS, 'front_lawn', M.grass_lawn, 1, 1.5, 32, 0.03, 64, 42, 26); flatDisc(LS, 'west_lawn', M.grass_lawn, 1, -48, 2, 0.03, 48, 24, 28); flatDisc(LS, 'east_lawn', M.grass_lawn, 1, 44, 8, 0.03, 48, 16, 20);
  flatDisc(ES, 'front_meadow', M.grass_long, 1, 8, 62, 0.025, 64, 47, 27);
  // ---- motor court ----
  const CC = { x: 1.5, z: 34 };
  flatDisc(LS, 'court_mud_rim', M.mud, 16.9, CC.x, CC.z, 0.045, 96); flatDisc(LS, 'motor_court_gravel', M.gravel_wet, 16, CC.x, CC.z, 0.06, 96);
  flatRect(LS, 'forecourt_gravel', M.gravel_wet, 11, 10, 1.5, 15.5, 0.06); flatDisc(LS, 'court_island_lawn', M.grass_lawn, 7.5, CC.x, CC.z, 0.085, 64);
  const kerb = (r, n, h, w, m, name) => { const L = []; for (let i = 0; i < n; i++) { const a = i / n * 2 * PI; if (r > 10 && (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.2 || Math.abs(Math.atan2(Math.sin(a - PI / 2), Math.cos(a - PI / 2))) < 0.15 || Math.abs(Math.atan2(Math.sin(a - PI), Math.cos(a - PI))) < 0.22)) continue; L.push(bx(2 * PI * r / n - 0.02, h, w, CC.x + Math.sin(a) * r, h / 2, CC.z + Math.cos(a) * r, a + PI / 2)); } mm(LS, name, L, m); };
  kerb(7.6, 64, 0.16, 0.25, M.limestone_trim, 'island_kerb'); kerb(16.1, 120, 0.1, 0.22, M.basalt_dressed, 'court_edge_kerb');
  { const L = []; for (let i = 0; i < 120; i++) { const a = i / 120 * 2 * PI; L.push(bx(2 * PI * 15.6 / 120, 0.02, 0.45, CC.x + Math.sin(a) * 15.6, 0.07, CC.z + Math.cos(a) * 15.6, a + PI / 2)); } mm(LS, 'court_drainage_channel', L, M.flagstone_wet);
    const G = []; for (const a of [0.4, 1.9, 2.7, 3.6, 4.4, 5.6]) { const x = CC.x + Math.sin(a) * 15.6, z = CC.z + Math.cos(a) * 15.6; G.push(bx(0.5, 0.03, 0.5, x, 0.085, z, a)); for (let k = -2; k <= 2; k++) G.push(bx(0.04, 0.035, 0.46, x + Math.cos(a) * k * 0.09, 0.09, z - Math.sin(a) * k * 0.09, a)); } mm(LS, 'gully_grates', G, M.wrought_iron); }
  for (const [r0, r1] of [[11.1, 11.35], [12.75, 13.0], [9.2, 9.42]]) { const g = new THREE.RingGeometry(r0, r1, 96, 1, 0.3, 5.2); g.rotateX(-PI / 2); mesh(LS, 'tire_marks_court', g, M.tire_track, CC.x, 0.07, CC.z); }
  for (const [dx, dz, r, s] of [[-9.5, 4, 1.4, 0.6], [8, -6, 1.1, 0.8], [-3, 11.5, 1.8, 0.5], [11, 8, 0.9, 1.2], [4, -12, 1.2, 0.6]]) flatDisc(LS, 'court_puddle', M.puddle, r, CC.x + dx, CC.z + dz, 0.1, 24, 1, s);
  // fountain
  { const F = grp(LS, 'octagonal_fountain', CC.x, 0, CC.z, -YAW);
    const oct = r => { const s = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = i * PI / 4 + PI / 8; s[i ? 'lineTo' : 'moveTo'](r * Math.sin(a), r * Math.cos(a)); } s.closePath(); return s; };
    const ring = (ro, ri, d, y, m, n) => { const s = oct(ro); s.holes.push(oct(ri)); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }); g.rotateX(-PI / 2); return col(mesh(F, n, g, m, 0, y, 0)); };
    walk(mesh(F, 'fountain_base_step', new THREE.CylinderGeometry(4.0, 4.15, 0.22, 8).rotateY(PI / 8), M.limestone_trim, 0, 0.11, 0));
    ring(3.6, 3.25, 0.75, 0.22, M.ashlar_1911, 'fountain_basin_wall'); ring(3.75, 3.15, 0.14, 0.97, M.limestone_trim, 'fountain_coping');
    mesh(F, 'basin_floor', new THREE.CylinderGeometry(3.26, 3.26, 0.05, 8).rotateY(PI / 8), M.flagstone_wet, 0, 0.25, 0);
    mesh(F, 'mineral_tide_line', new THREE.CylinderGeometry(3.255, 3.255, 0.12, 8, 1, true).rotateY(PI / 8), M.lichen_stone, 0, 0.78, 0).material.side = THREE.BackSide;
    mesh(F, 'fountain_moss_band', new THREE.CylinderGeometry(3.68, 3.68, 0.22, 8, 1, true).rotateY(PI / 8), M.moss, 0, 0.33, 0);
    const water = mesh(F, 'fountain_water', new THREE.CylinderGeometry(3.24, 3.24, 0.02, 8).rotateY(PI / 8), M.water_surface, 0, 0.72, 0); water.userData.noUV = true;
    const cr = []; for (let i = 0; i < 5; i++) { const a = R(0, 6.28); cr.push(bx(0.015, R(0.2, 0.5), 0.01, Math.sin(a) * 3.62, 0.5, Math.cos(a) * 3.62, a, 0, R(-0.4, 0.4))); } mm(F, 'basin_cracks', cr, M.soot);
    mm(F, 'basin_drain', [cg(0.18, 0.18, 0.03, 16, 1.8, 0.29, 0), cg(0.05, 0.05, 0.25, 8, 0, 0.6, 3.75, PI / 2)], M.wrought_iron);
    const ped = [[0.62, 0], [0.7, 0.12], [0.5, 0.25], [0.42, 0.6], [0.36, 1.4], [0.45, 1.55], [0.5, 1.7], [0, 1.7]].map(([a, b]) => new THREE.Vector2(a, b)); col(mesh(F, 'fountain_pedestal', new THREE.LatheGeometry(ped, 32), M.limestone_trim, 0, 0.25, 0));
    const pr = [[0.25, 0], [0.6, 0.1], [1.3, 0.35], [1.68, 0.55], [1.72, 0.66], [1.62, 0.66], [1.2, 0.48], [0.3, 0.3]].map(([a, b]) => new THREE.Vector2(a, b));
    mesh(F, 'fountain_lower_bowl', new THREE.LatheGeometry(pr, 48), M.limestone_trim, 0, 1.92, 0); mesh(F, 'lower_bowl_water', new THREE.CircleGeometry(1.6, 48).rotateX(-PI / 2), M.water_surface, 0, 2.5, 0);
    mesh(F, 'fountain_upper_column', new THREE.LatheGeometry([[0.22, 0], [0.16, 0.2], [0.13, 0.9], [0.2, 1.1], [0, 1.1]].map(([a, b]) => new THREE.Vector2(a, b)), 24), M.limestone_trim, 0, 2.3, 0);
    const ub = mesh(F, 'fountain_upper_bowl', new THREE.LatheGeometry(pr, 40), M.limestone_trim, 0, 3.4, 0); ub.scale.set(0.48, 0.6, 0.48); mesh(F, 'upper_bowl_water', new THREE.CircleGeometry(0.78, 32).rotateX(-PI / 2), M.water_surface, 0, 3.78, 0);
    mesh(F, 'fountain_finial', new THREE.LatheGeometry([[0.1, 0], [0.16, 0.12], [0.08, 0.3], [0.12, 0.42], [0, 0.6]].map(([a, b]) => new THREE.Vector2(a, b)), 20), M.limestone_trim, 0, 3.75, 0);
    const ft = flowTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(8, 1);
    const fm = new THREE.MeshStandardMaterial({ name: 'water_flow', map: ft, transparent: true, opacity: 0.55, roughness: 0.05, color: 0xb8d0d8, depthWrite: false, side: THREE.DoubleSide });
    const s1 = mesh(F, 'water_sheet_upper', new THREE.CylinderGeometry(0.82, 0.88, 1.28, 40, 1, true), fm, 0, 3.12, 0), s2 = mesh(F, 'water_sheet_lower', new THREE.CylinderGeometry(1.7, 1.85, 1.8, 48, 1, true), fm, 0, 1.62, 0); s1.userData.noUV = s2.userData.noUV = true; s1.castShadow = s2.castShadow = false;
    const jet = mesh(F, 'water_jet', new THREE.CylinderGeometry(0.02, 0.035, 0.7, 8, 1, true), fm, 0, 4.7, 0); jet.userData.noUV = true;
    const N = 260, pp = new Float32Array(N * 3), seed = []; for (let i = 0; i < N; i++) seed.push([R(0, 6.28), R(0, 1), i % 3]);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x9fb4bc, size: 0.022, transparent: true, opacity: 0.4, depthWrite: false })); pts.name = 'fountain_droplets'; pts.frustumCulled = false; F.add(pts); pts.userData.noExport = true;
    animators.push((dt, t) => { ft.offset.y = -t * 0.9; for (let i = 0; i < N; i++) { const s = seed[i]; s[1] += dt * 0.9; if (s[1] > 1) s[1] -= 1; const u = s[1]; let x, y, z; if (s[2] === 0) { const r = 0.05 + u * 0.4; x = Math.sin(s[0]) * r; z = Math.cos(s[0]) * r; y = 5.05 + u * 0.3 - u * u * 1.6; } else if (s[2] === 1) { x = Math.sin(s[0]) * 0.86; z = Math.cos(s[0]) * 0.86; y = 3.78 - u * 1.3; } else { x = Math.sin(s[0]) * 1.8; z = Math.cos(s[0]) * 1.8; y = 2.5 - u * 1.8; } pp[i * 3] = x; pp[i * 3 + 1] = y; pp[i * 3 + 2] = z; } pg.attributes.position.needsUpdate = true; });
  }
  for (const a of [0.6, -0.6, PI - 0.6, PI + 0.6]) lamp(LS, CC.x + 17.4 * Math.sin(a), CC.z + 17.4 * Math.cos(a));
  // restrained landscaping around court
  { const Rh = [], Hy = [], Ast = [], Yw = [];
    for (const [x, z, r] of [[-15.5, 22, 1.7], [-18, 27, 2.2], [-19.5, 33, 1.9], [-18.6, 39, 2.0], [-16, 45, 1.5], [19.5, 24, 1.8], [21.5, 30, 2.1], [20.5, 41, 1.7], [17, 46.5, 1.4]]) shrub(Rh, x, z, r, 0, 6);
    for (const [x, z] of [[-4.2, 18.4], [7.2, 18.4], [-6.0, 16.8], [9.0, 16.8]]) shrub(Hy, x, z, 0.9, 0, 4);
    for (let i = 0; i < 160; i++) { const a = R(0, 2 * PI), r = R(6.3, 7.2); Ast.push(new THREE.IcosahedronGeometry(R(0.08, 0.16), 0).translate(CC.x + Math.sin(a) * r, 0.18, CC.z + Math.cos(a) * r)); }
    for (const x of [-13, -9.4, -7.2, 10.6, 12.8]) Yw.push(new THREE.CylinderGeometry(0.42, 0.55, 1.4, 12).translate(x, 0.7, 11.5));
    mm(LS, 'court_rhododendrons', Rh, M.rhododendron); mm(LS, 'porch_hydrangeas', Hy, M.hydrangea); mm(LS, 'island_asters', Ast, M.aster); mm(LS, 'clipped_yews', Yw, M.yew_hedge);
    const Rh2 = []; for (const [x, z, r] of [[-14.5, -12, 1.4], [-15, -16.5, 1.7], [-13.5, -21, 1.4], [8.2, -21, 1.2]]) shrub(Rh2, x, z, r, 0, 5); mm(LS, 'terrace_rhododendrons', Rh2, M.rhododendron);
    const fb = []; for (let i = 0; i < 90; i++) fb.push(new THREE.IcosahedronGeometry(R(0.08, 0.15), 0).translate(R(-11.5, 5.5), 0.15, R(-20.3, -19.7))); mm(LS, 'terrace_border_flowers', fb, M.aster); flatRect(LS, 'terrace_border_soil', M.soil_bed, 17.5, 0.9, -3.1, -20.0, 0.05); }
  // ---- drive & paths (true north frame) ----
  const drivePts = [toW(1.5, 50), toW(4, 64), new THREE.Vector3(24, 0, 94), new THREE.Vector3(30, 0, 124), new THREE.Vector3(14, 0, 153), new THREE.Vector3(-14, 0, 179), new THREE.Vector3(-34, 0, 199), new THREE.Vector3(-42, 0, 214)];
  for (const o of [-3.4, 3.4]) ribbon(ES, 'drive_mud_verge', M.mud, drivePts, 1.4, 0.045, { offset: o });
  const drive = ribbon(ES, 'gravel_drive', M.gravel_wet, drivePts, 5.6, 0.055);
  for (const o of [-0.8, 0.8]) ribbon(ES, 'drive_tire_track', M.tire_track, drivePts, 0.26, 0.062, { offset: o });
  ribbon(ES, 'drainage_ditch', M.puddle, drivePts.slice(2), 0.5, 0.05, { offset: 4.6 });
  const GT = drive.curve.getPointAt(1), Gt = drive.curve.getTangentAt(1);
  const lane = ribbon(ES, 'county_lane_beyond_gate', M.mud, [GT, GT.clone().addScaledVector(Gt, 18), new THREE.Vector3(GT.x + Gt.x * 34 - 10, 0, GT.z + Gt.z * 34 + 4)], 5, 0.05);
  for (const t of [0.18, 0.33, 0.47, 0.71, 0.86]) { const q = drive.curve.getPointAt(t); flatDisc(ES, 'drive_puddle', M.puddle, R(0.8, 1.6), q.x + R(-1, 1), q.z, 0.1, 20, 1, R(0.4, 0.8), R(0, 3)); }
  for (const t of [0.12, 0.3, 0.5, 0.7, 0.88]) { const q = drive.curve.getPointAt(t), tg = drive.curve.getTangentAt(t); lamp(ES, q.x - tg.z * 3.9, q.z + tg.x * 3.9); }
  for (const t of [0.22, 0.6]) { const q = drive.curve.getPointAt(t); mm(ES, 'manhole_cover', [cg(0.35, 0.35, 0.03, 20, q.x + 1.2, 0.07, q.z)], M.wrought_iron); }
  { const W = []; for (let i = 0; i < 700; i++) { const t = rnd(), q = drive.curve.getPointAt(t), tg = drive.curve.getTangentAt(t), o = (rnd() < 0.5 ? -1 : 1) * R(2.6, 3.4); for (let k = 0; k < 4; k++) W.push(new THREE.ConeGeometry(0.02, R(0.15, 0.35), 3).translate(q.x - tg.z * o + R(-0.1, 0.1), 0.15, q.z + tg.x * o + R(-0.1, 0.1))); } mm(ES, 'verge_weeds', W, M.grass_long); }
  const svc = ribbon(ES, 'service_drive', M.gravel_wet, [toW(17, 33), toW(28, 31), new THREE.Vector3(46, 0, 26), new THREE.Vector3(62, 0, 19)], 4, 0.055);
  const svcN = ribbon(ES, 'service_yard_track', M.gravel_wet, [toW(34, -24), new THREE.Vector3(50, 0, -18), new THREE.Vector3(66, 0, -6)], 3.5, 0.055);
  const wPath = ribbon(ES, 'west_garden_path', M.gravel_wet, [toW(-14.5, 33), toW(-30, 22), new THREE.Vector3(-50, 0, 12), new THREE.Vector3(-64, 0, 4), new THREE.Vector3(-76, 0, 0)], 2.2, 0.055);
  const servPath = ribbon(ES, 'servants_path_kitchen_to_greenhouse', M.mud, [toW(20, -26), toW(-2, -27), toW(-16, -24), new THREE.Vector3(-40, 0, -14), new THREE.Vector3(-58, 0, -12), new THREE.Vector3(-71.4, 0, -10.5)], 1.5, 0.05);
  const cPath = ribbon(ES, 'cottage_path', M.mud, [new THREE.Vector3(-76, 0, 0), new THREE.Vector3(-90, 0, 4), new THREE.Vector3(-100, 0, 12)], 1.6, 0.05);
  const lawnN = toW(2, -86);
  const nPath = ribbon(ES, 'cemetery_footpath', M.mud, [new THREE.Vector3(MX - 2, 0, lawnN.z + 2), new THREE.Vector3(MX - 8, 0, -102), new THREE.Vector3(MX + 3, 0, -121), new THREE.Vector3(MX, 0, -145)], 1.4, 0.05);
  { const sz = obsW.z - 14; mm(ES, 'sundial', [cg(0.24, 0.34, 1.0, 8, MX, 0.5, sz), cg(0.4, 0.4, 0.08, 8, MX, 1.04, sz)], M.limestone_trim); mm(ES, 'sundial_plate', [cg(0.36, 0.36, 0.02, 32, MX, 1.09, sz)], M.copper_verdigris); mm(ES, 'sundial_gnomon_north', [bx(0.02, 0.3, 0.4, MX, 1.2, sz - 0.05, 0, -0.6)], M.wrought_iron);
    const L = []; for (let z = obsW.z - 7; z > lawnN.z + 4; z -= 5.5) if (Math.abs(z - sz) > 2) L.push(bx(0.55, 0.05, 0.55, MX, 0.06, z)); mm(ES, 'meridian_flagstones', L, M.flagstone_wet); }
  // ---- gate ----
  { const G = grp(ES, 'entrance_gate', GT.x, 0, GT.z, Math.atan2(Gt.x, Gt.z));
    for (const s of [-1, 1]) {
      col(mm(G, 'gate_pier', [bx(1.1, 0.4, 1.1, s * 3.3, 0.2, 0), bx(1.0, 3.2, 1.0, s * 3.3, 2.0, 0), bx(1.2, 0.15, 1.2, s * 3.3, 3.25, 0), bx(1.3, 0.3, 1.3, s * 3.3, 3.75, 0)], M.basalt_dressed));
      box(G, 'gate_pier_moss', M.moss, 1.32, 0.06, 1.32, s * 3.3, 3.9, 0); mesh(G, 'gate_pier_ball', new THREE.SphereGeometry(0.36, 24, 16), M.limestone_trim, s * 3.3, 4.32, 0);
      col(box(G, 'boundary_wall', M.basalt_rubble_1874, 26, 1.6, 0.6, s * 16.8, 0, 0)); box(G, 'boundary_wall_cap', M.basalt_dressed, 26.2, 0.18, 0.75, s * 16.8, 1.6, 0); box(G, 'boundary_wall_moss', M.moss, 26.1, 0.3, 0.66, s * 16.8, 0, 0);
      for (let i = 1; i <= 3; i++) col(box(G, 'boundary_wall_pier', M.basalt_rubble_1874, 0.9, 2.1, 0.9, s * (3.8 + i * 7), 0, 0));
      const L = []; const w = 2.75, n = 19;
      for (let i = 0; i < n; i++) { const u = i / (n - 1), h = 2.3 + 0.6 * u * u; L.push(cg(0.022, 0.022, h, 6, -s * u * w, 0.15 + h / 2, 0), new THREE.ConeGeometry(0.035, 0.12, 6).translate(-s * u * w, 0.15 + h + 0.06, 0)); }
      for (const y of [0.25, 1.2, 2.2]) L.push(bx(w, 0.06, 0.05, -s * w / 2, y, 0)); L.push(bx(0.08, 2.4, 0.08, 0, 1.35, 0));
      for (let k = 0; k < 5; k++) L.push(new THREE.TorusGeometry(0.12, 0.012, 4, 16).translate(-s * (0.3 + k * 0.5), 1.7, 0));
      const leaf = mesh(G, s < 0 ? 'gate_leaf_west' : 'gate_leaf_east_ajar', merge(L), M.wrought_iron, s * 2.78, 0, 0); if (s > 0) leaf.rotation.y = -0.38; else col(leaf);
      mm(G, 'gate_pintles', [cg(0.04, 0.04, 0.12, 8, s * 2.85, 0.4, 0), cg(0.04, 0.04, 0.12, 8, s * 2.85, 2.1, 0)], M.wrought_iron);
    }
    mm(G, 'gate_drop_bolt_socket', [cg(0.05, 0.05, 0.03, 10, 0, 0.07, 0)], M.wrought_iron); }
  // ---- cemetery ----
  const cemZ = -152;
  { const Y = grp(ES, 'family_cemetery', MX, 0, cemZ);
    flatRect(Y, 'cemetery_grass', M.grass_long, 18, 14, 0, 0, 0.03);
    const L = [], hx = 9, hz = 7;
    const run = (x1, z1, x2, z2) => { const len = Math.hypot(x2 - x1, z2 - z1), n = Math.floor(len / 0.16); for (let i = 0; i <= n; i++) { const t = i / n; L.push(cg(0.016, 0.016, 1.25, 4, x1 + (x2 - x1) * t, 0.85, z1 + (z2 - z1) * t)); } L.push(bx(Math.abs(x2 - x1) + 0.04, 0.05, Math.abs(z2 - z1) + 0.04, (x1 + x2) / 2, 1.3, (z1 + z2) / 2), bx(Math.abs(x2 - x1) + 0.04, 0.05, Math.abs(z2 - z1) + 0.04, (x1 + x2) / 2, 0.45, (z1 + z2) / 2)); proxy(Y, 'cem_rail_proxy', bx(Math.abs(x2 - x1) + 0.1, 1.6, Math.abs(z2 - z1) + 0.1, (x1 + x2) / 2, 0.8, (z1 + z2) / 2), false); };
    run(-hx, -hz, hx, -hz); run(-hx, -hz, -hx, hz); run(hx, -hz, hx, hz); run(-hx, hz, -0.9, hz); run(0.9, hz, hx, hz);
    for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz], [-0.9, hz], [0.9, hz]]) L.push(bx(0.12, 1.6, 0.12, x, 0.8, z), sg(0.08, x, 1.65, z));
    mm(Y, 'cemetery_iron_railing', L, M.wrought_iron);
    mm(Y, 'cemetery_kerb', [bx(18.3, 0.3, 0.35, 0, 0.15, -hz), bx(0.35, 0.3, 14.3, -hx, 0.15, 0), bx(0.35, 0.3, 14.3, hx, 0.15, 0), bx(8.1, 0.3, 0.35, -4.95, 0.15, hz), bx(8.1, 0.3, 0.35, 4.95, 0.15, hz)], M.gravestone);
    col(box(Y, 'mausoleum_vale', M.gravestone, 3.2, 3.0, 4.0, 0, 0, -4.4)); box(Y, 'mausoleum_plinth', M.basalt_dressed, 3.6, 0.4, 4.4, 0, 0, -4.4);
    gableRoof(Y, { name: 'mausoleum_roof', span: 3.2, rise: 1.2, len: 4, x: 0, y: 3.0, z: -4.4, mats: [M.gravestone, M.gravestone], wall: M.gravestone, over: 0.25, endOver: 0.2, gutter: false, bargeM: M.gravestone });
    box(Y, 'mausoleum_iron_door', M.wrought_iron, 1.1, 2.0, 0.1, 0, 0.4, -2.38); box(Y, 'mausoleum_moss', M.moss, 3.25, 0.25, 4.05, 0, 0.4, -4.4); mm(Y, 'mausoleum_columns', [cg(0.14, 0.16, 2.6, 16, -1.2, 1.7, -2.3), cg(0.14, 0.16, 2.6, 16, 1.2, 1.7, -2.3)], M.gravestone);
    const stones = [[-6, 1.5, 'round'], [-4, 1.6, 'tall'], [-2.2, 1.4, 'cross'], [2.4, 1.5, 'round'], [4.3, 1.4, 'slab'], [6.2, 1.6, 'tall'], [-5.2, 4.2, 'slab'], [-2.8, 4.4, 'round'], [3.2, 4.1, 'cross'], [5.6, 4.4, 'round']];
    for (const [x, z, k] of stones) { const g = grp(Y, 'headstone_' + k, x, 0, z, R(-0.12, 0.12)); g.rotation.z = R(-0.05, 0.05);
      if (k === 'round') { col(box(g, 'stone', M.gravestone, 0.75, 0.75, 0.16, 0, 0, 0)); mesh(g, 'stone_top', new THREE.CylinderGeometry(0.375, 0.375, 0.16, 24, 1, false, -PI / 2, PI).rotateX(PI / 2), M.gravestone, 0, 0.75, 0); }
      else if (k === 'tall') { col(box(g, 'stone', M.gravestone, 0.6, 1.25, 0.18, 0, 0, 0)); box(g, 'stone_moss_cap', M.moss, 0.62, 0.05, 0.2, 0, 1.25, 0); }
      else if (k === 'cross') { box(g, 'stone_base', M.gravestone, 0.6, 0.25, 0.4, 0, 0, 0); box(g, 'cross_upright', M.gravestone, 0.14, 1.2, 0.14, 0, 0.25, 0); box(g, 'cross_arm', M.gravestone, 0.6, 0.14, 0.14, 0, 1.0, 0); }
      else { const s = box(g, 'stone_slab', M.gravestone, 0.8, 0.95, 0.15, 0, 0, 0); s.rotation.x = -0.1; } }
    { const o = grp(Y, 'obelisk_founder', 0, 0, 1.8); col(box(o, 'obelisk_base', M.basalt_dressed, 0.9, 0.5, 0.9, 0, 0, 0)); mesh(o, 'obelisk_shaft', new THREE.CylinderGeometry(0.2, 0.33, 2.4, 4).rotateY(PI / 4), M.gravestone, 0, 1.7, 0); pyr(o, 'obelisk_tip', M.gravestone, 0.3, 0.3, 0.35, 0, 2.9, 0); }
    col(box(Y, 'cemetery_bench', M.gravestone, 1.6, 0.45, 0.45, 6.5, 0, -2));
    const T = [], Cn = []; conifer(T, Cn, -7, -5.5, 9, 0.4); mm(Y, 'cemetery_yew_trunk', T, M.bark); mm(Y, 'cemetery_yew', Cn, M.yew_hedge);
    const Mu = []; for (let i = 0; i < 40; i++) { const x = R(-8.5, 8.5), z = R(-6.5, 6.5); Mu.push(cg(0.012, 0.015, 0.08, 5, x, 0.04, z), new THREE.SphereGeometry(0.04, 8, 4, 0, 2 * PI, 0, PI / 2).scale(1, 0.6, 1).translate(x, 0.08, z)); } mm(Y, 'mushrooms', Mu, M.mushroom); }
  // ---- forest & undergrowth ----
  const corridors = [[drive.samples, 8], [lane.samples, 7], [svc.samples, 6], [svcN.samples, 5], [wPath.samples, 4], [cPath.samples, 3], [nPath.samples, 2.6], [servPath.samples, 2.4]];
  const circles = [[-84, 6, 34], [72, 6, 25], [MX, cemZ, 15], [GT.x, GT.z, 9]];
  const blocked = (x, z) => {
    if (((x - 6) / 64) ** 2 + ((z + 18) / 70) ** 2 < 1) return true; if (((x - 8) / 46) ** 2 + ((z - 62) / 26) ** 2 < 1) return true;
    for (const [cx, cz, r] of circles) if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
    for (const [s, d] of corridors) for (let i = 0; i < s.length; i += 2) { const q = s[i]; if ((q.x - x) ** 2 + (q.z - z) ** 2 < d * d) return true; }
    return false;
  };
  const edge = (x, z, d) => blocked(x + d, z) || blocked(x - d, z) || blocked(x, z + d) || blocked(x, z - d);
  const cell = {}, T = [], F = [], Cd = [], Mp = [], Mr = [], U = [], HT = [], HC = [], HB = [], maples = [];
  let heroes = 0;
  for (let i = 0; i < 12000; i++) {
    const x = R(-270, 270), z = R(-270, 270); if (x * x + z * z > 265 * 265 || blocked(x, z)) continue;
    const kx = Math.floor(x / 6), kz = Math.floor(z / 6); let near = false;
    for (let a = -1; a <= 1 && !near; a++) for (let b = -1; b <= 1 && !near; b++) for (const q of cell[(kx + a) + ',' + (kz + b)] || []) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < 30) { near = true; break; }
    if (near) continue; (cell[kx + ',' + kz] ||= []).push([x, z]);
    const r = rnd(), h = R(22, 44);
    if (r < 0.1) { const hh = R(12, 19); maple(T, rnd() < 0.6 ? Mp : Mr, x, z, hh); maples.push([x, z]); trunks.push([x, z, 0.45]); }
    else if (r < 0.24) conifer(T, U, x, z, R(5, 11));
    else if (heroes < 90 && edge(x, z, 9)) { heroConifer(HT, HC, HB, x, z, h); heroes++; trunks.push([x, z, 0.6]); }
    else { conifer(T, rnd() < 0.62 ? F : Cd, x, z, h); trunks.push([x, z, 0.5]); }
  }
  { const a = toW(-30, -48), b = toW(-24, 47), c = toW(22, -60); heroConifer(HT, HC, HB, a.x, a.z, 40); heroConifer(HT, HC, HB, c.x, c.z, 31); maple(T, Mp, b.x, b.z, 17); maples.push([b.x, b.z]); trunks.push([a.x, a.z, 0.9], [c.x, c.z, 0.7], [b.x, b.z, 0.5]); }
  mm(ES, 'forest_trunks', T, M.bark); mm(ES, 'forest_douglas_fir', F, M.douglas_fir); mm(ES, 'forest_red_cedar', Cd, M.red_cedar); mm(ES, 'forest_understory_fir', U, M.douglas_fir);
  mm(ES, 'forest_bigleaf_maple', Mp, M.maple_autumn); mm(ES, 'forest_maple_rust', Mr, M.maple_rust);
  mm(ES, 'hero_tree_trunks', HT, M.bark); mm(ES, 'hero_tree_branches', HB, M.bark); mm(ES, 'hero_tree_foliage', HC, M.red_cedar);
  // undergrowth: ferns concentrated at the wild edge, salal, logs, mushrooms, leaves
  const Fe = [], Sa = [], Lg = [], Mu = [], Lv = [];
  for (let i = 0; i < 9000 && Fe.length < 26000; i++) { const x = R(-240, 240), z = R(-240, 240); if (x * x + z * z > 240 * 240 || blocked(x, z)) continue; const e = edge(x, z, 6); if (!e && rnd() < 0.7) continue; fern(Fe, x, z, R(0.7, 1.4)); if (rnd() < 0.5) fern(Fe, x + R(-1, 1), z + R(-1, 1), R(0.6, 1)); if (rnd() < 0.25) shrub(Sa, x + R(-2, 2), z + R(-2, 2), R(0.6, 1.2), 0, 4); }
  for (let i = 0; i < 40; i++) { const x = R(-200, 200), z = R(-200, 200); if (blocked(x, z)) continue; const a = R(0, 6.28), l = R(4, 9); Lg.push(cg(0.3, 0.38, l, 10, x, 0.32, z, PI / 2).rotateY(a)); for (let k = 0; k < 6; k++) { const mx = x + R(-0.5, 0.5), mz = z + R(-0.5, 0.5); Mu.push(cg(0.015, 0.02, 0.1, 5, mx, 0.05, mz), new THREE.SphereGeometry(0.06, 8, 4, 0, 2 * PI, 0, PI / 2).scale(1, 0.5, 1).translate(mx, 0.1, mz)); } }
  for (const [mx, mz] of maples) for (let k = 0; k < 120; k++) { const a = R(0, 6.28), r = Math.sqrt(rnd()) * 9, g = new THREE.PlaneGeometry(0.12, 0.1); g.rotateX(-PI / 2); g.rotateY(R(0, 6)); g.translate(mx + Math.sin(a) * r, 0.075, mz + Math.cos(a) * r); Lv.push(g); }
  for (let k = 0; k < 900; k++) { const p = toW(R(-30, 32), R(25, 58)); const g = new THREE.PlaneGeometry(0.12, 0.1); g.rotateX(-PI / 2); g.rotateY(R(0, 6)); g.translate(p.x, 0.075, p.z); Lv.push(g); }
  mm(ES, 'ferns_sword', Fe, M.fern); mm(ES, 'salal_undergrowth', Sa, M.salal); mm(ES, 'fallen_logs', Lg, M.bark); mm(ES, 'forest_mushrooms', Mu, M.mushroom); const lv = mm(ES, 'fallen_leaves', Lv, M.fallen_leaves); lv.castShadow = false;
  // ---- hidden volumes ----
  const vM = new THREE.MeshStandardMaterial({ name: 'hidden_volume', color: 0xe0603a, emissive: 0xe0603a, emissiveIntensity: 0.7, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false });
  const uM = new THREE.MeshStandardMaterial({ name: 'underground_volume', color: 0x3ab8d8, emissive: 0x3ab8d8, emissiveIntensity: 0.7, transparent: true, opacity: 0.28, depthTest: false, depthWrite: false });
  const aM = new THREE.MeshBasicMaterial({ name: 'meridian_axis_guide', color: 0x8fe3e8, transparent: true, opacity: 0.85, depthTest: false });
  const vb = (p, n, m, w, h, d, x, y, z, ry = 0) => { const o = box(p, n, m, w, h, d, x, y, z, ry); o.visible = false; o.renderOrder = 10; o.userData.noUV = true; voids.push(o); };
  const HV = grp(manor, 'hidden_volumes_manor');
  vb(HV, 'VOID_seam_shaft', vM, 1.3, 18, 0.7, -11.25, -4.5, 4.25); vb(HV, 'VOID_great_chimney_false_flue', vM, 1.0, 17, 1.0, -13.68, 0.5, -2);
  vb(HV, 'VOID_nw_tower_mezzanine', vM, 4.0, 2.7, 2.2, -30.5, 7.6, -7.4); vb(HV, 'VOID_east_wing_party_wall', vM, 0.5, 7, 10, 10.7, 1, 0);
  vb(HV, 'UNDER_service_coal_cellar', uM, 8, 3, 6, 27, -3.4, -24); vb(HV, 'UNDER_west_cellar_well_shaft', uM, 1.4, 8, 1.4, -22, -10.4, 2);
  const HE = grp(model, 'hidden_volumes_estate');
  const A = toW(7.6, -9.0), dz = obsW.z - A.z, dx = MX - A.x;
  vb(HE, 'UNDER_gallery_tunnel', uM, 2.0, 2.4, Math.hypot(dx, dz), (A.x + MX) / 2, -3.6, (A.z + obsW.z) / 2, Math.atan2(dx, dz));
  vb(HE, 'UNDER_observatory_well', uM, 2.4, 7, 2.4, MX, -7, obsW.z);
  const tl = obsW.z - (cemZ - 4.4); vb(HE, 'UNDER_meridian_tunnel', uM, 2.0, 2.6, tl, MX, -7, (obsW.z + cemZ - 4.4) / 2);
  vb(HE, 'UNDER_mausoleum_crypt', uM, 3, 2.6, 4, MX, -3.2, cemZ - 4.4); vb(HE, 'UNDER_crypt_shaft', uM, 1.2, 4.6, 1.2, MX, -7, cemZ - 5.6);
  vb(HE, 'UNDER_greenhouse_boiler_vault', uM, 5, 2.8, 4, -70, -3, -11.6); vb(HE, 'UNDER_carriage_inspection_pit', uM, 1.0, 1.5, 4.5, 72 - 2.8, -1.5, 0.5);
  vb(HE, 'MERIDIAN_axis_guide', aM, 0.18, 0.05, 440, MX, 0.15, -10);
  return { GT, Gt, cemZ, drive };
}
