import { useSaveStatus } from '../../game/save/saveManager'
import { useUi } from '../../game/state/uiStore'
import { useDevice } from '../../game/player/device'
import { msgid, useTr } from '../../game/i18n'

const STATUS_LABEL: Record<string, string> = {
  saving: msgid('saving…'),
  saved: msgid('saved'),
  syncing: msgid('syncing…'),
  synced: msgid('saved · cloud'),
  offline: msgid('saved · offline'),
  conflict: msgid('cloud conflict — see Load'),
  error: msgid('save failed'),
}

/** HUD mínimo: sem marcadores de objetivo, sem destacar pistas. */
export function Hud() {
  const mode = useUi((s) => s.mode)
  const focus = useUi((s) => s.focus)
  const messages = useUi((s) => s.messages)
  const hint = useUi((s) => s.hint)
  const subtitle = useUi((s) => s.subtitle)
  const areaCard = useUi((s) => s.areaCard)
  const journalPing = useUi((s) => s.journalPing)
  const status = useSaveStatus((s) => s.status)
  const playing = mode === 'playing'
  const touch = useDevice((s) => s.touch)
  const t = useTr()

  return (
    <div className="layer hud">
      {playing && <div className={`crosshair ${focus ? 'active' : ''}`} />}
      {playing && focus && !touch && (
        <div className="prompt">
          <span className="key">E</span>
          {t(focus.verb)} <span className="muted">— {t(focus.label)}</span>
        </div>
      )}
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className="message">
            {t(m.text)}
          </div>
        ))}
      </div>
      {hint && (playing || mode === 'puzzle') && (
        <div key={hint.id} className="hint">
          {t(hint.text)}
        </div>
      )}
      {subtitle && (
        <div className="subtitle-line">
          {subtitle.speaker && <span className="speaker">{t(subtitle.speaker)}</span>}
          {t(subtitle.text)}
        </div>
      )}
      {areaCard && playing && (
        <div key={areaCard.id} className="area-card">
          {t(areaCard.text).toUpperCase()}
        </div>
      )}
      <div className="status-corner">
        {journalPing > 0 && performance.now() - journalPing < 4000 && (
          <span key={journalPing} className="journal-ping">
            ✒ {t('journal')}
          </span>
        )}
        {STATUS_LABEL[status] && <span>{t(STATUS_LABEL[status])}</span>}
      </div>
    </div>
  )
}
