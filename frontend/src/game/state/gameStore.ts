import { create } from 'zustand'
import { bus } from '../core/eventBus'
import type { FlagValue, PuzzleValue } from '../core/types'
import type { GameState, PuzzleState } from './saveSchema'

/** Minutos de jogo por segundo real (1 min de jogo a cada 6 s). */
export const GAME_MINUTES_PER_SECOND = 1 / 6

/**
 * Fonte única de verdade do estado de jogo (serializável). Objetos Three nunca guardam estado:
 * derivam daqui. Todo mutador emite o evento correspondente no bus.
 * A posição contínua do jogador NÃO fica aqui (evita re-render por frame): ver player/playerRuntime.ts.
 */
export interface GameStore extends GameState {
  slot: number
  replace(state: GameState, slot: number): void
  setFlag(key: string, value: FlagValue): void
  setWorld(key: string, value: string): void
  addItem(item: string): boolean
  removeItem(item: string): boolean
  discoverDocument(document: string): boolean
  setPuzzleValue(puzzle: string, key: string, value: PuzzleValue): void
  setPuzzleStatus(puzzle: string, status: PuzzleState['status']): void
  countAttempt(puzzle: string): void
  unlockJournal(entry: string): boolean
  setArea(area: string): void
  advance(dtSec: number): void
}

export const emptyState = (): GameState => ({
  player: { area: 'exterior', position: [0, 0, 0], yaw: 0, pitch: 0 },
  inventory: [],
  world: {},
  puzzles: {},
  documents: [],
  flags: {},
  journal: [],
  clock: { day: 1, minutes: 0 },
  playtimeSec: 0,
})

export const useGame = create<GameStore>()((set, get) => ({
  ...emptyState(),
  slot: 1,

  replace: (state, slot) => set({ ...state, slot }),

  setFlag: (key, value) => {
    if (get().flags[key] === value) return
    set((s) => ({ flags: { ...s.flags, [key]: value } }))
    bus.emit('STORY_FLAG_CHANGED', { key, value })
  },

  setWorld: (key, value) => {
    const previous = get().world[key]
    if (previous === value) return
    set((s) => ({ world: { ...s.world, [key]: value } }))
    bus.emit('WORLD_STATE_CHANGED', { key, value, previous })
  },

  addItem: (item) => {
    if (get().inventory.includes(item)) return false
    set((s) => ({ inventory: [...s.inventory, item] }))
    bus.emit('ITEM_PICKED', { item })
    return true
  },

  removeItem: (item) => {
    if (!get().inventory.includes(item)) return false
    set((s) => ({ inventory: s.inventory.filter((i) => i !== item) }))
    bus.emit('ITEM_REMOVED', { item })
    return true
  },

  discoverDocument: (document) => {
    if (get().documents.includes(document)) return false
    set((s) => ({ documents: [...s.documents, document] }))
    bus.emit('DOCUMENT_DISCOVERED', { document })
    return true
  },

  setPuzzleValue: (puzzle, key, value) =>
    set((s) => {
      const current = s.puzzles[puzzle] ?? { status: 'unsolved', values: {}, attempts: 0 }
      return { puzzles: { ...s.puzzles, [puzzle]: { ...current, values: { ...current.values, [key]: value } } } }
    }),

  setPuzzleStatus: (puzzle, status) => {
    const current = get().puzzles[puzzle] ?? { status: 'unsolved', values: {}, attempts: 0 }
    if (current.status === status) return
    set((s) => ({ puzzles: { ...s.puzzles, [puzzle]: { ...current, status } } }))
    if (status === 'solved') bus.emit('PUZZLE_SOLVED', { puzzle })
  },

  countAttempt: (puzzle) =>
    set((s) => {
      const current = s.puzzles[puzzle] ?? { status: 'unsolved', values: {}, attempts: 0 }
      return { puzzles: { ...s.puzzles, [puzzle]: { ...current, attempts: current.attempts + 1 } } }
    }),

  unlockJournal: (entry) => {
    if (get().journal.includes(entry)) return false
    set((s) => ({ journal: [...s.journal, entry] }))
    bus.emit('JOURNAL_UPDATED', { entry })
    return true
  },

  setArea: (area) => {
    const previous = get().player.area
    if (previous === area) return
    set((s) => ({ player: { ...s.player, area } }))
    bus.emit('AREA_ENTERED', { area, previous })
  },

  advance: (dtSec) => {
    const { clock, playtimeSec } = get()
    let minutes = clock.minutes + dtSec * GAME_MINUTES_PER_SECOND
    let day = clock.day
    if (minutes >= 1440) {
      minutes -= 1440
      day += 1
    }
    const minuteChanged = Math.floor(minutes) !== Math.floor(clock.minutes) || day !== clock.day
    set({ clock: { day, minutes }, playtimeSec: playtimeSec + dtSec })
    if (minuteChanged) bus.emit('TIME_CHANGED', { day, minutes: Math.floor(minutes) })
  },
}))

/** Snapshot serializável (sem funções). */
export function snapshotState(): GameState {
  const s = useGame.getState()
  return {
    player: { ...s.player },
    inventory: [...s.inventory],
    world: { ...s.world },
    puzzles: structuredClone(s.puzzles),
    documents: [...s.documents],
    flags: { ...s.flags },
    journal: [...s.journal],
    clock: { ...s.clock },
    playtimeSec: s.playtimeSec,
  }
}
