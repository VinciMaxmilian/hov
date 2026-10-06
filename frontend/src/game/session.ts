import { audio } from './audio/audioManager'
import { content } from './content'
import { bus } from './core/eventBus'
import { scheduler } from './core/scheduler'
import { stopRecording } from './documents/recordings'
import { refreshJournal } from './journal/journalSystem'
import { teleport } from './player/playerRuntime'
import { requestSave, saveNow, setAutosaveEnabled } from './save/saveManager'
import { trackEvent } from './save/cloudSaves'
import { useGame } from './state/gameStore'
import { createNewGameState } from './state/newGame'
import type { SaveData } from './state/saveSchema'
import { useSettings } from './state/settingsStore'
import { useUi } from './state/uiStore'

/** Ciclo de vida da partida: novo jogo, carregar, voltar ao título. */

function resetRuntime() {
  scheduler.clear()
  stopRecording()
  useUi.setState({
    focus: null,
    inspect: null,
    activePuzzle: null,
    cameraFocus: null,
    messages: [],
    hint: null,
    subtitle: null,
    areaCard: null,
    endingPending: false,
  })
}

export function startNewGame(slot: number): void {
  resetRuntime()
  const state = createNewGameState(content)
  useGame.getState().replace(state, slot)
  teleport(state.player.position, state.player.yaw)
  audio.unlock()
  audio.setMuffle(content.areas.get(state.player.area)?.rainMuffle ?? 0)
  setAutosaveEnabled(false)
  useUi.setState({ mode: 'intro' })
}

/** Chamado pela tela de abertura ao terminar o fade. */
export function beginPlay(isNew: boolean): void {
  setAutosaveEnabled(true)
  useUi.setState({ mode: 'playing' })
  const { slot } = useGame.getState()
  bus.emit('GAME_STARTED', { slot, isNew })
  if (isNew) void saveNow()
  trackEvent(isNew ? 'game_started' : 'game_loaded', { slot })
}

export function loadGame(save: SaveData): void {
  resetRuntime()
  const { schemaVersion: _v, meta, settings, ...state } = save
  useGame.getState().replace(state, meta.slot)
  useSettings.getState().update(settings)
  teleport(state.player.position, state.player.yaw, state.player.pitch)
  audio.unlock()
  audio.setMuffle(content.areas.get(state.player.area)?.rainMuffle ?? 0.7)
  audio.setAmbienceLevel(1, 0.5)
  refreshJournal()
  beginPlay(false)
}

export function returnToTitle(): void {
  requestSave('manual')
  setAutosaveEnabled(false)
  resetRuntime()
  useUi.setState({ mode: 'title' })
}

/** Autosave em eventos-chave + analytics mínimos + efeitos de troca de área. */
export function installSessionHooks(): void {
  for (const type of ['DOCUMENT_DISCOVERED', 'PUZZLE_SOLVED', 'AREA_ENTERED', 'DOOR_UNLOCKED', 'ITEM_PICKED'] as const) {
    bus.on(type, () => requestSave('event'))
  }
  bus.on('PUZZLE_SOLVED', ({ puzzle }) => trackEvent('puzzle_solved', { puzzle, playtime: Math.floor(useGame.getState().playtimeSec) }))
  bus.on('SLICE_COMPLETE', () => trackEvent('slice_complete', { playtime: Math.floor(useGame.getState().playtimeSec) }))
  bus.on('AREA_ENTERED', ({ area }) => {
    const def = content.areas.get(area)
    if (!def) return
    audio.setMuffle(def.rainMuffle)
    const game = useGame.getState()
    const key = `visited:${area}`
    if (!game.flags[key]) {
      game.setFlag(key, true)
      useUi.getState().showAreaCard(def.name)
    }
  })
  useSettings.subscribe((s) => audio.setVolume(s.masterVolume))
  audio.setVolume(useSettings.getState().masterVolume)
}
