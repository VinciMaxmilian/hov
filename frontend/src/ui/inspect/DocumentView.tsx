import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { content } from '../../game/content'
import type { GameDocument } from '../../game/content/schemas'
import { bus } from '../../game/core/eventBus'
import { playRecording } from '../../game/documents/recordings'
import { audio } from '../../game/audio/audioManager'
import { run } from '../../game/rules/effects'
import { useGame } from '../../game/state/gameStore'

type Page = GameDocument['pages'][number]

const SIZES: Record<GameDocument['kind'], [number, number]> = {
  letter: [500, 680],
  note: [380, 270],
  card: [520, 320],
  newspaper: [620, 800],
  report: [540, 720],
  photograph: [620, 470],
  record: [520, 660],
  recording: [440, 280],
}

/** Imagem gerada (Higgsfield) com fallback para placeholder descritivo se o arquivo não existir. */
function ArtOrPlaceholder({ src, placeholder }: { src?: string; placeholder?: string }) {
  const [failed, setFailed] = useState(!src)
  useEffect(() => setFailed(!src), [src])
  if (!failed && src) return <img src={src} alt="" onError={() => setFailed(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
  return <div className="placeholder-art">{placeholder ? `[ ${placeholder} ]` : ''}</div>
}

function PageFace({ doc, page, side, onDetail }: { doc: GameDocument; page: Page; side: 'front' | 'back'; onDetail: (id: string) => void }) {
  const index = doc.pages.indexOf(page)
  const details = doc.details.filter((d) => d.page === index)
  const spots = details.map((d) => (
    <div
      key={d.id}
      className="detail-spot"
      style={{ left: `${d.rect[0] * 100}%`, top: `${d.rect[1] * 100}%`, width: `${d.rect[2] * 100}%`, height: `${d.rect[3] * 100}%` }}
      onPointerUp={(e) => {
        e.stopPropagation()
        onDetail(d.id)
      }}
    />
  ))

  if (page.style === 'photo') {
    return (
      <div className={`face ${side} photo`}>
        <div className="print">
          <ArtOrPlaceholder src={page.image} placeholder={page.placeholder} />
          {page.cutout && (
            <div
              className="cutout"
              style={{ left: `${page.cutout[0] * 100}%`, top: `${page.cutout[1] * 100}%`, width: `${page.cutout[2] * 100}%`, height: `${page.cutout[3] * 100}%` }}
            />
          )}
        </div>
        {page.heading && <div className="caption">{page.heading}</div>}
        {spots}
      </div>
    )
  }

  return (
    <div className={`face ${side} paper style-${page.style} ${doc.kind === 'photograph' ? 'photo-back' : ''}`}>
      {page.image && (
        <div style={{ position: 'relative', height: '32%', marginBottom: '1em' }}>
          <ArtOrPlaceholder src={page.image} placeholder={page.placeholder} />
        </div>
      )}
      {page.heading && <div className="doc-heading">{page.heading}</div>}
      <div className="doc-text">{page.text}</div>
      {page.margin && <div className="margin-note">{page.margin}</div>}
      {spots}
    </div>
  )
}

/** Documento inspecionável: frente/verso, rotação por arrasto, zoom na roda, detalhes clicáveis (não destacados). */
export function DocumentView({ doc }: { doc: GameDocument }) {
  const front = doc.pages.find((p) => p.side === 'front') ?? doc.pages[0]
  const back = doc.pages.find((p) => p.side === 'back')
  const [flipped, setFlipped] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [transcript, setTranscript] = useState(false)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const flags = useGame((s) => s.flags)
  const viewed = useRef(new Set<number>())

  const current = flipped && back ? back : front

  // Ações "ao ver a página" (ex.: verso da foto → flag).
  useEffect(() => {
    const index = doc.pages.indexOf(current)
    if (viewed.current.has(index)) return
    viewed.current.add(index)
    // espera a animação de virar antes de "notar"
    const t = window.setTimeout(() => {
      run(current.onView)
      bus.emit('DOCUMENT_VIEWED', { document: doc.id, page: index })
    }, flipped ? 500 : 0)
    return () => window.clearTimeout(t)
  }, [current, doc, flipped])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && back) {
        setFlipped((f) => !f)
        audio.play('paper')
      }
      if (e.code === 'KeyT') setTranscript((t) => !t)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [back])

  const onDetail = (id: string) => {
    const det = doc.details.find((d) => d.id === id)
    if (!det) return
    const key = `detail:${det.id}`
    if (!useGame.getState().flags[key]) {
      useGame.getState().setFlag(key, true)
      run(det.onFound)
    }
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, tx: tilt.x, ty: tilt.y }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    setTilt({ x: clamp(drag.current.tx - dy * 0.15, -35, 35), y: clamp(drag.current.ty + dx * 0.15, -40, 40) })
  }

  const [w, h] = SIZES[doc.kind]
  const found = doc.details.filter((d) => flags[`detail:${d.id}`])
  const textOf = (p: Page) => [p.heading, p.text, p.margin && `(in the margin) ${p.margin}`].filter(Boolean).join('\n\n')

  return (
    <>
      <div
        className="inspect-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onWheel={(e) => setZoom((z) => clamp(z - e.deltaY * 0.0012, 0.7, 2.6))}
      >
        <div
          className="sheet"
          style={{
            width: w,
            height: h,
            fontSize: Math.round(w / 26),
            transform: `scale(${zoom}) rotateX(${tilt.x}deg) rotateY(${tilt.y + (flipped ? 180 : 0)}deg)`,
          }}
        >
          <PageFace doc={doc} page={front} side="front" onDetail={onDetail} />
          {back ? (
            <PageFace doc={doc} page={back} side="back" onDetail={onDetail} />
          ) : (
            <div className="face back paper" />
          )}
        </div>
      </div>
      <aside className="inspect-side">
        <div className="small-caps faint">{doc.kind}</div>
        <h2>{doc.title}</h2>
        {(doc.date || doc.author) && <div className="muted">{[doc.author, doc.date].filter(Boolean).join(' · ')}</div>}
        {doc.audio && (
          <button className="btn small primary" onClick={() => playRecording(doc.id)}>
            ▶ Play recording
          </button>
        )}
        {found.map((d) => (
          <div key={d.id} className="found-note">
            {d.note}
          </div>
        ))}
        {transcript && <div className="transcript">{textOf(current)}</div>}
        <div className="controls">
          drag — tilt · wheel — zoom
          <br />
          {back && (
            <>
              <span className="key">F</span> turn over
              <br />
            </>
          )}
          <span className="key">T</span> {transcript ? 'hide' : 'show'} transcript
          <br />
          <span className="key">E</span> / <span className="key">Esc</span> put down
        </div>
      </aside>
    </>
  )
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function documentById(id: string) {
  return content.documents.get(id)
}
