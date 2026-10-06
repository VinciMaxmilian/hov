import { useState } from 'react'
import { resumePlay } from '../../game/controls'
import { saveNow, useSaveStatus } from '../../game/save/saveManager'
import { loadGame, returnToTitle } from '../../game/session'
import { AccountPanel } from './AccountPanel'
import { SettingsPanel } from './SettingsPanel'
import { SlotList } from './SlotList'

export function PauseMenu() {
  const [view, setView] = useState<'main' | 'load' | 'settings' | 'account'>('main')
  const status = useSaveStatus((s) => s.status)
  return (
    <div className="layer center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      {view === 'main' && (
        <div className="panel stack" style={{ minWidth: 320, alignItems: 'flex-start' }}>
          <h2>Paused</h2>
          <button className="btn primary" onClick={resumePlay}>
            Resume
          </button>
          <button className="btn" onClick={() => void saveNow()}>
            Save now <span className="faint" style={{ fontSize: '0.8rem' }}>{status === 'saving' || status === 'syncing' ? '…' : ''}</span>
          </button>
          <button className="btn" onClick={() => setView('load')}>
            Load
          </button>
          <button className="btn" onClick={() => setView('settings')}>
            Settings
          </button>
          <button className="btn" onClick={() => setView('account')}>
            Account
          </button>
          <button className="btn" onClick={returnToTitle}>
            Quit to title
          </button>
        </div>
      )}
      {view === 'load' && <SlotList mode="load" onBack={() => setView('main')} onPick={(_, save) => save && loadGame(save)} />}
      {view === 'settings' && <SettingsPanel onBack={() => setView('main')} />}
      {view === 'account' && <AccountPanel onBack={() => setView('main')} />}
    </div>
  )
}
