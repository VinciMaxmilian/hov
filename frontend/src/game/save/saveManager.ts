import { create } from 'zustand'
import { useAuth } from '../auth/authStore'
import { content } from '../content'
import { playerRuntime } from '../player/playerRuntime'
import { evaluate } from '../rules/evaluate'
import { snapshotState, useGame } from '../state/gameStore'
import { computeProgress } from '../state/newGame'
import { SAVE_SCHEMA_VERSION, type SaveData } from '../state/saveSchema'
import { currentSettings } from '../state/settingsStore'
import { cloudAvailable, fetchCloud, listCloud, OfflineError, pushCloud, type CloudMeta } from './cloudSaves'
import { readLocal, writeLocal, type LocalRecord } from './localSaves'

/**
 * Estratégia: save LOCAL primeiro (instantâneo, offline), depois sincronização em segundo plano.
 * Conflito (nuvem mudou desde a última sincronização deste dispositivo) → o jogador escolhe no menu Load.
 */

export const CONTENT_VERSION = 'slice-0.1'
export const SLOTS = [1, 2, 3] as const

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'syncing' | 'synced' | 'offline' | 'conflict' | 'error'

interface SaveStatusStore {
  status: SyncStatus
  lastSavedAt: number | null
  conflicts: number[]
}

export const useSaveStatus = create<SaveStatusStore>()(() => ({ status: 'idle', lastSavedAt: null, conflicts: [] }))

const setStatus = (status: SyncStatus) => useSaveStatus.setState({ status })

export function progressOf(state = useGame.getState()): number {
  return computeProgress(content, (c) => evaluate(c, state))
}

export function buildSave(): SaveData {
  const state = snapshotState()
  state.player = {
    area: state.player.area,
    position: [...playerRuntime.position],
    yaw: playerRuntime.yaw,
    pitch: playerRuntime.pitch,
  }
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    ...state,
    meta: {
      slot: useGame.getState().slot,
      areaLabel: content.areas.get(state.player.area)?.name ?? state.player.area,
      progressPct: progressOf(),
      playtimeSec: Math.floor(state.playtimeSec),
      updatedAt: new Date().toISOString(),
      contentVersion: CONTENT_VERSION,
    },
    settings: currentSettings(),
  }
}

// ------------------------------------------------------------------ escrita

let debounce: number | null = null
let enabled = false

/** Liga/desliga autosave (desligado no menu principal e durante a abertura). */
export function setAutosaveEnabled(on: boolean): void {
  enabled = on
}

/** Autosave após eventos-chave (debounce para agrupar cascatas de eventos). */
export function requestSave(_reason: 'event' | 'interval' | 'manual' = 'event'): void {
  if (!enabled) return
  if (debounce) window.clearTimeout(debounce)
  debounce = window.setTimeout(() => {
    debounce = null
    void saveNow()
  }, 1200)
}

export async function saveNow(): Promise<void> {
  const save = buildSave()
  const slot = save.meta.slot
  setStatus('saving')
  try {
    const prev = await readLocal(slot)
    await writeLocal(slot, { data: save, baseRev: prev?.baseRev ?? 0, dirty: true })
    useSaveStatus.setState({ status: 'saved', lastSavedAt: Date.now() })
  } catch (err) {
    console.error('[save] falha ao salvar localmente', err)
    setStatus('error')
    return
  }
  scheduleSync(slot, 0)
}

// ------------------------------------------------------------------ sincronização

const retry = new Map<number, { timer: number; attempt: number }>()

function scheduleSync(slot: number, attempt: number) {
  const existing = retry.get(slot)
  if (existing) window.clearTimeout(existing.timer)
  const delay = attempt === 0 ? 300 : Math.min(60000, 2000 * 2 ** (attempt - 1))
  const timer = window.setTimeout(() => void syncSlot(slot, attempt), delay)
  retry.set(slot, { timer, attempt })
}

async function syncSlot(slot: number, attempt: number): Promise<void> {
  retry.delete(slot)
  if (!cloudAvailable()) {
    setStatus(useAuth.getState().session ? 'offline' : 'saved')
    return
  }
  const record = await readLocal(slot)
  if (!record || !record.dirty) return
  setStatus('syncing')
  try {
    const result = await pushCloud(record.data, record.baseRev)
    if (result.conflict) {
      markConflict(slot, true)
      setStatus('conflict')
      return
    }
    // Só limpa dirty se ninguém salvou de novo durante o envio.
    const latest = await readLocal(slot)
    const unchanged = latest?.data.meta.updatedAt === record.data.meta.updatedAt
    await writeLocal(slot, { ...(latest ?? record), baseRev: result.rev, dirty: !unchanged })
    markConflict(slot, false)
    setStatus('synced')
    if (!unchanged) scheduleSync(slot, 0)
  } catch (err) {
    if (!(err instanceof OfflineError)) console.warn(`[save] sync do slot ${slot} falhou (tentativa ${attempt + 1})`, err)
    setStatus('offline')
    scheduleSync(slot, attempt + 1)
  }
}

function markConflict(slot: number, on: boolean) {
  const conflicts = new Set(useSaveStatus.getState().conflicts)
  if (on) conflicts.add(slot)
  else conflicts.delete(slot)
  useSaveStatus.setState({ conflicts: [...conflicts] })
}

/** Ao ficar online ou logar: tenta sincronizar tudo que estiver pendente. */
export function syncAll(): void {
  for (const slot of SLOTS) scheduleSync(slot, 0)
}

// ------------------------------------------------------------------ leitura / listagem

export interface SlotInfo {
  slot: number
  local: LocalRecord | null
  cloud: CloudMeta | null
  /** Qual versão o jogo vai carregar por padrão. */
  preferred: 'local' | 'cloud' | null
  conflict: boolean
}

export async function listSlots(): Promise<SlotInfo[]> {
  const locals = await Promise.all(SLOTS.map((s) => readLocal(s)))
  let clouds: CloudMeta[] = []
  if (cloudAvailable()) {
    try {
      clouds = await listCloud()
    } catch (err) {
      console.warn('[save] não foi possível listar saves da nuvem', err)
    }
  }
  const conflicts = new Set(useSaveStatus.getState().conflicts)
  return SLOTS.map((slot, i) => {
    const local = locals[i]
    const cloud = clouds.find((c) => c.slot === slot) ?? null
    // Nuvem à frente do que este dispositivo conhece + alterações locais pendentes = conflito real.
    const conflict = conflicts.has(slot) || Boolean(local && cloud && cloud.rev !== local.baseRev && local.dirty)
    let preferred: SlotInfo['preferred'] = null
    if (local && cloud) preferred = cloud.rev > local.baseRev && !local.dirty ? 'cloud' : 'local'
    else if (local) preferred = 'local'
    else if (cloud) preferred = 'cloud'
    return { slot, local, cloud, preferred, conflict }
  })
}

/** Carrega um slot; `source` resolve conflitos explicitamente. */
export async function readSlot(slot: number, source: 'local' | 'cloud'): Promise<SaveData | null> {
  if (source === 'local') return (await readLocal(slot))?.data ?? null
  const remote = await fetchCloud(slot)
  if (!remote) return null
  // Adota a versão da nuvem como base: o próximo save local continua dela sem conflito.
  await writeLocal(slot, { data: remote.data, baseRev: remote.rev, dirty: false })
  markConflict(slot, false)
  return remote.data
}

/** "Manter a versão deste dispositivo": rebase sobre a revisão atual da nuvem e reenviar. */
export async function keepLocal(slot: number): Promise<void> {
  const local = await readLocal(slot)
  if (!local) return
  const cloud = (await listCloud()).find((c) => c.slot === slot)
  await writeLocal(slot, { ...local, baseRev: cloud?.rev ?? 0, dirty: true })
  markConflict(slot, false)
  scheduleSync(slot, 0)
}

let intervalId: number | null = null

export function installSaveManager(): void {
  window.addEventListener('online', syncAll)
  useAuth.subscribe((s, prev) => {
    if (s.session && !prev.session) syncAll()
  })
  if (intervalId === null) intervalId = window.setInterval(() => requestSave('interval'), 60000)
}
