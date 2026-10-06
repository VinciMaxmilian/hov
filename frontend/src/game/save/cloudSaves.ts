import { apiUrl, supabase } from '../auth/supabase'
import { useAuth } from '../auth/authStore'
import { migrateSave, type SaveData } from '../state/saveSchema'

/**
 * Saves na nuvem. user_id nunca é enviado: o banco usa auth.uid() + RLS.
 * Escrita via função save_game (compare-and-swap em rev) — direto no Supabase ou, se VITE_API_URL
 * estiver configurado, pelo backend FastAPI (que valida o payload e chama a mesma função com o JWT do usuário).
 */

export interface CloudMeta {
  slot: number
  rev: number
  updatedAt: string
  areaLabel: string
  progressPct: number
  playtimeSec: number
}

export interface PushResult {
  rev: number
  conflict: boolean
}

export class OfflineError extends Error {}

function requireSession() {
  const session = useAuth.getState().session
  if (!supabase || !session) throw new OfflineError('not signed in')
  return session
}

export function cloudAvailable(): boolean {
  return supabase !== null && useAuth.getState().session !== null
}

export async function listCloud(): Promise<CloudMeta[]> {
  requireSession()
  const { data, error } = await supabase!
    .from('game_saves')
    .select('slot, rev, updated_at, area_label, progress_pct, playtime_sec')
    .order('slot')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    slot: r.slot,
    rev: r.rev,
    updatedAt: r.updated_at,
    areaLabel: r.area_label ?? '',
    progressPct: Number(r.progress_pct),
    playtimeSec: r.playtime_sec,
  }))
}

export async function fetchCloud(slot: number): Promise<{ data: SaveData; rev: number } | null> {
  requireSession()
  const { data, error } = await supabase!.from('game_saves').select('data, rev').eq('slot', slot).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return { data: migrateSave(data.data), rev: data.rev }
}

export async function pushCloud(save: SaveData, baseRev: number): Promise<PushResult> {
  const session = requireSession()
  if (apiUrl) {
    const res = await fetch(`${apiUrl}/saves/${save.meta.slot}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ base_rev: baseRev, data: save }),
    })
    if (!res.ok) throw new Error(`backend ${res.status}`)
    const body = (await res.json()) as { rev: number; conflict: boolean }
    return body
  }
  const { data, error } = await supabase!.rpc('save_game', {
    p_slot: save.meta.slot,
    p_schema_version: save.schemaVersion,
    p_data: save,
    p_area_label: save.meta.areaLabel.slice(0, 64),
    p_progress_pct: save.meta.progressPct,
    p_playtime_sec: Math.floor(save.meta.playtimeSec),
    p_base_rev: baseRev,
  })
  if (error) throw new Error(error.message)
  const row = (Array.isArray(data) ? data[0] : data) as { rev: number; conflict: boolean } | undefined
  if (!row) throw new Error('save_game sem retorno')
  return { rev: row.rev, conflict: row.conflict }
}

export async function deleteCloud(slot: number): Promise<void> {
  requireSession()
  const { error } = await supabase!.from('game_saves').delete().eq('slot', slot)
  if (error) throw new Error(error.message)
}

/** Analytics opcional (falhas são ignoradas: nunca afetam o jogo). */
export function trackEvent(event: string, payload: Record<string, unknown> = {}): void {
  if (!cloudAvailable()) return
  const session = useAuth.getState().session!
  if (apiUrl) {
    void fetch(`${apiUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ event, payload }),
    }).catch(() => {})
    return
  }
  void supabase!
    .from('game_events')
    .insert({ event, payload })
    .then(() => {})
}
