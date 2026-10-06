import { useEffect, useState } from 'react'
import { audio } from '../../game/audio/audioManager'
import { useAuth } from '../../game/auth/authStore'
import { listSlots, readSlot } from '../../game/save/saveManager'
import { loadGame, startNewGame } from '../../game/session'
import { AccountPanel } from './AccountPanel'
import { SettingsPanel } from './SettingsPanel'
import { SlotList } from './SlotList'

type View = 'main' | 'new' | 'load' | 'account' | 'settings'

export function TitleScreen() {
  const [view, setView] = useState<View>('main')
  const [latest, setLatest] = useState<{ slot: number; source: 'local' | 'cloud' } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const user = useAuth((s) => s.user)

  useEffect(() => {
    let alive = true
    void listSlots().then((slots) => {
      let best: { slot: number; source: 'local' | 'cloud'; at: string } | null = null
      for (const s of slots) {
        if (!s.preferred || s.conflict) continue
        const at = s.preferred === 'local' ? s.local!.data.meta.updatedAt : s.cloud!.updatedAt
        if (!best || at > best.at) best = { slot: s.slot, source: s.preferred, at }
      }
      if (alive) setLatest(best)
    })
    return () => {
      alive = false
    }
  }, [view, user])

  const go = (v: View) => {
    audio.unlock()
    audio.play('ui')
    setView(v)
  }

  const continueGame = async () => {
    if (!latest) return
    audio.unlock()
    try {
      const save = await readSlot(latest.slot, latest.source)
      if (save) loadGame(save)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="layer title-screen">
      <div className="layer title-rain" />
      {view === 'main' && (
        <div className="title-block">
          <h1>THE HOUSE OF VALE</h1>
          <div className="subtitle">BELLWEATHER · OREGON</div>
          <div className="stack" style={{ alignItems: 'flex-start' }}>
            {latest && (
              <button className="btn primary" onClick={() => void continueGame()}>
                Continue
              </button>
            )}
            <button className="btn" onClick={() => go('new')}>
              New game
            </button>
            <button className="btn" onClick={() => go('load')}>
              Load
            </button>
            <button className="btn" onClick={() => go('settings')}>
              Settings
            </button>
            <button className="btn" onClick={() => go('account')}>
              {user ? `Account · ${user.email}` : 'Account'}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <p className="faint" style={{ marginTop: '2.4rem', fontSize: '0.85rem' }}>
            Headphones recommended. Desktop · mouse & keyboard.
          </p>
        </div>
      )}
      {view !== 'main' && (
        <div className="layer center">
          {view === 'new' && <SlotList mode="new" onBack={() => setView('main')} onPick={(slot) => startNewGame(slot)} />}
          {view === 'load' && <SlotList mode="load" onBack={() => setView('main')} onPick={(_, save) => save && loadGame(save)} />}
          {view === 'account' && <AccountPanel onBack={() => setView('main')} />}
          {view === 'settings' && <SettingsPanel onBack={() => setView('main')} />}
        </div>
      )}
    </div>
  )
}
