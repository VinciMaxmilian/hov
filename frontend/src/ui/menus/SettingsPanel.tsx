import { useSettings } from '../../game/state/settingsStore'
import { useDevice, type TouchPreference } from '../../game/player/device'
import { LANGUAGES, useLang, useTr, type Lang } from '../../game/i18n'

export function SettingsPanel({ onBack }: { onBack(): void }) {
  const s = useSettings()
  const device = useDevice()
  const t = useTr()
  const { lang, setLang } = useLang()
  return (
    <div className="panel stack" style={{ minWidth: 420 }}>
      <h2>{t('Settings')}</h2>
      <label className="row">
        <span style={{ width: 160 }}>{t('Language')}</span>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label className="row">
        <span style={{ width: 160 }}>{t('Look sensitivity')}</span>
        <input type="range" min={0.2} max={3} step={0.05} value={s.mouseSensitivity} onChange={(e) => s.update({ mouseSensitivity: Number(e.target.value) })} />
        <span className="faint">{s.mouseSensitivity.toFixed(2)}</span>
      </label>
      <label className="row">
        <span style={{ width: 160 }}>{t('Volume')}</span>
        <input type="range" min={0} max={1} step={0.01} value={s.masterVolume} onChange={(e) => s.update({ masterVolume: Number(e.target.value) })} />
        <span className="faint">{Math.round(s.masterVolume * 100)}</span>
      </label>
      <label className="row">
        <input type="checkbox" checked={s.invertY} onChange={(e) => s.update({ invertY: e.target.checked })} /> {t('Invert vertical look')}
      </label>
      <label className="row">
        <input type="checkbox" checked={s.subtitles} onChange={(e) => s.update({ subtitles: e.target.checked })} /> {t('Subtitles')}
      </label>
      <label className="row">
        <span style={{ width: 160 }}>{t('Subtitle size')}</span>
        <select value={s.subtitleSize} onChange={(e) => s.update({ subtitleSize: e.target.value as typeof s.subtitleSize })}>
          <option value="small">{t('Small')}</option>
          <option value="medium">{t('Medium')}</option>
          <option value="large">{t('Large')}</option>
        </select>
      </label>
      <label className="row">
        <input type="checkbox" checked={s.reduceHeadBob} onChange={(e) => s.update({ reduceHeadBob: e.target.checked })} /> {t('Reduce head bob')}
      </label>
      <label className="row">
        <span style={{ width: 160 }}>{t('Graphics')}</span>
        <select value={s.graphicsQuality} onChange={(e) => s.update({ graphicsQuality: e.target.value as typeof s.graphicsQuality })}>
          <option value="high">{t('High (shadows, sharper image)')}</option>
          <option value="performance">{t('Performance (no shadows, lower resolution)')}</option>
        </select>
      </label>
      <label className="row">
        <span style={{ width: 160 }}>{t('Touch controls')}</span>
        <select value={device.preference} onChange={(e) => device.setPreference(e.target.value as TouchPreference)}>
          <option value="auto">
            {t('Auto')} ({device.preference === 'auto' && device.touch ? t('on') : device.preference === 'auto' ? t('off') : '—'})
          </option>
          <option value="on">{t('On')}</option>
          <option value="off">{t('Off (mouse & keyboard)')}</option>
        </select>
      </label>
      <div className="row">
        <button className="btn small" onClick={onBack}>
          ← {t('back')}
        </button>
      </div>
    </div>
  )
}
