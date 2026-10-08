import { content } from '../content'
import { bus, type AnyGameEvent } from '../core/eventBus'
import { run } from '../rules/effects'
import { evaluate } from '../rules/evaluate'
import { useGame } from '../state/gameStore'

/**
 * Diretor narrativo: gatilhos declarativos (content/story) reagindo a eventos do bus.
 * Gatilhos "once" ficam registrados em flags (trigger:<id>) — portanto persistem no save.
 */
// TIME_CHANGED chega uma vez por minuto de jogo (6 s reais): barato, e o prazo do 7º dia depende dele.
const IGNORED = new Set(['SOUND_REQUEST'])

function matches(event: AnyGameEvent, match: Record<string, string | number | boolean>): boolean {
  const payload = event.payload as Record<string, unknown>
  return Object.entries(match).every(([k, v]) => payload[k] === v)
}

export function installStoryDirector(): () => void {
  return bus.onAny((event) => {
    if (IGNORED.has(event.type)) return
    for (const t of content.story.triggers) {
      if (t.on !== event.type || !matches(event, t.match)) continue
      const game = useGame.getState()
      const firedKey = `trigger:${t.id}`
      if (t.once && game.flags[firedKey]) continue
      if (!evaluate(t.conditions, game)) continue
      if (t.once) game.setFlag(firedKey, true)
      run(t.actions)
    }
  })
}
