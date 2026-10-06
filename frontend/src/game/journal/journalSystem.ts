import { content } from '../content'
import { bus } from '../core/eventBus'
import { evaluate } from '../rules/evaluate'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'

/**
 * Journal: organiza automaticamente o que foi descoberto, sem resolver mistérios.
 * Entradas destravam por condição (documentos lidos, flags, puzzles) — nunca por "resposta certa".
 */
const WATCHED = new Set([
  'ITEM_PICKED',
  'DOCUMENT_DISCOVERED',
  'DOCUMENT_VIEWED',
  'PUZZLE_SOLVED',
  'AREA_ENTERED',
  'DOOR_UNLOCKED',
  'WORLD_STATE_CHANGED',
  'STORY_FLAG_CHANGED',
  'GAME_STARTED',
])

export function refreshJournal(): void {
  const game = useGame.getState()
  for (const entry of content.journal.entries) {
    if (game.journal.includes(entry.id)) continue
    if (entry.unlockWhen && evaluate(entry.unlockWhen, useGame.getState())) game.unlockJournal(entry.id)
  }
}

export function installJournalSystem(): () => void {
  const offAny = bus.onAny((e) => {
    if (WATCHED.has(e.type)) refreshJournal()
  })
  const offUpdated = bus.on('JOURNAL_UPDATED', () => useUi.setState({ journalPing: performance.now() }))
  return () => {
    offAny()
    offUpdated()
  }
}

/** Derivações para a UI. */
export function journalView(state = useGame.getState()) {
  const unlocked = new Set(state.journal)
  const entries = content.journal.entries
    .filter((e) => unlocked.has(e.id))
    .map((e) => ({ ...e, resolved: e.resolvedWhen ? evaluate(e.resolvedWhen, state) : false }))
  const nodes = content.journal.board.nodes
    .filter((n) => evaluate(n.showWhen, state))
    .map((n) => ({ ...n, revealed: evaluate(n.revealWhen, state) }))
  const visible = new Set(nodes.map((n) => n.id))
  const edges = content.journal.board.edges
    .filter((e) => visible.has(e.from) && visible.has(e.to) && evaluate(e.showWhen, state))
    .map((e) => ({ ...e, confirmed: e.confirmedWhen ? evaluate(e.confirmedWhen, state) : true }))
  return { entries, nodes, edges }
}
