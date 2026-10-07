import { describe, expect, it } from 'vitest'
import { input } from '../player/input'

describe('input.move (teclado + joystick virtual)', () => {
  it('joystick para frente = z negativo; corrida no limite', () => {
    input.clear()
    input.setVirtualMove(0, 1, true)
    expect(input.move()).toEqual({ x: 0, z: -1, run: true })
  })

  it('combinação nunca passa de magnitude 1', () => {
    input.clear()
    input.setVirtualMove(1, 1, false)
    const m = input.move()
    expect(Math.hypot(m.x, m.z)).toBeCloseTo(1, 6)
  })

  it('clear solta o joystick', () => {
    input.setVirtualMove(0.5, 0.5, true)
    input.clear()
    expect(input.move()).toEqual({ x: 0, z: 0, run: false })
  })
})
