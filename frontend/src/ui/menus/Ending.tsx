import { content } from '../../game/content'
import { resumePlay } from '../../game/controls'
import { progressOf } from '../../game/save/saveManager'
import { returnToTitle } from '../../game/session'
import { useGame } from '../../game/state/gameStore'
import { useUi } from '../../game/state/uiStore'
import { formatPlaytime } from '../format'
import { useTr } from '../../game/i18n'

/** Fim do vertical slice. */
export function Ending() {
  const playtime = useGame((s) => s.playtimeSec)
  const docs = useGame((s) => s.documents.length)
  const total = content.documents.size
  const t = useTr()
  return (
    <div className="layer ending center">
      <div className="stack" style={{ alignItems: 'center', maxWidth: 640 }}>
        <div className="small-caps faint">{t('end of the first record')}</div>
        <h1>THE HOUSE OF VALE</h1>
        <p className="muted" style={{ fontSize: '1.25rem', lineHeight: 1.7 }}>
          {t('Beneath the west wing the stone is older than the house.')}
          <br />
          {t('Someone counted eight. Someone made it seven.')}
        </p>
        <p className="faint" style={{ fontFamily: 'var(--type)', fontSize: '0.85rem' }}>
          {formatPlaytime(playtime)} · {progressOf()}% · {docs}/{total} {t('records')}
        </p>
        <div className="row" style={{ marginTop: '1.4rem' }}>
          <button
            className="btn"
            onClick={() => {
              useUi.setState({ endingPending: false })
              resumePlay()
            }}
          >
            {t('Keep exploring')}
          </button>
          <button className="btn" onClick={returnToTitle}>
            {t('Return to title')}
          </button>
        </div>
      </div>
    </div>
  )
}
