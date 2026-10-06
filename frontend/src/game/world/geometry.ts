import * as THREE from 'three'

/**
 * BoxGeometry com UVs em escala de mundo: a textura não estica conforme o tamanho da peça.
 * Cacheado por dimensão/tile.
 */
const cache = new Map<string, THREE.BoxGeometry>()

export function scaledBox(w: number, h: number, d: number, tile = 1): THREE.BoxGeometry {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${tile}`
  const hit = cache.get(key)
  if (hit) return hit
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv as THREE.BufferAttribute
  // Ordem das faces do BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada).
  const dims: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ]
  for (let f = 0; f < 6; f++) {
    const [su, sv] = dims[f]
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v
      uv.setXY(i, (uv.getX(i) * su) / tile, (uv.getY(i) * sv) / tile)
    }
  }
  uv.needsUpdate = true
  cache.set(key, g)
  return g
}

export const deg = THREE.MathUtils.degToRad
