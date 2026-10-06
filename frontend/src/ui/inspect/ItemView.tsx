import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import type { Item } from '../../game/content/schemas'
import { models } from '../../game/world/props/smallItems'

/** Inspeção 3D de itens: modelo procedural girável (ou imagem gerada, quando houver). */
export function ItemView({ item }: { item: Item }) {
  const modelKey = item.model?.startsWith('proc:') ? item.model.slice(5) : null
  const Model = modelKey ? models[modelKey] : undefined
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <>
      <div className="inspect-stage">
        {Model ? (
          <Canvas camera={{ position: [0, 0.12, 0.36], fov: 35, near: 0.01, far: 10 }} dpr={[1, 2]} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.25} color="#3d5a6c" />
            <pointLight position={[0.3, 0.4, 0.4]} intensity={2.4} color="#ffb45e" decay={1} />
            <pointLight position={[-0.4, 0.1, -0.3]} intensity={0.8} color="#7da0c0" decay={1} />
            <group position={[0, -0.04, 0]}>
              <Model />
            </group>
            <OrbitControls enablePan={false} minDistance={0.12} maxDistance={0.8} autoRotate autoRotateSpeed={0.6} />
          </Canvas>
        ) : item.image && !imgFailed ? (
          <img src={item.image} alt="" style={{ maxWidth: '80%', maxHeight: '80%' }} onError={() => setImgFailed(true)} draggable={false} />
        ) : (
          <div className="muted">[ {item.name} ]</div>
        )}
      </div>
      <aside className="inspect-side">
        <div className="small-caps faint">{item.category.replace('_', ' ').toLowerCase()}</div>
        <h2>{item.name}</h2>
        <p className="muted">{item.description}</p>
        {item.inspectNote && <p className="found-note">{item.inspectNote}</p>}
        <div className="controls">
          drag — rotate · wheel — zoom
          <br />
          <span className="key">E</span> / <span className="key">Esc</span> put away
        </div>
      </aside>
    </>
  )
}
