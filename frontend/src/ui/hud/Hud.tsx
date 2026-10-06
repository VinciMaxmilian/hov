import { useSaveStatus } from '../../game/save/saveManager'
import { useUi } from '../../game/state/uiStore'

const STATUS_LABEL: Record<string, string> = {
  saving: 'saving…',
  saved: 'saved',
  syncing: 'syncing…',
  synced: 'saved · cloud',
  offline: 'saved · offline',
  conflict: 'cloud conflict — see Load',
  error: 'save failed',
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

  return (
    <div className="layer hud">
      {playing && <div className={`crosshair ${focus ? 'active' : ''}`} />}
      {playing && focus && (
        <div className="prompt">
          <span className="key">E</span>
          {focus.verb} <span className="muted">— {focus.label}</span>
        </div>
      )}
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className="message">
            {m.text}
          </div>
        ))}
      </div>
      {hint && (playing || mode === 'puzzle') && (
        <div key={hint.id} className="hint">
          {hint.text}
        </div>
      )}
      {subtitle && (
        <div className="subtitle-line">
          {subtitle.speaker && <span className="speaker">{subtitle.speaker}</span>}
          {subtitle.text}
        </div>
      )}
      {areaCard && playing && (
        <div key={areaCard.id} className="area-card">
          {areaCard.text.toUpperCase()}
        </div>
      )}
      <div className="status-corner">
        {journalPing > 0 && performance.now() - journalPing < 4000 && (
          <span key={journalPing} className="journal-ping">
            ✒ journal
          </span>
        )}
        {STATUS_LABEL[status] && <span>{STATUS_LABEL[status]}</span>}
      </div>
    </div>
  )
}
