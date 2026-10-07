import { content } from '../../game/content'
import { requestPointerLock } from '../../game/player/input'
import { useUi } from '../../game/state/uiStore'
import { useTr } from '../../game/i18n'
import { DocumentView } from './DocumentView'
import { lazy, Suspense } from 'react'

// Visualizador 3D carrega R3F sob demanda.
const ItemView = lazy(() => import('./ItemView').then((m) => ({ default: m.ItemView })))

export function InspectOverlay() {
  const target = useUi((s) => s.inspect)
  const t = useTr()
  if (!target) return null
  const close = () => {
    useUi.getState().closeInspect()
    if (useUi.getState().mode === 'playing') void requestPointerLock()
  }
  const doc = target.kind === 'document' ? content.documents.get(target.id) : undefined
  const item = target.kind === 'item' ? content.items.get(target.id) : undefined
  return (
    <div className="layer inspect" onContextMenu={(e) => e.preventDefault()}>
      {doc && <DocumentView key={doc.id} doc={doc} />}
      {item && (
        <Suspense fallback={null}>
          <ItemView key={item.id} item={item} />
        </Suspense>
      )}
      <button className="btn small" style={{ position: 'absolute', right: '2rem', top: '1.4rem' }} onClick={close}>
        {t('put down')} ✕
      </button>
    </div>
  )
}
