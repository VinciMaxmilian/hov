import type { Condition, RevelationDef } from '../content/schemas'
import type { GameState } from '../state/saveSchema'

/** Visão mínima do estado necessária para avaliar condições (facilita testes). */
export type RuleState = Pick<GameState, 'flags' | 'inventory' | 'world' | 'documents' | 'puzzles' | 'journal'> & {
  player: { area: string }
  clock?: { day: number; minutes: number }
}

let revelations: readonly RevelationDef[] = []

/** Registrado pelo carregador de conteúdo (story.revelations). */
export function setRevelationDefs(defs: readonly RevelationDef[]): void {
  revelations = defs
}

export function revelationConfirmed(def: RevelationDef, s: RuleState): boolean {
  return def.clues.filter((c) => evaluate(c, s)).length >= def.need
}

/** Avaliação pura: mesma entrada → mesma saída. Condição ausente = verdadeira. */
export function evaluate(condition: Condition | undefined, s: RuleState): boolean {
  if (!condition) return true
  switch (condition.type) {
    case 'flag': {
      const v = s.flags[condition.key]
      return condition.equals === undefined ? Boolean(v) : v === condition.equals
    }
    case 'hasItem':
      return s.inventory.includes(condition.item)
    case 'world':
      return s.world[condition.key] === condition.equals
    case 'document':
      return s.documents.includes(condition.document)
    case 'puzzleSolved':
      return s.puzzles[condition.puzzle]?.status === 'solved'
    case 'puzzleValue':
      return s.puzzles[condition.puzzle]?.values[condition.key] === condition.equals
    case 'area':
      return s.player.area === condition.area
    case 'journal':
      return s.journal.includes(condition.entry)
    case 'clock': {
      const c = s.clock ?? { day: 1, minutes: 0 }
      const { minDay, maxDay, minMinutes, maxMinutes } = condition
      if (minDay !== undefined && c.day < minDay) return false
      if (maxDay !== undefined && c.day > maxDay) return false
      if (minMinutes !== undefined && c.minutes < minMinutes) return false
      if (maxMinutes !== undefined && c.minutes > maxMinutes) return false
      return true
    }
    case 'revelation': {
      const def = revelations.find((r) => r.id === condition.id)
      return def ? revelationConfirmed(def, s) : false
    }
    case 'revelations':
      return revelations.filter((r) => revelationConfirmed(r, s)).length >= condition.min
    case 'all':
      return condition.of.every((c) => evaluate(c, s))
    case 'any':
      return condition.of.some((c) => evaluate(c, s))
    case 'not':
      return !evaluate(condition.condition, s)
  }
}
