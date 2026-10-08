import { useGame } from '../../game/state/gameStore'
import { useUi } from '../../game/state/uiStore'
import { content } from '../../game/content'
import { progressOf } from '../../game/save/saveManager'
import { returnToTitle } from '../../game/session'
import { chooseEnding, currentEnding } from '../../game/story/endings'
import { withHeir } from '../../game/story/heir'
import { formatPlaytime } from '../format'
import { useTr } from '../../game/i18n'

/** Finais (GAME_DESIGN §11): texto do final → escolhas (se houver) → epílogo. */
export function Ending() {
  const ui = useUi((s) => s.ending)
  useGame((s) => s.flags) // re-renderiza quando a escolha é registrada
  const playtime = useGame((s) => s.playtimeSec)
  const docs = useGame((s) => s.documents.length)
  const t = useTr()
  const ending = ui ? currentEnding() : null
  if (!ending) return null
  const { def, choice, choices } = ending
  const picked = choice ? def.choices.find((c) => c.id === choice) : undefined
  const done = Boolean(picked) || choices.length === 0
  const paragraphs = picked ? picked.epilogue : def.text
  return (
    <div className="layer ending">
      <div className="ending-scroll center" style={{ flexDirection: 'column' }}>
        <div className="stack" style={{ alignItems: 'center', maxWidth: 680, margin: '0 auto' }}>
          <div className="small-caps faint">{t('the eighth record')}</div>
          <h1>{t(def.title).toUpperCase()}</h1>
          <div className="ending-text">
            {paragraphs.map((p, i) => (
              <p key={`${choice}-${i}`}>{withHeir(t(p))}</p>
            ))}
          </div>
          {!picked && choices.length > 0 && (
            <div className="ending-choices">
              {choices.map((c) => (
                <button key={c.id} className="btn" onClick={() => chooseEnding(c.id)}>
                  {t(c.label)}
                </button>
              ))}
            </div>
          )}
          {done && (
            <>
              <p className="faint" style={{ fontFamily: 'var(--type)', fontSize: '0.85rem', marginTop: '1.4rem' }}>
                {formatPlaytime(playtime)} · {progressOf()}% · {docs}/{content.documents.size} {t('records')}
              </p>
              <div className="row" style={{ marginTop: '1rem' }}>
                <button className="btn" onClick={returnToTitle}>
                  {t('Return to title')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
