import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'
import { scheduler } from './scheduler'

/** Relógio de jogo e timers: só avançam quando o jogo não está pausado. */
const RUNNING = new Set(['playing', 'puzzle', 'inspect'])

export function GameLoop() {
  const pruneAt = useRef(0)
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const ui = useUi.getState()
    if (RUNNING.has(ui.mode)) {
      useGame.getState().advance(dt)
      scheduler.tick(dt * 1000)
    }
    const now = performance.now()
    if (now > pruneAt.current) {
      pruneAt.current = now + 250
      ui.prune(now)
    }
  })
  return null
}
