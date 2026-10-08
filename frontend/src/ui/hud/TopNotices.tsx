import { content } from '../../game/content'
import { useGame } from '../../game/state/gameStore'
import { useUi } from '../../game/state/uiStore'
import { useLang, useTr } from '../../game/i18n'
import { formatGameClock } from '../format'

/**
 * Avisos que precisam ficar visíveis por cima de QUALQUER tela (inspeção, menus, puzzle, pausa),
 * não só durante o jogo livre — senão o jogador troca de Ato ou recebe um aviso sem notar.
 */
export function TopNotices() {
  const chapter = useUi((s) => s.chapter)
  const notifications = useUi((s) => s.notifications)
  const clock = useGame((s) => s.clock)
  const lang = useLang((s) => s.lang)
  const t = useTr()

  if (!chapter && notifications.length === 0) return null

  return (
    <div className="layer top-notices">
      {chapter && (
        <div key={chapter.id} className="chapter-card">
          <div className="chapter-title">{t(chapter.text).toUpperCase()}</div>
          {chapter.subtitle && <div className="chapter-sub">{t(chapter.subtitle)}</div>}
          <div className="chapter-clock">{formatGameClock(clock.day, clock.minutes, lang)}</div>
        </div>
      )}
      {notifications.length > 0 && (
        <div className="notify-corner">
          {notifications.map((n) => (
            <div key={n.id} className="notify-toast">
              <span className="notify-bell">🔔</span>
              <span className="notify-text">
                {t(n.text)}
                {n.area && content.areas.get(n.area) && <span className="notify-area"> — {t(content.areas.get(n.area)!.name)}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
