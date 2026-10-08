import type { Puzzle } from '../content/schemas'
import type { ContentRegistry } from '../content/registry'
import type { GameState } from './saveSchema'

/** Estado inicial derivado do conteúdo: estados iniciais dos interactables e dos puzzles. */
export function createNewGameState(content: ContentRegistry): GameState {
  const world: Record<string, string> = {}
  for (const it of content.interactables.values()) {
    if (it.state !== undefined) world[it.id] = it.state
  }
  const puzzles: GameState['puzzles'] = {}
  for (const p of content.puzzles.values()) {
    puzzles[p.id] = { status: 'unsolved', values: initialValues(p), attempts: 0 }
  }
  const { start } = content.story
  return {
    player: { area: start.area, position: [...start.position], yaw: start.yaw, pitch: 0 },
    inventory: [],
    world,
    puzzles,
    documents: [],
    flags: { ...start.flags },
    journal: [],
    clock: { ...start.clock },
    playtimeSec: 0,
  }
}

export function computeProgress(content: ContentRegistry, evaluate: (c: ContentRegistry['story']['progress'][number]['when']) => boolean): number {
  const total = content.story.progress.reduce((sum, p) => sum + p.weight, 0)
  if (total === 0) return 0
  const done = content.story.progress.reduce((sum, p) => sum + (evaluate(p.when) ? p.weight : 0), 0)
  return Math.round((done / total) * 1000) / 10
}

/** Valores iniciais por tipo de input do puzzle. */
export function initialValues(p: Puzzle): Record<string, number | string> {
  switch (p.input.type) {
    case 'clock':
      return { ...p.input.initial }
    case 'dials':
      return Object.fromEntries(p.input.dials.map((_, i, all) => [`d${i}`, Math.min((p.input.type === 'dials' && p.input.initial?.[i]) || 0, all[i].options.length - 1)]))
    case 'sequence':
      return { seq: '' }
  }
}
