import * as THREE from 'three'
import { proceduralTexture } from './textures'

/**
 * Biblioteca de materiais por id (usados nos JSON de áreas). Instâncias compartilhadas:
 * o mesmo id = o mesmo material = menos trocas de estado na GPU.
 */
interface MatDef {
  painter?: string
  color: string
  roughness: number
  metalness?: number
  /** Tamanho em metros de um ladrilho da textura. */
  tile: number
  emissive?: string
  emissiveIntensity?: number
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
}

export const materialDefs: Record<string, MatDef> = {
  wood_floor: { painter: 'planks', color: '#4a3020', roughness: 0.7, tile: 2.4 },
  wood_dark: { painter: 'planks', color: '#2f1f15', roughness: 0.65, tile: 1.6 },
  wood_panel: { painter: 'panel', color: '#2b1d14', roughness: 0.6, tile: 1.1 },
  wood_trim: { color: '#24180f', roughness: 0.55, tile: 1 },
  wood_worn: { painter: 'planks', color: '#5a4534', roughness: 0.85, tile: 1.8 },
  wallpaper_teal: { painter: 'wallpaper', color: '#24413f', roughness: 0.9, tile: 1.4 },
  wallpaper_green: { painter: 'wallpaper', color: '#2c3b2a', roughness: 0.9, tile: 1.4 },
  wallpaper_blue: { painter: 'wallpaper', color: '#26324a', roughness: 0.9, tile: 1.4 },
  plaster: { painter: 'plaster', color: '#8d8a80', roughness: 0.95, tile: 3 },
  plaster_dark: { painter: 'plaster', color: '#4c4a45', roughness: 0.95, tile: 3 },
  stone: { painter: 'stone', color: '#6b7078', roughness: 0.9, tile: 2.2 },
  stone_dark: { painter: 'stone', color: '#474b52', roughness: 0.95, tile: 1.8 },
  stone_old: { painter: 'stone', color: '#4f4a40', roughness: 1, tile: 1.4 },
  facade: { painter: 'stone', color: '#585e66', roughness: 0.9, tile: 2.6 },
  siding: { painter: 'planks', color: '#3b4650', roughness: 0.85, tile: 2.8 },
  roof: { painter: 'rough', color: '#22272e', roughness: 0.9, tile: 3 },
  tiles_checker: { painter: 'tiles', color: '#b8b0a0', roughness: 0.4, tile: 3.2 },
  gravel: { painter: 'rough', color: '#55565a', roughness: 1, tile: 2 },
  grass: { painter: 'rough', color: '#1c2a22', roughness: 1, tile: 4 },
  dirt: { painter: 'rough', color: '#2a2620', roughness: 1, tile: 2 },
  carpet_red: { painter: 'carpet', color: '#4a1a18', roughness: 1, tile: 3 },
  brass: { color: '#b08d57', roughness: 0.35, metalness: 0.9, tile: 1 },
  iron: { color: '#2a2c30', roughness: 0.55, metalness: 0.8, tile: 1 },
  paper: { color: '#d9c9a3', roughness: 0.95, tile: 1 },
  cloth_dark: { color: '#1e2226', roughness: 1, tile: 1 },
  leather: { color: '#3a2216', roughness: 0.6, tile: 1 },
  glass: { color: '#3d5a6c', roughness: 0.05, metalness: 0.2, tile: 1, transparent: true, opacity: 0.22 },
  window_lit: { color: '#ffb45e', roughness: 1, tile: 1, emissive: '#ff9a3d', emissiveIntensity: 1.6 },
  window_dark: { color: '#0f1720', roughness: 0.15, metalness: 0.3, tile: 1, emissive: '#1b2a41', emissiveIntensity: 0.25 },
  black: { color: '#050607', roughness: 1, tile: 1 },
  boards: { painter: 'planks', color: '#4b3b2c', roughness: 0.9, tile: 1.2 },
}

const cache = new Map<string, THREE.MeshStandardMaterial>()

export function material(id: string): THREE.MeshStandardMaterial {
  const hit = cache.get(id)
  if (hit) return hit
  const def = materialDefs[id]
  if (!def) {
    console.warn(`[materials] material desconhecido "${id}", usando plaster`)
    return material('plaster')
  }
  const m = new THREE.MeshStandardMaterial({
    color: def.painter ? '#ffffff' : def.color,
    map: def.painter ? proceduralTexture(def.painter, def.color, hash(id)) : null,
    roughness: def.roughness,
    metalness: def.metalness ?? 0,
    transparent: def.transparent ?? false,
    opacity: def.opacity ?? 1,
    side: def.side ?? THREE.FrontSide,
    emissive: def.emissive ? new THREE.Color(def.emissive) : new THREE.Color(0, 0, 0),
    emissiveIntensity: def.emissiveIntensity ?? 0,
  })
  if (def.transparent) m.depthWrite = false
  m.name = id
  cache.set(id, m)
  return m
}

export const tileOf = (id: string) => materialDefs[id]?.tile ?? 1

function hash(s: string) {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
