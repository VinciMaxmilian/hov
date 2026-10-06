import { useSettings } from '../../game/state/settingsStore'

export function SettingsPanel({ onBack }: { onBack(): void }) {
  const s = useSettings()
  return (
    <div className="panel stack" style={{ minWidth: 420 }}>
      <h2>Settings</h2>
      <label className="row">
        <span style={{ width: 160 }}>Mouse sensitivity</span>
        <input type="range" min={0.2} max={3} step={0.05} value={s.mouseSensitivity} onChange={(e) => s.update({ mouseSensitivity: Number(e.target.value) })} />
        <span className="faint">{s.mouseSensitivity.toFixed(2)}</span>
      </label>
      <label className="row">
        <span style={{ width: 160 }}>Volume</span>
        <input type="range" min={0} max={1} step={0.01} value={s.masterVolume} onChange={(e) => s.update({ masterVolume: Number(e.target.value) })} />
        <span className="faint">{Math.round(s.masterVolume * 100)}</span>
      </label>
      <label className="row">
        <input type="checkbox" checked={s.invertY} onChange={(e) => s.update({ invertY: e.target.checked })} /> Invert vertical look
      </label>
      <label className="row">
        <input type="checkbox" checked={s.subtitles} onChange={(e) => s.update({ subtitles: e.target.checked })} /> Subtitles
      </label>
      <div className="row">
        <button className="btn small" onClick={onBack}>
          ← back
        </button>
      </div>
    </div>
  )
}
