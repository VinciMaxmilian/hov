import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/styles.css'

/**
 * Boot: valida conteúdo (falha cedo e visível), instala sistemas (input, controles, narrativa,
 * journal, save/sync, auth) e monta a UI.
 */
async function boot() {
  const root = createRoot(document.getElementById('root')!)
  try {
    const { content } = await import('./game/content')
    const { audio } = await import('./game/audio/audioManager')
    const { installInput } = await import('./game/player/input')
    const { installControls } = await import('./game/controls')
    const { installStoryDirector } = await import('./game/story/storyDirector')
    const { installJournalSystem } = await import('./game/journal/journalSystem')
    const { installSessionHooks } = await import('./game/session')
    const { installSaveManager } = await import('./game/save/saveManager')
    const { initAuth } = await import('./game/auth/authStore')
    const { App } = await import('./ui/App')
    const { installDeviceClass } = await import('./game/player/device')

    audio.registerSounds(content.sounds.values())
    installDeviceClass()
    installInput()
    installControls()
    installStoryDirector()
    installJournalSystem()
    installSessionHooks()
    installSaveManager()
    initAuth()

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    // Atalho de desenvolvimento: ?dev&area=library&yaw=1.57 pula o título e começa na área (slot 3).
    const params = new URLSearchParams(window.location.search)
    if (import.meta.env.DEV && params.has('dev')) {
      const { startDevSession } = await import('./game/devStart')
      startDevSession(params)
    }
  } catch (err) {
    console.error(err)
    root.render(
      <div style={{ padding: '3rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#e6dcc6' }}>
        <h2>The house refuses to open.</h2>
        {err instanceof Error ? err.message : String(err)}
      </div>,
    )
  }
}

void boot()
