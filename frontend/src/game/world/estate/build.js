// Monta a propriedade inteira uma única vez (geometria procedural determinística, seed fixa).
// Derivado de vm2/main.js do ambiente do Claude Design; a parte de câmera/UI do visualizador ficou de fora.
// A casa agora fica alinhada ao norte verdadeiro (YAW = 0): as coordenadas locais da mansão SÃO as do mundo,
// então o conteúdo (JSON) usa as mesmas coordenadas da planta (docs/WORLD_MAP.md).
import { THREE, M, initMaterials, rooms, colliders, walkables, glassMeshes, trunks, animators, interiorGroups, outdoorMats, decals, lookupRoom } from './core.js';
import { grime as grimeTex, rainStreak } from './tex.js';
import { buildManor } from './manor.js';
import { buildObservatory, buildCarriage, buildGreenhouse, buildCottage } from './outbuildings.js';
import { buildGrounds } from './grounds.js';
import { buildUnderground, UNDER } from './underground.js';

let built = null;

export function buildEstate() {
  if (built) return built;
  initMaterials();
  decals.rain = new THREE.MeshStandardMaterial({ name: 'rain_streak_decal', map: rainStreak(), transparent: true, depthWrite: false, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 });
  const grimeM = new THREE.MeshStandardMaterial({ name: 'foundation_grime', map: grimeTex(), transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });

  const model = new THREE.Group(); model.name = 'vale_manor_estate'; model.userData.frame = true;
  const YAW = 0;
  const toW = (x, z, y = 0) => new THREE.Vector3(x, y, z);
  const manor = buildManor(model, YAW, grimeM);
  const obsW = toW(11.5, -25);
  const { MX } = buildObservatory(model, toW, obsW);
  buildCarriage(model); buildGreenhouse(model); buildCottage(model);
  const { GT, Gt, cemZ } = buildGrounds(model, manor, toW, YAW, MX, obsW);
  buildUnderground(model);

  // ---- UV por projeção em caixa (espaço do "frame" de cada prédio)
  model.updateMatrixWorld(true);
  { const inv = new THREE.Matrix4(), mtx = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3(), n = new THREE.Vector3(), done = new Set();
    model.traverse((o) => {
      if (!o.isMesh || o.userData.proxy || o.userData.keepUV || o.userData.noUV) return; const m = o.material; if (!m || !m.map || m.userData.rugUV || done.has(o.geometry)) return; done.add(o.geometry);
      let f = o.parent; while (f && !f.userData.frame) f = f.parent; f = f || model;
      inv.copy(f.matrixWorld).invert(); mtx.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(mtx);
      const g = o.geometry, P = g.attributes.position, N = g.attributes.normal; if (!N) return; const uv = new Float32Array(P.count * 2);
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(mtx); n.fromBufferAttribute(N, i).applyMatrix3(nm); const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
        if (ay >= ax && ay >= az) { uv[i * 2] = v.x; uv[i * 2 + 1] = -v.z; } else if (ax >= az) { uv[i * 2] = v.z * Math.sign(n.x || 1) * -1; uv[i * 2 + 1] = v.y; } else { uv[i * 2] = v.x * Math.sign(n.z || 1); uv[i * 2 + 1] = v.y; } }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }); }

  // ---- vidro de janela → sala (janelas acesas vistas de fora)
  const roomGlass = new Map();
  { const p = new THREE.Vector3();
    for (const g of glassMeshes) { let f = g.parent; while (f && !f.userData.frame) f = f.parent; if (!f) continue; let r = null;
      for (const d of [-0.7, 0.7]) { p.set(0, 0, d); g.localToWorld(p); f.worldToLocal(p); r = lookupRoom(f, p.x, p.y, p.z); if (r) break; }
      if (!r) continue; if (!roomGlass.has(r.id)) { const m = M.glass_window.clone(); m.name = 'glass_' + r.id; m.emissive = new THREE.Color(r.col); m.emissiveIntensity = 0; roomGlass.set(r.id, m); } g.material = roomGlass.get(r.id); } }

  model.traverse((o) => { if (!o.isMesh) return; const m = o.material; o.receiveShadow = true; o.castShadow = true;
    if (m.transparent || o.userData.flat || o.userData.proxy || /lawn|gravel|path|flag|puddle|ground|drive|track|lane|grass|apron|rug|meadow|leaves|decal|grime|mud|kerb|channel|fern|weeds|ivy/.test(o.name)) o.castShadow = false; });
  model.traverse((o) => { if (o.isMesh && o.userData.proxy) o.visible = false; });

  built = {
    model, colliders, walkables, trunks, rooms, roomGlass, interiorGroups, animators, outdoorMats,
    gate: { x: GT.x, z: GT.z, tx: Gt.x, tz: Gt.z }, cemZ, MX, obsZ: obsW.z, under: UNDER,
  };
  return built;
}

/**
 * Geometria de colisão em coordenadas de mundo, agrupada em blocos espaciais (uma trimesh por bloco).
 * Inclui paredes, pisos, rampas de escada e proxies invisíveis.
 */
export function collisionChunks(estate, cell = 48) {
  const chunks = new Map(), v = new THREE.Vector3(), c = new THREE.Vector3();
  const add = (mesh) => {
    const g = mesh.geometry, P = g.attributes.position; if (!P) return;
    g.computeBoundingSphere(); c.copy(g.boundingSphere.center).applyMatrix4(mesh.matrixWorld);
    const key = Math.floor(c.x / cell) + ',' + Math.floor(c.z / cell);
    let ch = chunks.get(key); if (!ch) chunks.set(key, (ch = { v: [], i: [] }));
    const base = ch.v.length / 3;
    for (let k = 0; k < P.count; k++) { v.fromBufferAttribute(P, k).applyMatrix4(mesh.matrixWorld); ch.v.push(v.x, v.y, v.z); }
    if (g.index) for (let k = 0; k < g.index.count; k++) ch.i.push(base + g.index.getX(k));
    else for (let k = 0; k < P.count; k++) ch.i.push(base + k);
  };
  estate.model.updateMatrixWorld(true);
  for (const m of new Set([...estate.colliders, ...estate.walkables])) add(m);
  return [...chunks.values()].map((ch) => ({ vertices: new Float32Array(ch.v), indices: new Uint32Array(ch.i) }));
}
