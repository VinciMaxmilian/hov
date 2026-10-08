// Subterrâneo da propriedade (Atos VI–VII): não existe no ambiente original do Claude Design, que só marcava
// volumes ocultos. Profundidade física = profundidade histórica: poço da adega oeste (1874) → túnel de Elias (1849)
// → antecâmara ("Room 14" da planta de 1936) → Câmara do Meridiano (anterior aos Vale).
import { THREE, PI, M, mesh, box, grp, bx, cg, sg, mm, col, walk, slab, wall, ringWall, stairRun, room, proxy } from './core.js';

/** Coordenadas canônicas (mundo). Ver docs/WORLD_MAP.md. */
export const UNDER = {
  floor: -10.4,
  well: { x: -22, z: 2 },
  chamber: { x: -22, z: -20.0, r: 5.0, h: 5.2 },
};

const STONE = () => M.cellar_stone;

/**
 * Caixa fechada (piso, teto, paredes de 0,5 m) com aberturas por lado: open = { n, s, e, w: [{ at, w, h }] }.
 * `attachedSouth`: o lado sul encosta na parede norte da caixa anterior (que já tem o vão) — sem parede e
 * sem sobreposição de piso (evita z-fighting).
 */
function chamberBox(p, name, x0, x1, z0, z1, y0, h, open = {}, attachedSouth = false, ceilingHoles = []) {
  room(p, name, name, [[x0, x1, z0, z1]], y0, y0 + h, { building: 'Underground', floor: 'Below', on: false, slab: false });
  const zs = attachedSouth ? z1 : z1 + 0.5;
  slab(p, name + '_floor', x0 - 0.5, x1 + 0.5, z0 - 0.5, zs, y0, 0.4, M.flags_interior, null);
  slab(p, name + '_ceiling', x0 - 0.5, x1 + 0.5, z0 - 0.5, zs, y0 + h + 0.3, 0.3, STONE(), STONE(), ceilingHoles);
  const W = { t: 0.5, y0, h, ext: STONE(), int: STONE(), auto: false };
  const ops = (list = []) => list.map((o) => ({ at: o.at, y: y0, w: o.w, h: o.h, kind: 'hole' }));
  const zw = attachedSouth ? z1 : z1 + 0.25;
  wall(p, { ...W, name: name + '_n', a: [x1 + 0.25, z0 - 0.25], b: [x0 - 0.25, z0 - 0.25], open: ops(open.n) });
  if (!attachedSouth) wall(p, { ...W, name: name + '_s', a: [x0 - 0.25, z1 + 0.25], b: [x1 + 0.25, z1 + 0.25], open: ops(open.s) });
  wall(p, { ...W, name: name + '_w', a: [x0 - 0.25, z0 - 0.25], b: [x0 - 0.25, zw], open: ops(open.w) });
  wall(p, { ...W, name: name + '_e', a: [x1 + 0.25, zw], b: [x1 + 0.25, z0 - 0.25], open: ops(open.e) });
}

export function buildUnderground(model) {
  const U = grp(model, 'underground');
  U.userData.frame = true;
  const F = UNDER.floor;
  const { x: wx, z: wz } = UNDER.well;

  // ---- fundo do poço
  chamberBox(U, 'well_bottom', wx - 1.2, wx + 1.2, wz - 1.2, wz + 1.2, F, 3.0, { n: [{ at: wx, w: 1.4, h: 2.3 }] }, false, [[wx - 0.75, wx + 0.75, wz - 0.75, wz + 0.75]]);
  { // poço visto de baixo: cilindro escuro subindo até a adega (y -2.4)
    const sh = mesh(U, 'well_shaft', new THREE.CylinderGeometry(0.75, 0.75, 5.0, 24, 1, true), M.cellar_stone, wx, F + 3.0 + 2.5, wz);
    sh.material = sh.material.clone(); sh.material.side = THREE.BackSide;
    const rungs = []; for (let y = F + 3.1; y < F + 7.9; y += 0.32) rungs.push(bx(0.36, 0.035, 0.035, wx, y, wz - 0.72));
    mm(U, 'well_rungs', rungs, M.iron_int);
    const lad = [bx(0.05, 3.3, 0.05, wx - 0.22, F + 1.6, wz - 0.55, 0, 0.12), bx(0.05, 3.3, 0.05, wx + 0.22, F + 1.6, wz - 0.55, 0, 0.12)];
    for (let y = F + 0.3; y < F + 3.1; y += 0.3) lad.push(bx(0.46, 0.04, 0.04, wx, y, wz - 0.55 - (y - F - 1.6) * 0.12));
    mm(U, 'well_ladder', lad, M.raw_planks);
    mm(U, 'rope_and_bucket', [cg(0.012, 0.012, 6.5, 4, wx + 0.3, F + 4.2, wz + 0.2), cg(0.16, 0.13, 0.28, 12, wx + 0.3, F + 0.14, wz + 0.2)], M.wood_furniture);
  }
  // ---- túnel de Elias (1849): escorado com madeira, rumo norte
  const t0 = wz - 1.7, t1 = -9.5;
  chamberBox(U, 'elias_tunnel', wx - 0.7, wx + 0.7, t1, t0, F, 2.3, { n: [{ at: wx, w: 1.4, h: 2.3 }] }, true);
  { const T = []; for (let z = t0 - 0.6; z > t1 + 0.3; z -= 1.5) T.push(bx(0.16, 2.25, 0.16, wx - 0.62, F + 1.125, z), bx(0.16, 2.25, 0.16, wx + 0.62, F + 1.125, z), bx(1.5, 0.16, 0.18, wx, F + 2.2, z));
    mm(U, 'tunnel_props_1849', T, M.beam_timber); }
  // ---- antecâmara ("Room 14")
  const a0 = t1 - 0.5, a1 = a0 - 4.0;
  chamberBox(U, 'antechamber', wx - 2.0, wx + 2.0, a1, a0, F, 3.0, { n: [{ at: wx, w: 1.4, h: 2.4 }] }, true);
  { // oito nichos de lamparina em volta da porta norte
    const N = [];
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1, k = i % 4, z = a1 + 0.6 + k * 0.95, x = wx + side * 1.97;
      N.push(bx(0.08, 0.5, 0.42, x, F + 1.35, z), bx(0.3, 0.06, 0.42, x - side * 0.12, F + 1.1, z));
    }
    mm(U, 'lamp_niches', N, M.limestone_trim);
    mm(U, 'antechamber_lintel', [bx(1.8, 0.35, 0.6, wx, F + 2.6, a1 - 0.25)], M.basalt_dressed);
  }
  // a parede sul da câmara encosta na parede norte da antecâmara (z = a1 - 0,5)
  const c = UNDER.chamber;

  // ---- Câmara do Meridiano
  room(U, 'meridian_chamber', 'Meridian Chamber', [[c.x - c.r, c.x + c.r, c.z - c.r, c.z + c.r]], F, F + c.h, { building: 'Underground', floor: 'Below', on: false, slab: false });
  walk(mesh(U, 'chamber_floor', new THREE.CylinderGeometry(c.r + 0.5, c.r + 0.5, 0.4, 48), M.flags_interior, c.x, F - 0.2, c.z));
  // aberturas: sul (antecâmara) e leste (escada de 1936)
  ringWall(U, { name: 'chamber_wall', cx: c.x, cz: c.z, r: c.r + 0.25, seg: 48, t: 0.5, y0: F, h: c.h, ext: STONE(), int: STONE(), open: [{ ang: 0, y: F, w: 1.5, h: 2.5, kind: 'hole' }, { ang: PI / 2, y: F, w: 1.5, h: 2.6, kind: 'hole' }], noFit: true });
  { const d = mesh(U, 'chamber_dome', new THREE.SphereGeometry(c.r + 0.3, 48, 16, 0, PI * 2, 0, PI / 2), M.cellar_stone, c.x, F + c.h - 0.4, c.z);
    d.material = d.material.clone(); d.material.side = THREE.BackSide; d.scale.y = 0.45;
    col(mesh(U, 'chamber_roof', new THREE.CylinderGeometry(c.r + 0.8, c.r + 0.8, 0.4, 48), M.cellar_stone, c.x, F + c.h + 2.0, c.z)); }
  // gravura no piso: círculo graduado, a linha (meridiano) e oito pontos
  { const ring = new THREE.RingGeometry(2.95, 3.1, 96); ring.rotateX(-PI / 2); mesh(U, 'engraved_circle', ring, M.brass, c.x, F + 0.012, c.z);
    const L = [bx(0.06, 0.006, 2 * c.r - 0.4, c.x, F + 0.01, c.z)];
    for (let i = 0; i < 64; i++) { const a = i / 64 * PI * 2, len = i % 8 ? 0.12 : 0.3; L.push(bx(0.025, 0.006, len, c.x + Math.sin(a) * (3.1 + len / 2), F + 0.01, c.z - Math.cos(a) * (3.1 + len / 2), a)); }
    mm(U, 'engraved_graduation', L, M.brass);
    const D = []; for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; D.push(cg(0.14, 0.14, 0.02, 20, c.x + Math.sin(a) * 2.45, F + 0.012, c.z - Math.cos(a) * 2.45)); }
    mm(U, 'eight_points', D, M.brass); }
  // gnômon de bronze no centro, alinhado ao meridiano
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(1.3, 0); sh.lineTo(0, 1.25); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }); g.translate(-0.65, 0, -0.02); g.rotateY(PI / 2);
    col(mesh(U, 'gnomon', g, M.telescope_brass, c.x, F + 0.35, c.z));
    col(mm(U, 'gnomon_plinth', [cg(0.55, 0.65, 0.35, 8, c.x, F + 0.175, c.z)], M.basalt_dressed)); }
  // oito púlpitos (sete com livro; o da Testemunha vazio — o livro dela fica à parte, num nicho ao norte)
  { const P2 = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, x = c.x + Math.sin(a) * 3.9, z = c.z - Math.cos(a) * 3.9;
      if (i === 0) continue; // norte: a passagem do nicho
      P2.push(cg(0.12, 0.18, 1.0, 8, x, F + 0.5, z), bx(0.6, 0.06, 0.45, x, F + 1.05, z, -a)); }
    col(mm(U, 'lecterns', P2, M.basalt_dressed)); }
  // nicho norte (no meridiano) para o oitavo livro
  { const n = c.z - c.r - 0.05; mm(U, 'witness_niche', [bx(1.1, 0.08, 0.6, c.x, F + 1.0, n + 0.15), bx(1.3, 1.6, 0.12, c.x, F + 1.0, n - 0.12), bx(0.1, 1.6, 0.55, c.x - 0.6, F + 1.0, n + 0.12), bx(0.1, 1.6, 0.55, c.x + 0.6, F + 1.0, n + 0.12), bx(1.3, 0.12, 0.6, c.x, F + 1.86, n + 0.12)], M.limestone_trim);
    col(mm(U, 'witness_plinth', [bx(0.8, 1.0, 0.45, c.x, F + 0.5, n + 0.18)], M.basalt_dressed)); }
  // ---- a escada de 1936: sobe a leste até uma porta que não abre deste lado
  { const x0 = c.x + c.r + 0.1, top = F + 4.0, z = c.z;
    const { run } = stairRun(U, { name: 'stair_1936', x: x0, z, dir: '+x', w: 1.3, y0: F, y1: top, tread: 0.27, mat: M.cellar_stone, rails: [] });
    const W = { t: 0.4, y0: F, h: 7.0, ext: STONE(), int: STONE(), auto: false };
    wall(U, { ...W, name: 'stair36_n', a: [x0 + run + 1.6, z - 0.85], b: [x0 - 0.3, z - 0.85] });
    wall(U, { ...W, name: 'stair36_s', a: [x0 - 0.3, z + 0.85], b: [x0 + run + 1.6, z + 0.85] });
    slab(U, 'stair36_landing', x0 + run, x0 + run + 1.4, z - 0.65, z + 0.65, top, 0.4, M.cellar_stone, null);
    col(box(U, 'door_1936', M.basalt_dressed, 0.3, 2.4, 1.3, x0 + run + 1.35, top, z));
    mm(U, 'door_1936_bar', [bx(0.08, 0.1, 1.2, x0 + run + 1.18, top + 1.2, z), cg(0.06, 0.06, 0.12, 8, x0 + run + 1.18, top + 1.2, z - 0.5, 0, PI / 2)], M.iron_int);
    slab(U, 'stair36_ceiling', x0 + 0.4, x0 + run + 1.6, z - 0.65, z + 0.65, top + 2.9, 0.3, STONE(), STONE());
    col(box(U, 'stair36_lintel', M.cellar_stone, 0.8, 4.4, 1.7, x0 + 0.1, F + 2.6, z)); }
  return U;
}

/** Mausoléu dos Vale com interior (no original era um bloco maciço). Coordenadas locais do cemitério. */
export function buildMausoleum(Y) {
  const z = -4.4;
  walk(col(box(Y, 'mausoleum_plinth', M.basalt_dressed, 3.6, 0.4, 4.4, 0, 0, z)));
  walk(col(box(Y, 'mausoleum_step', M.basalt_dressed, 1.8, 0.2, 0.4, 0, 0, -2.0)));
  const W = { t: 0.3, y0: 0.4, h: 2.6, ext: M.gravestone, int: M.cellar_stone, auto: false };
  wall(Y, { ...W, name: 'mausoleum_front', a: [-1.45, -2.55], b: [1.45, -2.55], open: [{ at: 0, y: 0.4, w: 1.1, h: 2.0, kind: 'door', leaf: false, trim: M.gravestone }] });
  wall(Y, { ...W, name: 'mausoleum_back', a: [1.45, -6.25], b: [-1.45, -6.25] });
  wall(Y, { ...W, name: 'mausoleum_w', a: [-1.45, -6.4], b: [-1.45, -2.4] });
  wall(Y, { ...W, name: 'mausoleum_e', a: [1.45, -2.4], b: [1.45, -6.4] });
  slab(Y, 'mausoleum_ceiling', -1.3, 1.3, -6.1, -2.7, 3.2, 0.2, M.cellar_stone, M.cellar_stone);
  // nichos (lóculos) nas paredes laterais e a grade sobre a escada da cripta
  const L = []; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) L.push(bx(0.05, 0.55, 0.95, s * 1.27, 0.75 + j * 0.85, -3.1 - k * 1.05));
  mm(Y, 'loculi_plates', L, M.limestone_trim);
  const G = []; for (let i = -4; i <= 4; i++) G.push(bx(0.03, 0.03, 1.1, i * 0.1, 0.43, -5.5)); G.push(bx(0.9, 0.04, 0.04, 0, 0.43, -5.0), bx(0.9, 0.04, 0.04, 0, 0.43, -6.0));
  mm(Y, 'crypt_grate', G, M.iron_int);
  mesh(Y, 'crypt_dark', new THREE.PlaneGeometry(0.9, 1.0).rotateX(-PI / 2), M.soot, 0, 0.415, -5.5);
}
