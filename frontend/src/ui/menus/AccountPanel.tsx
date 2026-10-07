import { useState, type FormEvent } from 'react'
import { useAuth } from '../../game/auth/authStore'
import { useTr } from '../../game/i18n'

/** Conta (Supabase Auth): email/senha e Google OAuth (se configurado no projeto). */
export function AccountPanel({ onBack }: { onBack(): void }) {
  const { available, user, busy, error, notice, signIn, signUp, signInWithGoogle, signOut, clearMessages } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const t = useTr()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void (mode === 'in' ? signIn(email, password) : signUp(email, password))
  }

  return (
    <div className="panel stack" style={{ minWidth: 420 }}>
      <h2>{t('Account')}</h2>
      {!available && <p className="muted">{t('Online accounts are not configured for this build. Your saves stay on this device.')}</p>}
      {available && user && (
        <>
          <p>
            {t('Signed in as')} <span className="muted">{user.email}</span>
          </p>
          <p className="faint">{t('Saves sync to the cloud automatically.')}</p>
          <div className="row">
            <button className="btn small" disabled={busy} onClick={() => void signOut()}>
              {t('Sign out')}
            </button>
          </div>
        </>
      )}
      {available && !user && (
        <form className="stack" onSubmit={submit}>
          <input type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
          <div className="row">
            <button className="btn small primary" type="submit" disabled={busy}>
              {mode === 'in' ? t('Sign in') : t('Create account')}
            </button>
            <button
              className="btn small"
              type="button"
              onClick={() => {
                clearMessages()
                setMode(mode === 'in' ? 'up' : 'in')
              }}
            >
              {mode === 'in' ? t('I need an account') : t('I already have one')}
            </button>
          </div>
          <button className="btn small" type="button" disabled={busy} onClick={() => void signInWithGoogle()}>
            {t('Continue with Google')}
          </button>
        </form>
      )}
      {error && <p className="error">{t(error)}</p>}
      {notice && <p className="muted">{t(notice)}</p>}
      <div className="row">
        <button className="btn small" onClick={onBack}>
          ← {t('back')}
        </button>
      </div>
    </div>
  )
}
