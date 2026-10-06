import type { AreaObject } from '../../content/schemas'

/** Props recebem o objeto da área (params livres) + seed determinística. */
export interface PropProps {
  obj: AreaObject
  seed: number
}

type Params = Record<string, unknown>

export const num = (p: Params, k: string, d: number): number => (typeof p[k] === 'number' ? (p[k] as number) : d)
export const str = (p: Params, k: string, d: string): string => (typeof p[k] === 'string' ? (p[k] as string) : d)
export const bool = (p: Params, k: string, d: boolean): boolean => (typeof p[k] === 'boolean' ? (p[k] as boolean) : d)
export const vec = (p: Params, k: string, d: [number, number, number]): [number, number, number] => {
  const v = p[k]
  return Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number') ? (v as [number, number, number]) : d
}
