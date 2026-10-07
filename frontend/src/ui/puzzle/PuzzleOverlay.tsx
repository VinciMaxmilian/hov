import { content } from '../../game/content'
import { requestPointerLock } from '../../game/player/input'
import { adjustClock, attemptPuzzle, closePuzzle } from '../../game/puzzles/puzzleSystem'
import { useGame } from '../../game/state/gameStore'
import { useUi } from '../../game/state/uiStore'
import { useTr } from '../../game/i18n'

/** Controles do close-up de puzzle. A câmera já está no objeto: aqui só os comandos. */
export function PuzzleOverlay() {
  const id = useUi((s) => s.activePuzzle)
  const values = useGame((s) => (id ? s.puzzles[id]?.values : undefined))
  const solved = useGame((s) => (id ? s.puzzles[id]?.status === 'solved' : false))
  const puzzle = id ? content.puzzles.get(id) : undefined
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
  return null
}
