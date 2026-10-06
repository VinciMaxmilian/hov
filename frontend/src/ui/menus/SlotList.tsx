import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../game/auth/authStore'
import { keepLocal, listSlots, readSlot, type SlotInfo } from '../../game/save/saveManager'
import type { SaveData } from '../../game/state/saveSchema'
import { formatPlaytime } from '../format'

interface Props {
  mode: 'load' | 'new'
  onPick(slot: number, save: SaveData | null): void
  onBack(): void
}

/** Lista de slots (local + nuvem), com resolução explícita de conflitos. */
export function SlotList({ mode, onPick, onBack }: Props) {
  const [slots, setSlots] = useState<SlotInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<number | null>(null)
  const session = useAuth((s) => s.session)

  const refresh = useCallback(() => {
    setSlots(null)
    listSlots()
      .then(setSlots)
      .catch((e) => setError(String(e)))
  }, [])
  useEffect(refresh, [refresh, session])

  const load = async (info: SlotInfo, source: 'local' | 'cloud') => {
    try {
      const save = await readSlot(info.slot, source)
      if (save) onPick(info.slot, save)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="panel stack" style={{ minWidth: 560 }}>
      <h2>{mode === 'new' ? 'Choose a slot' : 'Load'}</h2>
      {!session && <p className="faint">Playing offline — saves stay on this device. Sign in to keep them in the cloud.</p>}
      {error && <p className="error">{error}</p>}
      {!slots && <p className="muted">Reading the ledgers…</p>}
      {slots?.map((info) => {
        const meta = info.preferred === 'cloud' && info.cloud ? info.cloud : info.local?.data.meta
        const empty = !info.local && !info.cloud
        const disabled = mode === 'load' && empty
        return (
          <div key={info.slot}>
            <button
              className="slot"
              disabled={disabled}
              onClick={() => {
                if (mode === 'new') {
                  if (!empty && confirm !== info.slot) return setConfirm(info.slot)
                  return onPick(info.slot, null)
                }
                if (!info.conflict && info.preferred) void load(info, info.preferred)
              }}
            >
              <span className="slot-n">{info.slot}</span>
              <span>
                {empty ? (
                  <span className="faint">— empty —</span>
                ) : (
                  <>
                    <div>{meta?.areaLabel}</div>
                    <div className="meta">
                      {formatPlaytime(meta?.playtimeSec ?? 0)} · {meta?.progressPct ?? 0}%
                    </div>
                  </>
                )}
              </span>
              <span className="row">
                {info.local && <span className="badge">device</span>}
                {info.cloud && <span className="badge">cloud</span>}
                {info.conflict && <span className="badge warn">conflict</span>}
              </span>
            </button>
            {mode === 'new' && confirm === info.slot && <p className="error" style={{ margin: '0 0 0.6rem' }}>Click again to overwrite this save.</p>}
            {mode === 'load' && info.conflict && info.local && info.cloud && (
              <div className="row" style={{ margin: '-0.2rem 0 0.8rem 5rem' }}>
                <span className="faint">The cloud copy changed on another device.</span>
                <button className="btn small" onClick={() => void load(info, 'local')}>
                  This device ({formatPlaytime(info.local.data.meta.playtimeSec)})
                </button>
                <button className="btn small" onClick={() => void load(info, 'cloud')}>
                  Cloud ({formatPlaytime(info.cloud.playtimeSec)})
                </button>
                <button className="btn small" onClick={() => void keepLocal(info.slot).then(refresh)}>
                  Keep device copy & upload
                </button>
              </div>
            )}
          </div>
        )
      })}
      <div className="row">
        <button className="btn small" onClick={onBack}>
          ← back
        </button>
      </div>
    </div>
  )
}
