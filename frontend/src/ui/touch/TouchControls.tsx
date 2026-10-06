import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { openJournal, pauseGame } from '../../game/controls'
import { interact } from '../../game/interaction/interact'
import { input } from '../../game/player/input'
import { toggleLamp, LAMP_FLAG } from '../../game/player/lampControl'
import { useGame } from '../../game/state/gameStore'
import { useUi } from '../../game/state/uiStore'

/** Raio do joystick em px; além de RUN_AT do raio, corre. */
const RADIUS = 56
const RUN_AT = 0.85
/** Ganho do arrasto de olhar (px de tela → mesmo acumulador do mouse). */
const LOOK_GAIN = 1.6

/**
 * Controles de toque: metade esquerda = joystick dinâmico (nasce onde o polegar toca);
 * metade direita = arrastar para olhar; botões contextuais por cima.
 * Mesmo modelo do teclado: só alimenta `input` — o Player não sabe de onde vem o movimento.
 */
export function TouchControls() {
  const focus = useUi((s) => s.focus)
  const hasLamp = useGame((s) => s.inventory.includes('oil_lamp'))
  const lit = useGame((s) => Boolean(s.flags[LAMP_FLAG]))

  const stick = useRef<{ id: number; ox: number; oy: number } | null>(null)
  const look = useRef<{ id: number; x: number; y: number } | null>(null)
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)

  // Ao sair do modo de jogo, solta o joystick.
  useEffect(() => () => input.setVirtualMove(0, 0, false), [])

  const showStick = (x: number, y: number, kx: number, ky: number, visible: boolean) => {
    if (!base.current || !knob.current) return
    base.current.style.opacity = visible ? '1' : '0'
    base.current.style.transform = `translate(${x - RADIUS}px, ${y - RADIUS}px)`
    knob.current.style.transform = `translate(${kx}px, ${ky}px)`
  }

  const onMoveDown = (e: ReactPointerEvent) => {
    if (stick.current) return
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    stick.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY }
    showStick(e.clientX, e.clientY, 0, 0, true)
  }
  const onMoveMove = (e: ReactPointerEvent) => {
    const s = stick.current
    if (!s || s.id !== e.pointerId) return
    let dx = e.clientX - s.ox
    let dy = e.clientY - s.oy
    const len = Math.hypot(dx, dy)
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS
      dy = (dy / len) * RADIUS
    }
    const mag = Math.min(1, len / RADIUS)
    // zona morta pequena para não "andar sozinho"
    const k = mag < 0.12 ? 0 : 1
    input.setVirtualMove((dx / RADIUS) * k, (-dy / RADIUS) * k, mag >= RUN_AT)
    showStick(s.ox, s.oy, dx, dy, true)
  }
  const onMoveUp = (e: ReactPointerEvent) => {
    if (stick.current?.id !== e.pointerId) return
    stick.current = null
    input.setVirtualMove(0, 0, false)
    showStick(0, 0, 0, 0, false)
  }

  const onLookDown = (e: ReactPointerEvent) => {
    if (look.current) return
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const onLookMove = (e: ReactPointerEvent) => {
    const l = look.current
    if (!l || l.id !== e.pointerId) return
    input.addLook((e.clientX - l.x) * LOOK_GAIN, (e.clientY - l.y) * LOOK_GAIN)
    l.x = e.clientX
    l.y = e.clientY
  }
  const onLookUp = (e: ReactPointerEvent) => {
    if (look.current?.id === e.pointerId) look.current = null
  }

  // Botões não devem iniciar arrasto nas zonas de baixo.
  const press = (fn: () => void) => (e: ReactPointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    fn()
  }

  return (
    <div className="layer touch-ui">
      <div className="touch-zone move" onPointerDown={onMoveDown} onPointerMove={onMoveMove} onPointerUp={onMoveUp} onPointerCancel={onMoveUp} />
      <div className="touch-zone look" onPointerDown={onLookDown} onPointerMove={onLookMove} onPointerUp={onLookUp} onPointerCancel={onLookUp} />
      <div ref={base} className="stick-base">
        <div ref={knob} className="stick-knob" />
      </div>

      <div className="touch-top">
        <button className="touch-btn small" onPointerDown={press(openJournal)} aria-label="Journal">
          ✒
        </button>
        <button className="touch-btn small" onPointerDown={press(pauseGame)} aria-label="Menu">
          ☰
        </button>
      </div>

      <div className="touch-actions">
        {hasLamp && (
          <button className={`touch-btn ${lit ? 'on' : ''}`} onPointerDown={press(toggleLamp)} aria-label="Lamp">
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
              <path d="M12 2c2 3.2 4.5 5.3 4.5 9a4.5 4.5 0 0 1-9 0c0-2 1-3.3 2-4.5.3 1.6 1 2.5 2 2.8C11 7 11.5 4.6 12 2z" fill="currentColor" />
              <rect x="7" y="18" width="10" height="3" rx="1" fill="currentColor" opacity="0.6" />
            </svg>
          </button>
        )}
        <button
          className={`touch-btn interact ${focus ? 'ready' : ''}`}
          disabled={!focus}
          onPointerDown={press(() => focus && interact(focus.id))}
          aria-label={focus ? `${focus.verb} ${focus.label}` : 'Interact'}
        >
          {focus ? (
            <>
              <span className="verb">{focus.verb}</span>
              <span className="what">{focus.label}</span>
            </>
          ) : (
            '·'
          )}
        </button>
      </div>
    </div>
  )
}
