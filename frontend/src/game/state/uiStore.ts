import { create } from 'zustand'

/** Estado de interface (NÃO salvo). */
export type UiMode = 'title' | 'intro' | 'playing' | 'paused' | 'journal' | 'inspect' | 'puzzle' | 'ending'

export type InspectTarget = { kind: 'document'; id: string } | { kind: 'item'; id: string }

export interface Caption {
  id: number
  text: string
  until: number
}

export interface Subtitle {
  speaker?: string
  text: string
}

export interface GameNotification {
  id: number
  text: string
  area?: string
  until: number
}

interface UiStore {
  mode: UiMode
  pointerLocked: boolean
  focus: { id: string; label: string; verb: string } | null
  inspect: InspectTarget | null
  activePuzzle: string | null
  /** Mostrador selecionado num puzzle de mostradores. */
  dialIndex: number
  /** Pose de câmera do close-up ativo (puzzle). */
  cameraFocus: { position: [number, number, number]; lookAt: [number, number, number] } | null
  messages: Caption[]
  hint: Caption | null
  subtitle: Subtitle | null
  areaCard: Caption | null
  /** Avisos discretos (sino) de eventos que o jogador pode não ter testemunhado. */
  notifications: GameNotification[]
  endingPending: boolean
  /** Final em curso: id do final e escolha feita (null = ainda escolhendo). */
  ending: { id: string; choice: string | null } | null
  /** Cartão de ato. */
  chapter: (Caption & { subtitle?: string }) | null
  showChapter(title: string, subtitle?: string): void
  journalTab: 'belongings' | 'journal' | 'board'
  fade: number
  /** performance.now() da última atualização do journal (ícone discreto no HUD). */
  journalPing: number
  setMode(mode: UiMode): void
  setFocus(focus: UiStore['focus']): void
  /** returnTo: modo ao fechar (ex.: voltar ao journal). */
  inspectReturn: UiMode
  openInspect(target: InspectTarget, returnTo?: UiMode): void
  closeInspect(): void
  message(text: string, durationMs?: number): void
  showHint(text: string, durationMs?: number): void
  showAreaCard(text: string): void
  pushNotification(text: string, area?: string, durationMs?: number): void
  setSubtitle(sub: Subtitle | null): void
  prune(now: number): void
}

let captionId = 0

export const useUi = create<UiStore>()((set, get) => ({
  mode: 'title',
  pointerLocked: false,
  focus: null,
  inspect: null,
  activePuzzle: null,
  dialIndex: 0,
  cameraFocus: null,
  messages: [],
  hint: null,
  subtitle: null,
  areaCard: null,
  notifications: [],
  endingPending: false,
  ending: null,
  chapter: null,
  journalTab: 'belongings',
  fade: 0,
  journalPing: 0,

  setMode: (mode) => set({ mode }),

  setFocus: (focus) => {
    const cur = get().focus
    if (cur?.id === focus?.id && cur?.label === focus?.label && cur?.verb === focus?.verb) return
    set({ focus })
  },

  inspectReturn: 'playing',
  openInspect: (target, returnTo = 'playing') => set({ inspect: target, mode: 'inspect', focus: null, inspectReturn: returnTo }),

  closeInspect: () => {
    const ending = get().endingPending
    set({ inspect: null, mode: ending ? 'ending' : get().inspectReturn })
  },

  message: (text, durationMs = 4200) =>
    set((s) => ({ messages: [...s.messages.slice(-2), { id: ++captionId, text, until: performance.now() + durationMs }] })),

  showHint: (text, durationMs = 6000) => set({ hint: { id: ++captionId, text, until: performance.now() + durationMs } }),

  showAreaCard: (text) => set({ areaCard: { id: ++captionId, text, until: performance.now() + 3800 } }),

  showChapter: (text, subtitle) => set({ chapter: { id: ++captionId, text, subtitle, until: performance.now() + 7500 }, areaCard: null }),

  pushNotification: (text, area, durationMs = 6000) =>
    set((s) => ({ notifications: [...s.notifications.slice(-3), { id: ++captionId, text, area, until: performance.now() + durationMs }] })),

  setSubtitle: (subtitle) => set({ subtitle }),

  prune: (now) => {
    const s = get()
    const messages = s.messages.filter((m) => m.until > now)
    const hint = s.hint && s.hint.until > now ? s.hint : null
    const areaCard = s.areaCard && s.areaCard.until > now ? s.areaCard : null
    // O cartão de ato e os avisos de sino não "vencem" enquanto o jogador está fora do jogo
    // (documento, menu, puzzle): esperam a volta para que não passem despercebidos.
    const away = s.mode !== 'playing'
    const held = s.chapter && away ? { ...s.chapter, until: Math.max(s.chapter.until, now + 7500) } : s.chapter
    const chapter = held && held.until > now ? held : null
    const notifications = s.notifications
      .map((n) => (away ? { ...n, until: Math.max(n.until, now + 6000) } : n))
      .filter((n) => n.until > now)
    if (
      messages.length !== s.messages.length ||
      hint !== s.hint ||
      areaCard !== s.areaCard ||
      chapter !== s.chapter ||
      notifications.length !== s.notifications.length
    )
      set({ messages, hint, areaCard, chapter, notifications })
  },
}))
