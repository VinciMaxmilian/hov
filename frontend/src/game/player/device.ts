import { create } from 'zustand'

/**
 * Modo de controle: teclado/mouse (pointer lock) ou toque (joystick virtual + botões).
 * "auto" usa toque quando o ponteiro principal é grosso (celular/tablet). Preferência por dispositivo,
 * fora do save (não faz sentido sincronizar entre aparelhos).
 */
export type TouchPreference = 'auto' | 'on' | 'off'

const KEY = 'hov:touch'

function detectCoarse(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches
}

function readPref(): TouchPreference {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'on' || v === 'off' || v === 'auto') return v
  } catch {
    /* storage bloqueado */
  }
  return 'auto'
}

interface DeviceStore {
  preference: TouchPreference
  touch: boolean
  setPreference(p: TouchPreference): void
}

const resolve = (p: TouchPreference) => (p === 'auto' ? detectCoarse() : p === 'on')

export const useDevice = create<DeviceStore>()((set) => ({
  preference: readPref(),
  touch: resolve(readPref()),
  setPreference: (preference) => {
    try {
      localStorage.setItem(KEY, preference)
    } catch {
      /* só em memória */
    }
    set({ preference, touch: resolve(preference) })
  },
}))

export const isTouch = () => useDevice.getState().touch

/** Marca <html> com .touch para CSS (esconder atalhos de teclado, layout de toque). */
export function installDeviceClass(): void {
  const apply = (touch: boolean) => document.documentElement.classList.toggle('touch', touch)
  apply(useDevice.getState().touch)
  useDevice.subscribe((s) => apply(s.touch))
}

/** Tela cheia + paisagem no toque. Precisa de gesto do usuário; falhas são silenciosas (iOS não suporta). */
export function enterImmersive(): void {
  if (!isTouch() || typeof document === 'undefined') return
  const el = document.documentElement
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen({ navigationUI: 'hide' })
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
      .catch(() => {})
  }
}

/** Escolhe o texto da dica conforme o modo de controle. */
export const pickHint = (text: string, touch?: string) => (isTouch() && touch ? touch : text)
