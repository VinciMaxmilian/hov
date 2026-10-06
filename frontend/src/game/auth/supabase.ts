import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com chave PUBLICÁVEL apenas. Sem env configurado o jogo roda offline (saves locais).
 * Nunca use service_role/secret aqui.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && key && !url.includes('YOUR-PROJECT')
    ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    : null

export const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || null

if (!supabase) console.info('[auth] Supabase não configurado: modo offline (somente saves locais).')
