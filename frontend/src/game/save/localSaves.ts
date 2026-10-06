import { createStore, del, get, set } from 'idb-keyval'
import { migrateSave, type SaveData } from '../state/saveSchema'

/**
 * Saves locais (IndexedDB). Sempre funcionam, com ou sem conta/rede.
 * baseRev = última revisão da nuvem que este dispositivo conhece (0 = nunca sincronizado).
 * dirty = há alterações locais ainda não enviadas.
 */
export interface LocalRecord {
  data: SaveData
  baseRev: number
  dirty: boolean
}

const store = typeof indexedDB !== 'undefined' ? createStore('house-of-vale', 'saves') : null
const key = (slot: number) => `slot:${slot}`

export async function readLocal(slot: number): Promise<LocalRecord | null> {
  if (!store) return null
  const raw = await get<{ data: unknown; baseRev: number; dirty: boolean }>(key(slot), store)
  if (!raw) return null
  try {
    return { data: migrateSave(raw.data), baseRev: raw.baseRev ?? 0, dirty: raw.dirty ?? true }
  } catch (err) {
    console.error(`[save] slot ${slot} local inválido`, err)
    return null
  }
}

export async function writeLocal(slot: number, record: LocalRecord): Promise<void> {
  if (!store) return
  await set(key(slot), record, store)
}

export async function deleteLocal(slot: number): Promise<void> {
  if (!store) return
  await del(key(slot), store)
}
