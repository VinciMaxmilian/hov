import { content } from '../content'
import type { Vec3 } from '../core/types'

/** Áreas ordenadas da menor para a maior: interiores vencem o exterior quando os volumes se sobrepõem. */
const byVolume = [...content.areas.values()].sort((a, b) => volume(a.bounds) - volume(b.bounds))

function volume(b: { min: Vec3; max: Vec3 }) {
  return (b.max[0] - b.min[0]) * (b.max[1] - b.min[1]) * (b.max[2] - b.min[2])
}

export function areaAt([x, y, z]: Vec3): string | null {
  for (const a of byVolume) {
    const { min, max } = a.bounds
    if (x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1] && z >= min[2] && z <= max[2]) return a.id
  }
  return null
}

/** Área atual + vizinhas (streaming simples por adjacência). */
export function mountedAreas(current: string): string[] {
  const def = content.areas.get(current)
  return def ? [current, ...def.neighbors.filter((n) => content.areas.has(n))] : [content.story.start.area]
}
