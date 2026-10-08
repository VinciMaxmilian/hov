import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { content } from './content'
import { GameLoop } from './core/GameLoop'
import { InteractionProbe } from './interaction/InteractionProbe'
import { requestPointerLock, setPointerLockTarget } from './player/input'
import { LampRig } from './player/Lamp'
import { Player } from './player/Player'
import { useGame } from './state/gameStore'
import { useUi } from './state/uiStore'
import { isTouch } from './player/device'
import { AreaRenderer } from './world/AreaRenderer'
import { mountedAreas } from './world/areas'
import { Environment } from './world/Environment'
import { EstateView } from './world/EstateView'

function WorldAreas() {
  const areaId = useGame((s) => s.player.area)
  const ids = useMemo(() => mountedAreas(areaId), [areaId])
  return (
    <>
      {ids.map((id) => (
        <AreaRenderer key={id} area={content.areas.get(id)!} />
      ))}
    </>
  )
}

export function GameCanvas() {
  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      // Celulares: resolução menor (GPU e bateria).
      dpr={isTouch() ? [1, 1.25] : [1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      // near 0.1 (e não 0.05) dobra a precisão do depth buffer: menos z-fighting à distância.
      camera={{ fov: 70, near: 0.1, far: 1400 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.15
        setPointerLockTarget(gl.domElement)
      }}
      onPointerDown={() => {
        if (useUi.getState().mode === 'playing' && !isTouch()) void requestPointerLock()
      }}
    >
      <Environment />
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <EstateView />
          <WorldAreas />
          <Player />
        </Physics>
      </Suspense>
      <LampRig />
      <InteractionProbe />
      <GameLoop />
    </Canvas>
  )
}
