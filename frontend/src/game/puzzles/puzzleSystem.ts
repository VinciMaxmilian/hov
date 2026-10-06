import { audio } from '../audio/audioManager'
import { content } from '../content'
import { bus } from '../core/eventBus'
import { scheduler } from '../core/scheduler'
import { evaluate } from '../rules/evaluate'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'
import { exitPointerLock } from '../player/input'
import { run } from '../rules/effects'

/**
 * Runtime genérico de puzzles. O puzzle é dado (JSON): input + conditions + success/failure actions.
 * Novos tipos de input (ex.: 'dial', 'sequence') entram aqui e na UI; conteúdo continua sendo só JSON.
 */

export function openPuzzle(puzzleId: string): void {
  const puzzle = content.puzzles.get(puzzleId)
  if (!puzzle) return
  const state = useGame.getState()
  if (!evaluate(puzzle.requirements, state)) return
  const host = [...content.interactables.values()].find((i) => i.puzzle === puzzleId)
  exitPointerLock()
  useUi.setState({
    mode: 'puzzle',
    activePuzzle: puzzleId,
    cameraFocus: host?.focus ?? null,
    focus: null,
  })
}

export function closePuzzle(): void {
  if (useUi.getState().mode !== 'puzzle') return
  useUi.setState({ mode: 'playing', activePuzzle: null, cameraFocus: null })
}

export function solvePuzzle(puzzleId: string): void {
  useGame.getState().setPuzzleStatus(puzzleId, 'solved')
}

/** Ajusta o valor de um input (com "vai-um" do relógio: 59 → 0 avança a hora). */
export function adjustClock(puzzleId: string, unit: 'hour' | 'minute', delta: number): void {
  const game = useGame.getState()
  const ps = game.puzzles[puzzleId]
  if (!ps || ps.status === 'solved') return
  let hour = Number(ps.values.hour ?? 12)
  let minute = Number(ps.values.minute ?? 0)
  if (unit === 'hour') {
    hour = wrapHour(hour + delta)
  } else {
    minute += delta
    while (minute >= 60) {
      minute -= 60
      hour = wrapHour(hour + 1)
    }
    while (minute < 0) {
      minute += 60
      hour = wrapHour(hour - 1)
    }
  }
  game.setPuzzleValue(puzzleId, 'hour', hour)
  game.setPuzzleValue(puzzleId, 'minute', minute)
  audio.play('clock_hand', { volume: unit === 'hour' ? 0.9 : 0.6 })
}

const wrapHour = (h: number) => ((((h - 1) % 12) + 12) % 12) + 1

export function attemptPuzzle(puzzleId: string): void {
  const puzzle = content.puzzles.get(puzzleId)
  const game = useGame.getState()
  if (!puzzle || game.puzzles[puzzleId]?.status === 'solved') return
  game.countAttempt(puzzleId)
  if (evaluate(puzzle.conditions, useGame.getState())) {
    game.setPuzzleStatus(puzzleId, 'solved')
    run(puzzle.successActions)
    scheduler.after(1800, closePuzzle)
  } else {
    run(puzzle.failureActions)
    bus.emit('PUZZLE_FAILED', { puzzle: puzzleId })
  }
}
