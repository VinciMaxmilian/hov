import { create } from 'zustand'
import { defaultSettings, settingsSchema, type Settings } from './saveSchema'

const KEY = 'hov:settings'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return settingsSchema.parse(JSON.parse(raw))
  } catch {
    /* configurações corrompidas ou storage bloqueado: usa padrão */
  }
  return defaultSettings
}

interface SettingsStore extends Settings {
  update(patch: Partial<Settings>): void
}

export const useSettings = create<SettingsStore>()((set) => ({
  ...loadSettings(),
  update: (patch) => {
    set(patch)
    try {
      localStorage.setItem(KEY, JSON.stringify(currentSettings()))
    } catch {
      /* sem storage: mantém só em memória */
    }
  },
}))

export function currentSettings(): Settings {
  const { mouseSensitivity, invertY, masterVolume, subtitles, subtitleSize, reduceHeadBob, graphicsQuality } = useSettings.getState()
  return { mouseSensitivity, invertY, masterVolume, subtitles, subtitleSize, reduceHeadBob, graphicsQuality }
}
