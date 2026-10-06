import { lazy, Suspense } from 'react'
import { requestPointerLock } from '../game/player/input'
import { useUi } from '../game/state/uiStore'
import { Hud } from './hud/Hud'
import { InspectOverlay } from './inspect/InspectOverlay'
import { JournalScreen } from './journal/JournalScreen'
import { Ending } from './menus/Ending'
import { Intro } from './menus/Intro'
import { PauseMenu } from './menus/PauseMenu'
import { TitleScreen } from './menus/TitleScreen'
import { PuzzleOverlay } from './puzzle/PuzzleOverlay'
import { TouchControls } from './touch/TouchControls'
import { useDevice } from '../game/player/device'

// Code splitting: three/R3F/Rapier só carregam ao entrar no jogo.
const GameCanvas = lazy(() => import('../game/GameCanvas').then((m) => ({ default: m.GameCanvas })))

// Dev: ?shot esconde o aviso de pointer lock (capturas headless).
const SHOT = import.meta.env.DEV && new URLSearchParams(window.location.search).has('shot')

export function App() {
  const mode = useUi((s) => s.mode)
  const locked = useUi((s) => s.pointerLocked)
  const touch = useDevice((s) => s.touch)
  const inGame = mode !== 'title'
  return (
    <>
      {inGame && (
        <div className="layer">
          <Suspense fallback={<div className="layer blackout" />}>
            <GameCanvas />
          </Suspense>
        </div>
      )}
      <div className="layer vignette" />
      {inGame && <Hud />}
      {mode === 'playing' && touch && <TouchControls />}
      {mode === 'playing' && !locked && !touch && !SHOT && (
        <div className="layer center resume" onClick={() => void requestPointerLock()}>
          CLICK TO CONTINUE
        </div>
      )}
      {mode === 'puzzle' && <PuzzleOverlay />}
      {mode === 'journal' && <JournalScreen />}
      {mode === 'inspect' && <InspectOverlay />}
      {mode === 'paused' && <PauseMenu />}
      {mode === 'ending' && <Ending />}
      {mode === 'intro' && <Intro />}
      {mode === 'title' && <TitleScreen />}
      {inGame && touch && (
        <div className="layer center rotate-hint">
          <div>↻</div>
          <div>Turn your device sideways</div>
        </div>
      )}
      <div className="layer grain" />
    </>
  )
}
