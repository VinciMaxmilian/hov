import { audio } from '../audio/audioManager'
import { content } from '../content'
import { bus } from '../core/eventBus'
import { scheduler } from '../core/scheduler'
import { playRecording } from '../documents/recordings'
import { closePuzzle, openPuzzle, solvePuzzle } from '../puzzles/puzzleSystem'
import { requestSave } from '../save/saveManager'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'
import type { RuleEffects } from './execute'
import { runActions } from './execute'
import type { Action } from '../content/schemas'

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
  hint: (text, durationMs) => useUi.getState().showHint(text, durationMs),
  openPuzzle: (puzzle) => openPuzzle(puzzle),
  solvePuzzle: (puzzle) => solvePuzzle(puzzle),
  closePuzzle: () => closePuzzle(),
  unlockJournal: (entry) => {
    useGame.getState().unlockJournal(entry)
  },
  save: () => requestSave('event'),
  endSlice: () => {
    const ui = useUi.getState()
    useUi.setState({ endingPending: true })
    if (ui.mode !== 'inspect') ui.setMode('ending')
    bus.emit('SLICE_COMPLETE', {})
    requestSave('event')
  },
  schedule: (ms, fn) => {
    scheduler.after(ms, fn)
  },
}

export const run = (actions: readonly Action[]) => runActions(actions, gameEffects)
