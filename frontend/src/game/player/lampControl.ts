import { audio } from '../audio/audioManager'
import { bus } from '../core/eventBus'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'

/** Lamparina (F): precisa da lamparina e dos fósforos. Estado em flags.lamp_lit (salvo). */
export const LAMP_FLAG = 'lamp_lit'

export function toggleLamp(): void {
  const game = useGame.getState()
  const ui = useUi.getState()
  if (!game.inventory.includes('oil_lamp')) return
  if (!game.inventory.includes('matches')) {
    ui.message("You'll need something to light it.")
    return
  }
  const lit = Boolean(game.flags[LAMP_FLAG])
  game.setFlag(LAMP_FLAG, !lit)
  audio.play(lit ? 'lamp_off' : 'match')
  if (!lit && !game.flags.lamp_lit_once) {
    game.setFlag('lamp_lit_once', true)
    bus.emit('ITEM_USED', { item: 'oil_lamp', target: 'self' })
  }
}

