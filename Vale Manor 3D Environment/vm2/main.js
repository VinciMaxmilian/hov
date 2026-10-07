import { THREE, PI, M, initMaterials, rooms, colliders, walkables, voids, outdoorMats, glassMeshes, trunks, animators, interiorGroups, IA, decals, lookupRoom } from './core.js';
import { grime as grimeTex, rainStreak } from './tex.js';
import { buildManor } from './manor.js';
import { buildObservatory, buildCarriage, buildGreenhouse, buildCottage } from './outbuildings.js';
import { buildGrounds } from './grounds.js';

const stage = document.querySelector('three-d-stage');
await stage.ready;
const scene = stage._scene, camera = stage._camera, controls = stage._controls, renderer = stage._renderer;
const status = document.getElementById('status');
const say = t => { status.textContent = t; return new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); };

await say('Generating materials…');
initMaterials();
decals.rain = new THREE.MeshStandardMaterial({ name: 'rain_streak_decal', map: rainStreak(), transparent: true, depthWrite: false, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 });
const grimeM = new THREE.MeshStandardMaterial({ name: 'foundation_grime', map: grimeTex(), transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });

const model = new THREE.Group(); model.name = 'vale_manor_estate'; model.userData.frame = true;
const YAW = -0.1, Yax = new THREE.Vector3(0, 1, 0);
const toW = (x, z, y = 0) => new THREE.Vector3(x, y, z).applyAxisAngle(Yax, YAW);
await say('Raising the manor…');
const manor = buildManor(model, YAW, grimeM);
await say('Observatory, garage, greenhouse, cottage…');
const obsW = toW(11.5, -25);
const { MX } = buildObservatory(model, toW, obsW);
const CH = buildCarriage(model), GH = buildGreenhouse(model), K = buildCottage(model);
await say('Grounds and forest…');
const { GT, Gt, cemZ } = buildGrounds(model, manor, toW, YAW, MX, obsW);

// ---------- UV projection (world/frame-space box mapping) ----------
await say('Finishing surfaces…');
model.updateMatrixWorld(true);
{ const inv = new THREE.Matrix4(), mtx = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3(), n = new THREE.Vector3(), done = new Set();
  model.traverse(o => {
    if (!o.isMesh || o.userData.proxy || o.userData.keepUV || o.userData.noUV) return; const m = o.material; if (!m || !m.map || m.userData.rugUV || done.has(o.geometry)) return; done.add(o.geometry);
    let f = o.parent; while (f && !f.userData.frame) f = f.parent; f = f || model;
    inv.copy(f.matrixWorld).invert(); mtx.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(mtx);
    const g = o.geometry, P = g.attributes.position, N = g.attributes.normal; if (!N) return; const uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(mtx); n.fromBufferAttribute(N, i).applyMatrix3(nm); const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
      if (ay >= ax && ay >= az) { uv[i * 2] = v.x; uv[i * 2 + 1] = -v.z; } else if (ax >= az) { uv[i * 2] = v.z * Math.sign(n.x || 1) * -1; uv[i * 2 + 1] = v.y; } else { uv[i * 2] = v.x * Math.sign(n.z || 1); uv[i * 2 + 1] = v.y; } }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }); }
// ---------- glass -> room (for warm windows) ----------
const roomGlass = new Map();
for (const r of rooms) { r.world = r.frame.localToWorld(r.lp.clone()); r.on0 = r.on; }
{ const p = new THREE.Vector3();
  for (const g of glassMeshes) { let f = g.parent; while (f && !f.userData.frame) f = f.parent; if (!f) continue; let r = null;
    for (const d of [-0.7, 0.7]) { p.set(0, 0, d); g.localToWorld(p); f.worldToLocal(p); r = lookupRoom(f, p.x, p.y, p.z); if (r) break; }
    if (!r) continue; if (!roomGlass.has(r)) { const m = M.glass_window.clone(); m.name = 'glass_' + r.id; m.emissive = new THREE.Color(r.col); m.emissiveIntensity = 0; roomGlass.set(r, m); } g.material = roomGlass.get(r); } }

stage.setObject(model);
stage._ground.visible = false;
model.traverse(o => { if (!o.isMesh) return; const m = o.material; if (m.transparent || o.userData.flat || o.userData.proxy || /lawn|gravel|path|flag|puddle|ground|drive|track|lane|grass|apron|rug|meadow|leaves|decal|grime|mud|kerb|channel/.test(o.name)) o.castShadow = false; if (o.userData.noExport) o.castShadow = false; });

// ---------- lighting ----------
renderer.toneMapping = THREE.ACESFilmicToneMapping;
scene.children.filter(o => o.isLight).forEach(l => scene.remove(l));
const hemi = new THREE.HemisphereLight(0x9aaebb, 0x1e2722, 1.4); scene.add(hemi);
const key = new THREE.DirectionalLight(0xc7d4de, 1.0); key.position.set(-70, 140, 60); key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
Object.assign(key.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 1, far: 420 }); key.shadow.camera.updateProjectionMatrix(); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.05; scene.add(key, key.target);
const bolt = new THREE.DirectionalLight(0xd8e0ff, 0); bolt.position.set(60, 160, -80); bolt.castShadow = true; bolt.shadow.mapSize.set(2048, 2048); Object.assign(bolt.shadow.camera, { left: -130, right: 130, top: 130, bottom: -130, near: 1, far: 420 }); bolt.shadow.camera.updateProjectionMatrix(); bolt.shadow.normalBias = 0.06; scene.add(bolt, bolt.target);
{ const es = new THREE.Scene(); const g = new THREE.SphereGeometry(10, 32, 16); const c = [], c1 = new THREE.Color(0x8ea2ae), c2 = new THREE.Color(0x1a2224);
  for (let i = 0; i < g.attributes.position.count; i++) { const y = g.attributes.position.getY(i) / 10; const k = c2.clone().lerp(c1, THREE.MathUtils.smoothstep(y, -0.2, 0.6)); c.push(k.r, k.g, k.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(es, 0.04).texture; }
scene.fog = new THREE.FogExp2(0x66747d, 0.0036); scene.background = new THREE.Color(0x66747d);
const POOL = 16, pool = []; for (let i = 0; i < POOL; i++) { const l = new THREE.PointLight(0xffb46a, 0, 12, 2); scene.add(l); pool.push(l); }
const torch = new THREE.SpotLight(0xfff0d8, 0, 28, 0.45, 0.5, 1.6); scene.add(torch, torch.target);
const MODES = {
  day: { fog: 0x66747d, dens: 0.0036, hs: 0x9aaebb, hg: 0x1e2722, hi: 1.4, kc: 0xc7d4de, ki: 1.0, env: 0.55, exp: 1.0, ia: 0.28, glass: 0.35, lm: 3.0 },
  night: { fog: 0x0c131b, dens: 0.0062, hs: 0x22324a, hg: 0x07090a, hi: 0.95, kc: 0x7d93b5, ki: 0.6, env: 0.2, exp: 1.6, ia: 0.07, glass: 2.2, lm: 2.2 },
};
let mode = 'day', fogMul = 1, wet = 1, wetT = 1, lightMul = 3;
function applyMode() { const s = MODES[mode]; scene.fog.color.set(s.fog); scene.background.set(s.fog); scene.fog.density = s.dens * fogMul; hemi.color.set(s.hs); hemi.groundColor.set(s.hg); hemi.intensity = s.hi; key.color.set(s.kc); key.intensity = s.ki;
  scene.environmentIntensity = s.env; renderer.toneMappingExposure = s.exp; IA.value = s.ia; lightMul = s.lm; stage.style.setProperty('--stage-bg', '#' + new THREE.Color(s.fog).getHexString()); rainMat.color.set(mode === 'night' ? 0x4c5d70 : 0xa8b9c5); }
// rain
const RN = 7000, rpos = new Float32Array(RN * 6), roff = new Float32Array(RN * 3); for (let i = 0; i < RN; i++) { roff[i * 3] = (Math.random() - 0.5) * 110; roff[i * 3 + 1] = Math.random() * 45; roff[i * 3 + 2] = (Math.random() - 0.5) * 110; }
const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
const rainMat = new THREE.LineBasicMaterial({ color: 0xa8b9c5, transparent: true, opacity: 0.32 }); const rain = new THREE.LineSegments(rg, rainMat); rain.frustumCulled = false; scene.add(rain);
applyMode();

// ---------- views ----------
camera.near = 0.15; camera.far = 2500; camera.updateProjectionMatrix(); controls.maxPolarAngle = PI * 0.92; controls.minDistance = 0.3; controls.maxDistance = 650;
const V = (x, y, z) => new THREE.Vector3(x, y, z), tw = (x, z, y) => toW(x, z, y), L = (g, x, y, z) => g.localToWorld(V(x, y, z));
const TX = 29, TZ = 6;
const views = {
  'Overview': [V(62, 72, 92), V(2, 2, 2)], 'Approach': [drivePt(0.13), tw(1.5, 4, 9)], 'Motor court': [tw(-8, 54, 3.2), tw(1.5, 20, 6)], 'Rear terrace': [tw(-8, -52, 6), tw(0, -10, 9)],
  'Entrance hall': [tw(1.5, 9.4, 2.65), tw(1.5, -1.5, 5.0)], 'Library': [tw(-4.0, -0.6, 3.0), tw(-8.5, -6.5, 3.6)], 'Dining room': [tw(19.0, 4.6, 2.7), tw(12, -2, 2.0)], 'Kitchen': [tw(19.3, -6.8, 2.7), tw(26, -11, 1.8)],
  'Master bedroom': [tw(-3.7, 1.8, 7.3), tw(-8, 5, 6.4)], 'Turret room': [tw(TX + 1.9, TZ - 1.2, 14.3), tw(TX + 1.2, TZ + 1.9, 13.7)], 'Cellar': [tw(6.6, -7.8, -0.9), tw(0, -3.5, -1.7)], 'Attic': [tw(9.2, -6, 16.4), tw(-6, 2, 16)],
  'Observatory': [V(MX - 16, 9, obsW.z - 18), V(MX, 6, obsW.z)], 'Dome interior': [V(MX + 1.8, 6.7, obsW.z + 1.6), V(MX, 6.4, obsW.z - 1)], 'East turret': [tw(52, 36, 16), tw(TX + 2.1, TZ + 2.1, 14.2)],
  'Greenhouse': [V(-60, 6, 18), V(-76, 2, -4)], 'Greenhouse inside': [V(-82.5, 1.7, -6.2), V(-68, 1.3, -6)], 'Carriage house': [V(63, 3.6, 26), V(72, 2.5, 6)], 'Garage inside': [L(CH, -1.2, 1.7, 3.8), L(CH, -7, 1.2, -2.5)],
  "Gardener's cottage": [L(K, -2.2, 4, 9), L(K, 0, 1.5, 0)], 'Cottage inside': [L(K, 0.7, 1.7, 1.3), L(K, -2.6, 1.0, -0.6)], 'Cemetery': [V(MX + 8, 3.6, cemZ + 10), V(MX, 1.2, cemZ - 2)], 'Gate': [GT.clone().addScaledVector(Gt, 14).add(V(0, 3, 0)), GT.clone().add(V(0, 2.4, 0))],
};
function drivePt(t) { return V(14 + 0, 2.2, 75); }
let tween = null;
function go(name, instant) { const [p, t] = views[name]; if (instant) { camera.position.copy(p); controls.target.copy(t); controls.update(); return; } tween = { p0: camera.position.clone(), t0: controls.target.clone(), p, t, s: performance.now() }; }
go('Overview', true); window.__go = go;
const gotoEl = document.getElementById('goto'); for (const n of Object.keys(views)) { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { if (walking) exitWalk(); go(n); }; gotoEl.appendChild(b); }
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); applyMode(); });
document.getElementById('rain').onchange = e => { rain.visible = e.target.checked; wetT = e.target.checked ? 1 : 0.15; };
document.getElementById('fog').oninput = e => { fogMul = +e.target.value; applyMode(); };
document.getElementById('voids').onchange = e => voids.forEach(v => v.visible = e.target.checked);
const stormEl = document.getElementById('storm');
// rooms panel
const roomList = document.getElementById('rooms'); const byB = {};
for (const r of rooms) { (byB[r.building || 'Other'] ||= []).push(r); }
for (const [b, rs] of Object.entries(byB)) { const h = document.createElement('div'); h.className = 'rb'; h.textContent = b; roomList.appendChild(h); for (const r of rs) { const l = document.createElement('label'); l.className = 'row'; const c = document.createElement('input'); c.type = 'checkbox'; c.checked = r.on; c.onchange = () => r.on = c.checked; r.cb = c; l.append(c, ' ' + r.label + (r.floor ? ' · ' + r.floor : '')); roomList.appendChild(l); } }
const setAll = f => rooms.forEach(r => { r.on = f(r); if (r.cb) r.cb.checked = r.on; });
document.getElementById('lp-lived').onclick = () => setAll(r => r.on0); document.getElementById('lp-all').onclick = () => setAll(() => true); document.getElementById('lp-off').onclick = () => setAll(() => false);
document.getElementById('lp-canon').onclick = () => { setAll(r => r.id === 'turret_top'); };

// ---------- walk mode with collision ----------
let walking = false, yaw = 0, pitch = 0, drag = null, vy = 0; const keys = {}, feet = new THREE.Vector3(), ray = new THREE.Raycaster(), DOWN = V(0, -1, 0);
const walkBtn = document.getElementById('walk'), hud = document.getElementById('hud');
function floorBelow(x, y, z) { ray.set(V(x, y, z), DOWN); ray.far = 60; const h = ray.intersectObjects(walkables, false); return h.length ? h[0].point.y : null; }
function enterWalk() { walking = true; tween = null; walkBtn.classList.add('on'); walkBtn.textContent = 'Exit walk (Esc)'; hud.style.display = 'block';
  const d = new THREE.Vector3().subVectors(controls.target, camera.position); yaw = Math.atan2(-d.x, -d.z); pitch = 0;
  const fy = floorBelow(camera.position.x, camera.position.y, camera.position.z); feet.set(camera.position.x, fy ?? 0, camera.position.z); if (camera.position.y - (fy ?? 0) > 6) { const f2 = floorBelow(controls.target.x, controls.target.y + 0.5, controls.target.z); feet.set(controls.target.x, f2 ?? 0, controls.target.z); }
  vy = 0; controls.enabled = false; camera.near = 0.08; camera.updateProjectionMatrix(); wlast = performance.now(); renderer.setAnimationLoop(walkLoop); }
function exitWalk() { walking = false; walkBtn.classList.remove('on'); walkBtn.textContent = 'Walk at eye level · 1.7 m'; hud.style.display = 'none'; torch.intensity = 0;
  const f = V(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)); controls.target.copy(camera.position).addScaledVector(f, 3); controls.enabled = true; camera.near = 0.15; camera.updateProjectionMatrix(); renderer.setAnimationLoop(stage._loop); }
function blockedMove(dx, dz) {
  const len = Math.hypot(dx, dz); if (len < 1e-5) return false; const dir = V(dx / len, 0, dz / len);
  for (const h of [0.35, 0.9, 1.5]) { ray.set(V(feet.x, feet.y + h, feet.z), dir); ray.far = len + 0.28; if (ray.intersectObjects(colliders, false).length) return true; }
  const nx = feet.x + dx, nz = feet.z + dz; for (const [tx, tz, r] of trunks) if (Math.abs(tx - nx) < 2 && Math.abs(tz - nz) < 2 && (tx - nx) ** 2 + (tz - nz) ** 2 < (r + 0.3) ** 2) return true;
  return false;
}
let wdt = 0, wlast = 0;
function walkLoop() {
  const now = performance.now(); const dt = Math.min((now - wlast) / 1000, 0.05); wlast = now; tick(dt);
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 6.5 : 2.6) * dt, fw = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), st = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const mx = (-Math.sin(yaw) * fw + Math.cos(yaw) * st) * sp, mz = (-Math.cos(yaw) * fw - Math.sin(yaw) * st) * sp;
  if (keys.KeyG) { feet.x += mx * 2; feet.z += mz * 2; } else { if (!blockedMove(mx, 0)) feet.x += mx; if (!blockedMove(0, mz)) feet.z += mz; }
  const fy = floorBelow(feet.x, feet.y + 0.55, feet.z);
  if (fy !== null && fy >= feet.y - 0.08) { feet.y = fy; vy = 0; } else { vy -= 9.8 * dt; feet.y += vy * dt; if (fy !== null && feet.y < fy) { feet.y = fy; vy = 0; } if (fy === null && feet.y < -20) feet.y = 0; }
  camera.position.set(feet.x, feet.y + 1.62, feet.z); camera.rotation.set(pitch, yaw, 0, 'YXZ');
  if (torch.intensity > 0) { torch.position.copy(camera.position); torch.target.position.copy(camera.position).add(V(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))); torch.target.updateMatrixWorld(); }
  wdt += dt; if (wdt > 0.25) { wdt = 0; const r = currentRoom(); hud.firstChild.textContent = r ? r.label + (r.floor ? ' · ' + r.floor : '') + (r.building ? ' — ' + r.building : '') : 'Grounds'; }
  renderer.render(scene, camera);
}
function currentRoom() { const p = V(); for (const r of rooms) { p.copy(feet).add(V(0, 0.5, 0)); r.frame.worldToLocal(p); if (lookupRoom(r.frame, p.x, p.y, p.z) === r) return r; } return null; }
walkBtn.onclick = () => walking ? exitWalk() : enterWalk();
addEventListener('keydown', e => { if (!walking) return; keys[e.code] = true; if (e.code === 'Escape') exitWalk(); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (e.code === 'KeyF') torch.intensity = torch.intensity ? 0 : 40;
  if (e.code === 'KeyL') { const r = currentRoom(); if (r) { r.on = !r.on; if (r.cb) r.cb.checked = r.on; } } });
addEventListener('keyup', e => keys[e.code] = false);
stage.addEventListener('pointerdown', e => { if (walking) drag = [e.clientX, e.clientY]; });
addEventListener('pointerup', () => drag = null);
addEventListener('pointermove', e => { if (!walking || !drag) return; yaw -= (e.clientX - drag[0]) * 0.004; pitch = Math.max(-1.3, Math.min(1.3, pitch - (e.clientY - drag[1]) * 0.004)); drag = [e.clientX, e.clientY]; });

// ---------- per-frame systems ----------
let last = performance.now(), T0 = 0, poolT = 0, flash = null, nextBolt = 6;
const bg0 = new THREE.Color();
function tick(dt) {
  T0 += dt; const eye = walking ? camera.position : controls.target;
  for (const a of animators) a(dt, T0);
  // wetness
  wet += (wetT - wet) * Math.min(1, dt * 0.3);
  for (const m of outdoorMats) { const b = m.userData.base, k = wet * m.userData.wet; m.roughness = b.r * (1 - 0.6 * k); m.color.copy(b.c).multiplyScalar(1 - 0.22 * k); }
  M.puddle.opacity = 0.15 + 0.75 * wet;
  // room light pool
  poolT -= dt; if (poolT <= 0) { poolT = 0.2;
    const lit = rooms.filter(r => r.on).map(r => [r, r.world.distanceToSquared(eye)]).sort((a, b) => a[1] - b[1]);
    pool.forEach((l, i) => { const e = lit[i]; if (!e) { l.intensity = 0; l.userData.r = null; return; } const r = e[0]; l.userData.r = r; l.position.copy(r.world); l.color.set(r.col); l.distance = r.dist; });
    for (const [r, m] of roomGlass) m.emissiveIntensity = r.on ? MODES[mode].glass * (r.id === 'turret_top' ? 1.6 : 1) : 0;
    for (const ig of interiorGroups) { const c = ig.keep ? V(...ig.c) : manor.localToWorld(V(...ig.c)); ig.g.visible = c.distanceTo(camera.position) < 140; }
  }
  for (const l of pool) { const r = l.userData.r; if (!r) continue; l.intensity = r.i * lightMul * (r.flicker ? 0.82 + 0.18 * Math.sin(T0 * 13 + r.i) * Math.sin(T0 * 7.3) : 1); }
  // lightning
  if (stormEl.checked && rain.visible) { nextBolt -= dt; if (nextBolt <= 0 && !flash) { flash = { t: 0 }; nextBolt = 7 + Math.random() * 14; bolt.position.set((Math.random() - 0.5) * 300, 160, (Math.random() - 0.5) * 300); } }
  if (flash) { flash.t += dt; const t = flash.t, k = t < 0.06 ? 1 : t < 0.14 ? 0.15 : t < 0.22 ? 0.85 : t < 0.5 ? Math.max(0, 0.85 - (t - 0.22) * 3) : 0; bolt.intensity = k * 7; bg0.set(MODES[mode].fog); scene.background.copy(bg0).lerp(new THREE.Color(0xc0c8d8), k * 0.6); scene.fog.color.copy(scene.background); if (t > 0.6) { flash = null; bolt.intensity = 0; applyMode(); } }
  if (tween) { const k = Math.min((performance.now() - tween.s) / 1400, 1), e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; camera.position.lerpVectors(tween.p0, tween.p, e); controls.target.lerpVectors(tween.t0, tween.t, e); if (k >= 1) tween = null; }
  if (rain.visible) { const c = walking ? camera.position : controls.target; rainMat.opacity = walking ? 0.3 : Math.min(0.32, 0.32 * 45 / Math.max(1, camera.position.distanceTo(controls.target)));
    for (let i = 0; i < RN; i++) { let y = roff[i * 3 + 1] - 11 * dt; if (y < 0) y += 45; roff[i * 3 + 1] = y; const x = c.x + roff[i * 3], z = c.z + roff[i * 3 + 2], o = i * 6; rpos[o] = x; rpos[o + 1] = c.y - 15 + y; rpos[o + 2] = z; rpos[o + 3] = x + 0.06; rpos[o + 4] = c.y - 15 + y + 0.6; rpos[o + 5] = z + 0.02; }
    rg.attributes.position.needsUpdate = true; }
}
(function loop(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (!walking) tick(dt); requestAnimationFrame(loop); })(performance.now());
status.textContent = ''; document.getElementById('ui').classList.add('ready');
window.__vm = { rooms, colliders, walkables, model, manor, scene, camera };
