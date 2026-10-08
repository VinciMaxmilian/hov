import { audio } from './audio/audioManager'
import { interact } from './interaction/interact'
import { exitPointerLock, isPointerLocked, isTypingTarget, onPointerLockChange, requestPointerLock } from './player/input'
import { toggleLamp } from './player/lampControl'
import { content } from './content'
import { adjustClock, attemptPuzzle, closePuzzle, pressSequence, turnDial } from './puzzles/puzzleSystem'
import { useUi } from './state/uiStore'

/**
 * Mapeamento de teclas → ações de jogo, dependente do modo da UI.
 * WASD/mouse ficam no Player; aqui ficam os comandos discretos (E, F, Tab, Esc, puzzle).
 */
export function resumePlay(): void {
  useUi.setState({ mode: 'playing' })
  void requestPointerLock()
}

/** Abre pertences/journal (Tab ou botão de toque). */
export function openJournal(): void {
  if (useUi.getState().mode !== 'playing') return
  exitPointerLock()
  audio.play('ui')
  useUi.setState({ mode: 'journal' })
}

/** Pausa (Esc com ponteiro travado ou botão de menu no toque). */
export function pauseGame(): void {
  if (useUi.getState().mode !== 'playing') return
  exitPointerLock()
  useUi.setState({ mode: 'paused' })
}

export function installControls(): void {
  onPointerLockChange((locked) => {
    useUi.setState({ pointerLocked: locked })
    // Esc com ponteiro travado é consumido pelo navegador: chega aqui como "destravou".
    if (!locked && useUi.getState().mode === 'playing') useUi.setState({ mode: 'paused' })
  })

  window.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target) || e.repeat) {
      // Repetição só importa para ajustar ponteiros do relógio.
      if (!(e.repeat && useUi.getState().mode === 'puzzle')) return
    }
    const ui = useUi.getState()
    switch (ui.mode) {
      case 'playing':
        if (e.code === 'KeyE' && ui.focus) interact(ui.focus.id)
        else if (e.code === 'KeyF') toggleLamp()
        else if (e.code === 'Tab') {
          e.preventDefault()
          openJournal()
        } else if (e.code === 'Escape') pauseGame()
        break
      case 'journal':
        if (e.code === 'Tab' || e.code === 'Escape') {
          e.preventDefault()
          resumePlay()
        }
        break
      case 'inspect':
        if (e.code === 'Escape' || e.code === 'KeyE') {
          ui.closeInspect()
          if (useUi.getState().mode === 'playing') void requestPointerLock()
        }
        break
      case 'puzzle':
        handlePuzzleKey(e, ui.activePuzzle)
        break
      case 'paused':
        if (e.code === 'Escape') resumePlay()
        break
      default:
        break
    }
  })
}

function handlePuzzleKey(e: KeyboardEvent, puzzle: string | null) {
  if (!puzzle) return
  const input = content.puzzles.get(puzzle)?.input
  if (!input) return
  if (e.code === 'Escape') {
    closePuzzle()
    if (!isPointerLocked()) void requestPointerLock()
    return
  }
  if (e.code === 'KeyF') return toggleLamp()
  const attempt = e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space'
  if (input.type === 'sequence') {
    // 1–9 e 0 tocam as opções na ordem em que aparecem.
    const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code)
    if (m) {
      const i = m[1] === '0' ? 9 : Number(m[1]) - 1
      if (i < input.options.length) pressSequence(puzzle, i)
    }
    return
  }
  if (input.type === 'dials') {
    const ui = useUi.getState()
    const n = input.dials.length
    switch (e.code) {
      case 'KeyA':
      case 'ArrowLeft':
        return useUi.setState({ dialIndex: (ui.dialIndex + n - 1) % n })
      case 'KeyD':
      case 'ArrowRight':
        return useUi.setState({ dialIndex: (ui.dialIndex + 1) % n })
      case 'KeyW':
      case 'ArrowUp':
        return turnDial(puzzle, ui.dialIndex, 1)
      case 'KeyS':
      case 'ArrowDown':
        return turnDial(puzzle, ui.dialIndex, -1)
    }
    if (attempt) {
      e.preventDefault()
      attemptPuzzle(puzzle)
    }
    return
  }
  const big = e.shiftKey ? 5 : 1
  switch (e.code) {
    case 'KeyA':
    case 'ArrowLeft':
      return adjustClock(puzzle, 'hour', -1)
    case 'KeyD':
    case 'ArrowRight':
      return adjustClock(puzzle, 'hour', 1)
    case 'KeyW':
    case 'ArrowUp':
      return adjustClock(puzzle, 'minute', big)
    case 'KeyS':
    case 'ArrowDown':
      return adjustClock(puzzle, 'minute', -big)
  }
  if (attempt) {
    e.preventDefault()
    attemptPuzzle(puzzle)
  }
}
