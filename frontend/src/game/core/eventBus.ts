import type { FlagValue, Vec3 } from './types'

/** Catálogo tipado de eventos. Sistemas reagem a eventos sem se importar entre si. */
export interface GameEvents {
  GAME_STARTED: { slot: number; isNew: boolean }
  ITEM_PICKED: { item: string }
  ITEM_REMOVED: { item: string }
  ITEM_USED: { item: string; target: string }
  DOCUMENT_DISCOVERED: { document: string }
  DOCUMENT_VIEWED: { document: string; page: number }
  PUZZLE_SOLVED: { puzzle: string }
  PUZZLE_FAILED: { puzzle: string }
  AREA_ENTERED: { area: string; previous: string | null }
  DOOR_UNLOCKED: { door: string }
  WORLD_STATE_CHANGED: { key: string; value: string; previous: string | undefined }
  STORY_FLAG_CHANGED: { key: string; value: FlagValue }
  TIME_CHANGED: { day: number; minutes: number }
  INTERACTED: { target: string }
  JOURNAL_UPDATED: { entry: string }
  SOUND_REQUEST: { sound: string; position?: Vec3; volume?: number }
  SLICE_COMPLETE: Record<string, never>
}

export type GameEventType = keyof GameEvents
export type AnyGameEvent = { [K in GameEventType]: { type: K; payload: GameEvents[K] } }[GameEventType]

type Handler<K extends GameEventType> = (payload: GameEvents[K]) => void
type AnyHandler = (event: AnyGameEvent) => void

export class EventBus {
  private handlers = new Map<GameEventType, Set<(payload: never) => void>>()
  private anyHandlers = new Set<AnyHandler>()
  private depth = 0

  on<K extends GameEventType>(type: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(type)
    if (!set) this.handlers.set(type, (set = new Set()))
    set.add(handler as (payload: never) => void)
    return () => set.delete(handler as (payload: never) => void)
  }

  onAny(handler: AnyHandler): () => void {
    this.anyHandlers.add(handler)
    return () => this.anyHandlers.delete(handler)
  }

  emit<K extends GameEventType>(type: K, payload: GameEvents[K]): void {
    // Proteção contra cascatas infinitas (trigger que emite o evento que o disparou).
    if (this.depth > 32) {
      console.error(`[eventBus] cascata de eventos excedeu o limite em ${type}`)
      return
    }
    this.depth++
    try {
      this.handlers.get(type)?.forEach((h) => safeCall(() => (h as Handler<K>)(payload), type))
      const event = { type, payload } as AnyGameEvent
      this.anyHandlers.forEach((h) => safeCall(() => h(event), type))
    } finally {
      this.depth--
    }
  }

  clear(): void {
    this.handlers.clear()
    this.anyHandlers.clear()
  }
}

function safeCall(fn: () => void, type: string) {
  try {
    fn()
  } catch (err) {
    console.error(`[eventBus] handler de ${type} falhou`, err)
  }
}

export const bus = new EventBus()
