import { describe, expect, it, vi } from 'vitest'
import { evaluate, type RuleState } from '../rules/evaluate'
import { runActions, type RuleEffects } from '../rules/execute'

const state = (over: Partial<RuleState> = {}): RuleState => ({
  flags: {},
  inventory: [],
  world: {},
  documents: [],
  puzzles: {},
  journal: [],
  player: { area: 'exterior' },
  ...over,
})

describe('evaluate', () => {
  it('condição ausente é verdadeira', () => expect(evaluate(undefined, state())).toBe(true))

  it('flags: truthy sem equals, igualdade com equals', () => {
    const s = state({ flags: { a: true, n: 3 } })
    expect(evaluate({ type: 'flag', key: 'a' }, s)).toBe(true)
    expect(evaluate({ type: 'flag', key: 'b' }, s)).toBe(false)
    expect(evaluate({ type: 'flag', key: 'n', equals: 3 }, s)).toBe(true)
  })

  it('composição all/any/not', () => {
    const s = state({ inventory: ['key'], world: { door: 'open' } })
    expect(
      evaluate(
        {
          type: 'all',
          of: [
            { type: 'hasItem', item: 'key' },
            { type: 'any', of: [{ type: 'world', key: 'door', equals: 'locked' }, { type: 'world', key: 'door', equals: 'open' }] },
            { type: 'not', condition: { type: 'document', document: 'x' } },
          ],
        },
        s,
      ),
    ).toBe(true)
  })

  it('valores de puzzle', () => {
    const s = state({ puzzles: { clock: { status: 'unsolved', values: { hour: 2, minute: 17 }, attempts: 0 } } })
    expect(evaluate({ type: 'puzzleValue', puzzle: 'clock', key: 'minute', equals: 17 }, s)).toBe(true)
    expect(evaluate({ type: 'puzzleSolved', puzzle: 'clock' }, s)).toBe(false)
  })
})

describe('runActions', () => {
  function fakeEffects(s: RuleState) {
    const timers: (() => void)[] = []
    const fx = {
      state: () => s,
      setFlag: vi.fn((k: string, v: boolean | number | string) => (s.flags[k] = v)),
      setWorld: vi.fn(),
      giveItem: vi.fn(),
      removeItem: vi.fn(),
      discoverDocument: vi.fn(),
      inspectItem: vi.fn(),
      openDocument: vi.fn(),
      playSound: vi.fn(),
      playRecording: vi.fn(),
      message: vi.fn(),
      hint: vi.fn(),
      openPuzzle: vi.fn(),
      solvePuzzle: vi.fn(),
      closePuzzle: vi.fn(),
      unlockJournal: vi.fn(),
      save: vi.fn(),
      setClock: vi.fn(),
      chapter: vi.fn(),
      teleport: vi.fn(),
      beginEnding: vi.fn(),
      schedule: vi.fn((_ms: number, fn: () => void) => timers.push(fn)),
    } satisfies RuleEffects
    return { fx, flush: () => timers.splice(0).forEach((t) => t()) }
  }

  it('executa em ordem, com if e delay', () => {
    const s = state()
    const { fx, flush } = fakeEffects(s)
    runActions(
      [
        { type: 'setFlag', key: 'a', value: true },
        { type: 'if', condition: { type: 'flag', key: 'a' }, then: [{ type: 'giveItem', item: 'k' }], else: [{ type: 'message', text: 'no' }] },
        { type: 'delay', ms: 100, actions: [{ type: 'setWorld', key: 'door', value: 'open' }] },
      ],
      fx,
    )
    expect(fx.giveItem).toHaveBeenCalledWith('k', false)
    expect(fx.message).not.toHaveBeenCalled()
    expect(fx.setWorld).not.toHaveBeenCalled()
    flush()
    expect(fx.setWorld).toHaveBeenCalledWith('door', 'open')
  })
})
