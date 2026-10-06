import { useState, type FormEvent } from 'react'
import { useAuth } from '../../game/auth/authStore'

/** Conta (Supabase Auth): email/senha e Google OAuth (se configurado no projeto). */
export function AccountPanel({ onBack }: { onBack(): void }) {
  const { available, user, busy, error, notice, signIn, signUp, signInWithGoogle, signOut, clearMessages } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'in' | 'up'>('in')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void (mode === 'in' ? signIn(email, password) : signUp(email, password))
  }

  return (
    <div className="panel stack" style={{ minWidth: 420 }}>
      <h2>Account</h2>
      {!available && <p className="muted">Online accounts are not configured for this build. Your saves stay on this device.</p>}
      {available && user && (
        <>
          <p>
            Signed in as <span className="muted">{user.email}</span>
          </p>
          <p className="faint">Saves sync to the cloud automatically.</p>
          <div className="row">
            <button className="btn small" disabled={busy} onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </>
      )}
      {available && !user && (
        <form className="stack" onSubmit={submit}>
          <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
          <div className="row">
            <button className="btn small primary" type="submit" disabled={busy}>
              {mode === 'in' ? 'Sign in' : 'Create account'}
            </button>
            <button
              className="btn small"
              type="button"
              onClick={() => {
                clearMessages()
                setMode(mode === 'in' ? 'up' : 'in')
              }}
            >
              {mode === 'in' ? 'I need an account' : 'I already have one'}
            </button>
          </div>
          <button className="btn small" type="button" disabled={busy} onClick={() => void signInWithGoogle()}>
            Continue with Google
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      {notice && <p className="muted">{notice}</p>}
      <div className="row">
        <button className="btn small" onClick={onBack}>
          ← back
        </button>
      </div>
    </div>
  )
}
