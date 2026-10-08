import { content } from '../../game/content'
import { requestPointerLock } from '../../game/player/input'
import { adjustClock, attemptPuzzle, closePuzzle, pressSequence, turnDial } from '../../game/puzzles/puzzleSystem'
import { useGame } from '../../game/state/gameStore'
import { useUi } from '../../game/state/uiStore'
import { useTr } from '../../game/i18n'

/** Controles do close-up de puzzle. A câmera já está no objeto: aqui só os comandos. */
export function PuzzleOverlay() {
  const id = useUi((s) => s.activePuzzle)
  const values = useGame((s) => (id ? s.puzzles[id]?.values : undefined))
  const solved = useGame((s) => (id ? s.puzzles[id]?.status === 'solved' : false))
  const puzzle = id ? content.puzzles.get(id) : undefined
  const dialIndex = useUi((s) => s.dialIndex)
  const t = useTr()
  if (!id || !puzzle) return null

  const leave = () => {
    closePuzzle()
    void requestPointerLock()
  }

  if (puzzle.input.type === 'clock') {
    const hour = Number(values?.hour ?? puzzle.input.initial.hour)
    const minute = Number(values?.minute ?? puzzle.input.initial.minute)
    return (
      <div className="layer puzzle-ui">
        <div className="puzzle-panel">
          <div className="small-caps faint">{t(puzzle.title)}</div>
          <div className="readout">
            {hour}:{String(minute).padStart(2, '0')}
          </div>
          {!solved && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn small" onClick={() => adjustClock(id, 'hour', -1)}>
                <span className="key">A</span>{t('hour')} −
              </button>
              <button className="btn small" onClick={() => adjustClock(id, 'hour', 1)}>
                <span className="key">D</span>{t('hour')} +
              </button>
              <button className="btn small" onClick={() => adjustClock(id, 'minute', -1)}>
                <span className="key">S</span>{t('min')} −
              </button>
              <button className="btn small" onClick={() => adjustClock(id, 'minute', 1)}>
                <span className="key">W</span>{t('min')} +
              </button>
              <button className="btn small primary" onClick={() => attemptPuzzle(id)}>
                <span className="key">E</span>
                {t(puzzle.input.attemptLabel)}
              </button>
              <button className="btn small" onClick={leave}>
                <span className="key">Esc</span>{t('step back')}
              </button>
            </div>
          )}
          {!solved && <div className="faint" style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>{t('Shift — move the minute hand faster')}</div>}
        </div>
      </div>
    )
  }
  if (puzzle.input.type === 'dials') {
    const input = puzzle.input
    return (
      <div className="layer puzzle-ui">
        <div className="puzzle-panel">
          <div className="small-caps faint">{t(puzzle.title)}</div>
          {input.prompt && <div className="puzzle-prompt">{t(input.prompt)}</div>}
          <div className="dials">
            {input.dials.map((d, i) => {
              const v = Number(values?.[`d${i}`] ?? input.initial?.[i] ?? 0)
              return (
                <div key={i} className={`dial ${i === dialIndex && !solved ? 'selected' : ''}`} onClick={() => useUi.setState({ dialIndex: i })}>
                  {d.label && <div className="dial-label faint">{t(d.label)}</div>}
                  {!solved && (
                    <button className="btn small" onClick={() => turnDial(id, i, 1)} aria-label={t('next')}>
                      ▲
                    </button>
                  )}
                  <div className="dial-value">{t(d.options[v])}</div>
                  {!solved && (
                    <button className="btn small" onClick={() => turnDial(id, i, -1)} aria-label={t('previous')}>
                      ▼
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {!solved && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn small primary" onClick={() => attemptPuzzle(id)}>
                <span className="key">E</span>
                {t(input.attemptLabel)}
              </button>
              <button className="btn small" onClick={leave}>
                <span className="key">Esc</span>
                {t('step back')}
              </button>
            </div>
          )}
          {!solved && <div className="faint" style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>{t('A / D — choose a dial · W / S — turn it')}</div>}
        </div>
      </div>
    )
  }

  if (puzzle.input.type === 'sequence') {
    const input = puzzle.input
    const pressed = String(values?.seq ?? '')
      .split(',')
      .filter(Boolean).length
    return (
      <div className="layer puzzle-ui">
        <div className="puzzle-panel">
          <div className="small-caps faint">{t(puzzle.title)}</div>
          {input.prompt && <div className="puzzle-prompt">{t(input.prompt)}</div>}
          <div className="sequence">
            {input.options.map((o, i) => (
              <button key={i} className="btn small" disabled={solved} onClick={() => pressSequence(id, i)}>
                <span className="key">{(i + 1) % 10}</span>
                {t(o)}
              </button>
            ))}
          </div>
          <div className="sequence-count faint">{'●'.repeat(solved ? input.length : pressed) + '○'.repeat(solved ? 0 : input.length - pressed)}</div>
          {!solved && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn small" onClick={leave}>
                <span className="key">Esc</span>
                {t('step back')}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}
