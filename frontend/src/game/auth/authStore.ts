import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from './supabase'

interface AuthStore {
  available: boolean
  session: Session | null
  user: User | null
  busy: boolean
  error: string | null
  notice: string | null
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
  clearMessages(): void
}

export const useAuth = create<AuthStore>()((set) => {
  const guard = async (fn: () => Promise<{ error: { message: string } | null }>, notice?: string) => {
    if (!supabase) return set({ error: 'Online accounts are not configured.' })
    set({ busy: true, error: null, notice: null })
    try {
      const { error } = await fn()
      set(error ? { error: error.message } : { notice: notice ?? null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error.' })
    } finally {
      set({ busy: false })
    }
  }

  return {
    available: supabase !== null,
    session: null,
    user: null,
    busy: false,
    error: null,
    notice: null,
    signIn: (email, password) => guard(() => supabase!.auth.signInWithPassword({ email, password })),
    signUp: (email, password) =>
      guard(() => supabase!.auth.signUp({ email, password }), 'Check your inbox to confirm the account, then sign in.'),
    signInWithGoogle: () =>
      guard(() => supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })),
    signOut: () => guard(() => supabase!.auth.signOut()),
    clearMessages: () => set({ error: null, notice: null }),
  }
})

export function initAuth(): void {
  if (!supabase) return
  void supabase.auth.getSession().then(({ data }) => {
    useAuth.setState({ session: data.session, user: data.session?.user ?? null })
  })
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.setState({ session, user: session?.user ?? null })
  })
}
