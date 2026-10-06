import type { Condition } from '../content/schemas'
import type { GameState } from '../state/saveSchema'

/** Visão mínima do estado necessária para avaliar condições (facilita testes). */
export type RuleState = Pick<GameState, 'flags' | 'inventory' | 'world' | 'documents' | 'puzzles' | 'journal'> & {
  player: { area: string }
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
    case 'all':
      return condition.of.every((c) => evaluate(c, s))
    case 'any':
      return condition.of.some((c) => evaluate(c, s))
    case 'not':
      return !evaluate(condition.condition, s)
  }
}
