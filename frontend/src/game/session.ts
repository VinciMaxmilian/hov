import { audio } from './audio/audioManager'
import { content } from './content'
import { bus } from './core/eventBus'
import { scheduler } from './core/scheduler'
import { stopRecording } from './documents/recordings'
import { refreshJournal } from './journal/journalSystem'
import { teleport } from './player/playerRuntime'
import { CONTENT_VERSION, requestSave, saveNow, setAutosaveEnabled } from './save/saveManager'
import { trackEvent } from './save/cloudSaves'
import { useGame } from './state/gameStore'
import { createNewGameState } from './state/newGame'
import type { SaveData } from './state/saveSchema'
import { useSettings } from './state/settingsStore'
import { useUi } from './state/uiStore'
import { enterImmersive } from './player/device'

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
    chapter: null,
    fade: 0,
    endingPending: false,
    ending: null,
  })
}

export function startNewGame(slot: number): void {
  resetRuntime()
  enterImmersive()
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
  enterImmersive()
  const { schemaVersion: _v, meta, settings, ...state } = save
  // Save de outra versão do conteúdo (ex.: vertical slice, mapa antigo): mesma forma, coordenadas diferentes.
  // O jogador recomeça no ponto seguro da área (ou no início), mantendo descobertas e itens.
  if (meta.contentVersion !== CONTENT_VERSION) {
    const area = content.areas.get(state.player.area)
    const spot = area?.spawn ?? { position: content.story.start.position, yaw: content.story.start.yaw }
    state.player = { area: area ? area.id : content.story.start.area, position: [...spot.position], yaw: spot.yaw, pitch: 0 }
  }
  useGame.getState().replace(state, meta.slot)
  useSettings.getState().update(settings)
  teleport(state.player.position, state.player.yaw, state.player.pitch)
  audio.unlock()
  audio.setMuffle(content.areas.get(state.player.area)?.rainMuffle ?? 0.7)
  audio.setAmbienceLevel(1, 0.5)
  refreshJournal()
  beginPlay(false)
  const ending = state.flags.ending
  if (typeof ending === 'string') {
    const choice = state.flags.ending_choice
    useUi.setState({ mode: 'ending', ending: { id: ending, choice: typeof choice === 'string' ? choice : null } })
  }
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
  bus.on('ENDING_STARTED', ({ ending }) => trackEvent('ending_started', { ending, playtime: Math.floor(useGame.getState().playtimeSec) }))
  bus.on('CHAPTER', ({ title }) => trackEvent('chapter', { title, playtime: Math.floor(useGame.getState().playtimeSec) }))
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
