/**
 * Entrada crua (teclado/mouse/pointer lock). Sem React: lida por useFrame sem causar re-render.
 */
const keys = new Set<string>()
const mouse = { dx: 0, dy: 0 }
let lockTarget: HTMLElement | null = null
const lockListeners = new Set<(locked: boolean) => void>()

export const input = {
  isDown: (code: string) => keys.has(code),
  /** Consome o deslocamento acumulado do mouse desde o último frame. */
  takeMouse(): { dx: number; dy: number } {
    const out = { dx: mouse.dx, dy: mouse.dy }
    mouse.dx = 0
    mouse.dy = 0
    return out
  },
  clear() {
    keys.clear()
    mouse.dx = 0
    mouse.dy = 0
  },
}

export function isPointerLocked(): boolean {
  if (typeof document === 'undefined') return false
  return document.pointerLockElement != null && document.pointerLockElement === lockTarget
}

export function setPointerLockTarget(el: HTMLElement | null): void {
  lockTarget = el
}

export async function requestPointerLock(): Promise<boolean> {
  if (!lockTarget) return false
  if (isPointerLocked()) return true
  try {
    await lockTarget.requestPointerLock()
    return true
  } catch {
    // Navegadores bloqueiam re-lock logo após Esc; a UI mostra "clique para continuar".
    return false
  }
}

export function exitPointerLock(): void {
  if (typeof document !== 'undefined' && document.pointerLockElement) document.exitPointerLock()
}

export function onPointerLockChange(fn: (locked: boolean) => void): () => void {
  lockListeners.add(fn)
  return () => lockListeners.delete(fn)
}

let installed = false

export function installInput(): void {
  if (installed) return
  installed = true
  window.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return
    keys.add(e.code)
    if (e.code === 'Tab' || e.code === 'Space') e.preventDefault()
  })
  window.addEventListener('keyup', (e) => keys.delete(e.code))
  window.addEventListener('blur', () => input.clear())
  document.addEventListener('mousemove', (e) => {
    if (!isPointerLocked()) return
    // Alguns navegadores geram picos absurdos ao (re)travar o ponteiro.
    if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return
    mouse.dx += e.movementX
    mouse.dy += e.movementY
  })
  document.addEventListener('pointerlockchange', () => {
    const locked = isPointerLocked()
    if (!locked) input.clear()
    lockListeners.forEach((fn) => fn(locked))
  })
}

export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}
