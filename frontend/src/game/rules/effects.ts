import { audio } from '../audio/audioManager'
import { content } from '../content'
import { bus } from '../core/eventBus'
import { scheduler } from '../core/scheduler'
import { playRecording } from '../documents/recordings'
import { closePuzzle, openPuzzle, solvePuzzle } from '../puzzles/puzzleSystem'
import { requestSave } from '../save/saveManager'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'
import { pickHint } from '../player/device'
import type { RuleEffects } from './execute'
import { runActions } from './execute'
import type { Action } from '../content/schemas'
import { teleport as teleportPlayer } from '../player/playerRuntime'
import { evaluate } from './evaluate'

/** Implementação real dos efeitos da DSL. */
export const gameEffects: RuleEffects = {
  state: () => useGame.getState(),
  setFlag: (key, value) => useGame.getState().setFlag(key, value),
  setWorld: (key, value) => useGame.getState().setWorld(key, value),
  giveItem: (item, silent) => {
    if (useGame.getState().addItem(item) && !silent) {
      useUi.getState().message(content.items.get(item)?.name ?? item)
    }
  },
  removeItem: (item) => {
    useGame.getState().removeItem(item)
  },
  discoverDocument: (document, open) => {
    useGame.getState().discoverDocument(document)
    if (open) useUi.getState().openInspect({ kind: 'document', id: document })
  },
  inspectItem: (item) => useUi.getState().openInspect({ kind: 'item', id: item }),
  openDocument: (document) => useUi.getState().openInspect({ kind: 'document', id: document }),
  playSound: (sound, position, volume) => audio.play(sound, { position, volume }),
  playRecording: (document) => playRecording(document),
  message: (text, durationMs) => useUi.getState().message(text, durationMs),
  notify: (text, area, durationMs) => useUi.getState().pushNotification(text, area, durationMs),
  hint: (text, durationMs, touchText) => useUi.getState().showHint(pickHint(text, touchText), durationMs),
  openPuzzle: (puzzle) => openPuzzle(puzzle),
  solvePuzzle: (puzzle) => solvePuzzle(puzzle),
  closePuzzle: () => closePuzzle(),
  unlockJournal: (entry) => {
    useGame.getState().unlockJournal(entry)
  },
  save: () => requestSave('event'),
  setClock: (day, minutes) => useGame.getState().setClock(day, minutes),
  chapter: (title, subtitle, fade) => {
    bus.emit('CHAPTER', { title })
    if (!fade) return useUi.getState().showChapter(title, subtitle)
    // Corte: a tela escurece, o tempo passa por trás, e o cartão do ato aparece.
    useUi.setState({ fade: 1 })
    scheduler.after(1400, () => {
      useUi.setState({ fade: 0 })
      useUi.getState().showChapter(title, subtitle)
    })
  },
  teleport: (position, yaw, area) => {
    useUi.setState({ fade: 1 })
    scheduler.after(700, () => {
      teleportPlayer(position, yaw)
      if (area) useGame.getState().setArea(area)
      scheduler.after(250, () => useUi.setState({ fade: 0 }))
    })
  },
  beginEnding: () => {
    const game = useGame.getState()
    if (game.flags.ending) return
    const ending = content.story.endings.find((e) => evaluate(e.when, game))
    if (!ending) return
    game.setFlag('ending', ending.id)
    const ui = useUi.getState()
    useUi.setState({ ending: { id: ending.id, choice: null }, endingPending: true, activePuzzle: null, cameraFocus: null })
    if (ui.mode !== 'inspect') ui.setMode('ending')
    bus.emit('ENDING_STARTED', { ending: ending.id })
    requestSave('event')
  },
  schedule: (ms, fn) => {
    scheduler.after(ms, fn)
  },
}

export const run = (actions: readonly Action[]) => runActions(actions, gameEffects)
