import { describe, expect, it } from 'vitest'
import type { OpeningDef } from '../content/schemas'
import { wallRects } from '../world/Room'

const op = (center: number, width: number, height: number, sill = 0): OpeningDef => ({
  side: 'south',
  center,
  width,
  height,
  sill,
  kind: sill > 0 ? 'window' : 'door',
  glass: false,
})

/** O ponto (u, v) está dentro de algum retângulo sólido? */
const solidAt = (rects: [number, number, number, number][], u: number, v: number) =>
  rects.some(([u0, u1, v0, v1]) => u > u0 && u < u1 && v > v0 && v < v1)

const area = (rects: [number, number, number, number][]) => rects.reduce((s, [u0, u1, v0, v1]) => s + (u1 - u0) * (v1 - v0), 0)

describe('wallRects', () => {
  const wall = { side: 'south' as const, uMin: -6, uMax: 6 }

  it('parede sem aberturas = um retângulo', () => {
    expect(wallRects(wall, 7, [])).toEqual([[-6, 6, 0, 7]])
  })

  it('porta com janela alta empilhada: o vão da porta fica livre', () => {
    const rects = wallRects(wall, 7, [op(0, 1.8, 2.9), op(0, 1.6, 1.8, 4.4)])
    expect(solidAt(rects, 0, 1.5)).toBe(false) // porta
    expect(solidAt(rects, 0, 5)).toBe(false) // janela alta
    expect(solidAt(rects, 0, 3.5)).toBe(true) // entre porta e janela
    expect(solidAt(rects, 0.85, 5)).toBe(true) // ao lado da janela alta, acima da porta
    expect(area(rects)).toBeCloseTo(12 * 7 - 1.8 * 2.9 - 1.6 * 1.8, 6)
  })

  it('fachada completa do Hall: nenhuma sobreposição e nenhum vão tapado', () => {
    const ops = [op(0, 1.8, 2.9), op(-3.4, 1.3, 2.6, 1), op(3.4, 1.3, 2.6, 1), op(0, 1.6, 1.8, 4.4), op(-3.4, 1.1, 1.6, 4.5), op(3.4, 1.1, 1.6, 4.5)]
    const rects = wallRects(wall, 7, ops)
    for (const o of ops) expect(solidAt(rects, o.center, o.sill + o.height / 2)).toBe(false)
    const holes = ops.reduce((s, o) => s + o.width * o.height, 0)
    expect(area(rects)).toBeCloseTo(12 * 7 - holes, 6)
  })
})
