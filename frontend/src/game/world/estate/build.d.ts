import type * as THREE from 'three'

/** Sala da propriedade procedural (para luz de janela e rótulos). */
export interface EstateRoom {
  id: string
  label: string
  building: string
  floor: string
  boxes: [number, number, number, number][]
  y0: number
  y1: number
  col: number
  frame: THREE.Object3D
}

export interface Estate {
  model: THREE.Group
  colliders: THREE.Mesh[]
  walkables: THREE.Mesh[]
  /** [x, z, raio] dos troncos de árvore. */
  trunks: [number, number, number][]
  rooms: EstateRoom[]
  /** id da sala → material do vidro das janelas (emissivo quando a sala está acesa). */
  roomGlass: Map<string, THREE.MeshStandardMaterial>
  /** r: raio de visibilidade em metros (padrão 140 em EstateView); maior para blocos de floresta. */
  interiorGroups: { g: THREE.Object3D; c: [number, number, number]; keep?: boolean; r?: number }[]
  animators: ((dt: number, t: number) => void)[]
  outdoorMats: THREE.MeshStandardMaterial[]
  gate: { x: number; z: number; tx: number; tz: number }
  cemZ: number
  MX: number
  obsZ: number
  under: { floor: number; well: { x: number; z: number }; chamber: { x: number; z: number; r: number; h: number } }
}

export function buildEstate(): Estate
export function collisionChunks(estate: Estate, cell?: number): { vertices: Float32Array; indices: Uint32Array }[]
