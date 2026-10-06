import { audio, type LoopHandle } from '../audio/audioManager'
import { content } from '../content'
import { useGame } from '../state/gameStore'
import { useSettings } from '../state/settingsStore'
import { useUi } from '../state/uiStore'

/**
 * Reprodução de fitas (DOC07 etc.). Com `audio.src` toca o arquivo real (voz gerada depois);
 * sem ele, toca chiado de fita + legendas temporizadas. Legendas sempre seguem o roteiro do JSON.
 */
let current: { stop(): void } | null = null

export function isRecordingPlaying(): boolean {
  return current !== null
}

export function stopRecording(): void {
  current?.stop()
  current = null
}

export function playRecording(documentId: string): void {
  const doc = content.documents.get(documentId)
  if (!doc?.audio) return
  stopRecording()
  useGame.getState().discoverDocument(documentId)

  const timers: number[] = []
  let hiss: LoopHandle | null = null
  let element: HTMLAudioElement | null = null
  const ui = useUi.getState()

  audio.play('tape_button')

  const finish = () => {
    timers.forEach((t) => window.clearTimeout(t))
    hiss?.stop()
    element?.pause()
    useUi.getState().setSubtitle(null)
    current = null
  }

  const startSubtitles = () => {
    doc.audio!.lines.forEach((line, i) => {
      timers.push(
        window.setTimeout(() => {
          if (useSettings.getState().subtitles) ui.setSubtitle({ speaker: line.speaker, text: line.text })
        }, line.t * 1000),
      )
      const next = doc.audio!.lines[i + 1]
      const clearAt = next ? next.t : doc.audio!.duration
      timers.push(window.setTimeout(() => ui.setSubtitle(null), clearAt * 1000 - 50))
    })
    timers.push(
      window.setTimeout(() => {
        audio.play('tape_button')
        finish()
      }, doc.audio!.duration * 1000),
    )
  }

  let fellBack = false
  const fallback = () => {
    if (fellBack) return
    fellBack = true
    hiss = audio.startLoop('tape_hiss')
    startSubtitles()
  }

  if (doc.audio.src) {
    element = new Audio(doc.audio.src)
    element.volume = useSettings.getState().masterVolume
    element.addEventListener('error', () => {
      element = null
      fallback()
    }, { once: true })
    element
      .play()
      .then(startSubtitles)
      .catch(() => {
        element = null
        fallback()
      })
  } else {
    fallback()
  }

  current = { stop: finish }
}
