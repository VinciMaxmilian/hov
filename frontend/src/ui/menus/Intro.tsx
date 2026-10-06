import { useEffect, useState } from 'react'
import { audio } from '../../game/audio/audioManager'
import { beginPlay } from '../../game/session'

/**
 * Abertura: tela preta, chuva, texto discreto, fade para a Vale Manor ao longe.
 * Qualquer clique/tecla pula.
 */
export function Intro() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    audio.setAmbienceLevel(0, 0.01)
    audio.setAmbienceLevel(1, 3)
    const steps = [
      window.setTimeout(() => setPhase(1), 1400),
      window.setTimeout(() => setPhase(2), 6200),
      window.setTimeout(() => setPhase(3), 7600),
      window.setTimeout(() => beginPlay(true), 10200),
    ]
    const skip = () => {
      steps.forEach((t) => window.clearTimeout(t))
      beginPlay(true)
    }
    const onKey = (e: KeyboardEvent) => e.code !== 'Tab' && skip()
    window.addEventListener('keydown', onKey, { once: true })
    window.addEventListener('pointerdown', skip, { once: true })
    return () => {
      steps.forEach((t) => window.clearTimeout(t))
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', skip)
    }
  }, [])

  return (
    <div className="layer blackout center" style={{ opacity: phase >= 3 ? 0 : 1 }}>
      <div className="intro-text" style={{ opacity: phase === 1 ? 1 : 0 }}>
        BELLWEATHER, OREGON
        <br />
        OCTOBER 1998
      </div>
    </div>
  )
}
