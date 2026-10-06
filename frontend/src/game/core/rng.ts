/** PRNG determinístico (mulberry32). Mesma seed → mesmo mundo, em qualquer save. */
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash FNV-1a de string → seed numérica. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function seedFrom(seed: number | string | undefined, fallback = 1): number {
  if (typeof seed === 'number') return seed
  if (typeof seed === 'string') return hashString(seed)
  return fallback
}

export const range = (rng: Rng, min: number, max: number) => min + rng() * (max - min)
export const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length) % items.length]
