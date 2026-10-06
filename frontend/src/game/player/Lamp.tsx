import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'
import { LampModel } from '../world/props/smallItems'

import { LAMP_FLAG } from './lampControl'

/** Lamparina: luz quente presa à câmera (sem sombra, para performance) + modelo na mão. */
export function LampRig() {
  const hasLamp = useGame((s) => s.inventory.includes('oil_lamp'))
  const lit = useGame((s) => Boolean(s.flags[LAMP_FLAG]))
  const hidden = useUi((s) => s.mode === 'puzzle' || s.mode === 'title' || s.mode === 'intro')
  const rig = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const sway = useRef(new THREE.Vector2())
  const prevYaw = useRef(0)

  useFrame(({ camera, clock }, dt) => {
    const g = rig.current
    if (!g) return
    g.position.copy(camera.position)
    g.quaternion.copy(camera.quaternion)
    // balanço do lampião ao virar
    const yaw = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ').y
    const dyaw = yaw - prevYaw.current
    prevYaw.current = yaw
    sway.current.x = THREE.MathUtils.damp(sway.current.x, THREE.MathUtils.clamp(dyaw * 8, -0.3, 0.3), 6, dt)
    const hand = g.children[0]
    if (hand) hand.rotation.z = sway.current.x
    if (light.current) {
      const t = clock.elapsedTime
      const flicker = 0.88 + Math.sin(t * 11.3) * 0.04 + Math.sin(t * 23.7 + 2) * 0.03 + Math.sin(t * 5.1) * 0.05
      // Em close-ups (puzzle) a chama fica perto demais do objeto: atenua.
      const closeUp = useUi.getState().mode === 'puzzle' ? 0.35 : 1
      light.current.intensity = lit ? 16 * flicker * closeUp : 0
    }
  })

  if (!hasLamp) return null
  return (
    <group ref={rig}>
      <group position={[0.3, -0.37, -0.62]} scale={0.7} visible={!hidden}>
        <LampModel lit={lit} />
      </group>
      <pointLight ref={light} position={[0.22, -0.1, -0.35]} color="#ffb45e" distance={12} decay={1.5} intensity={0} />
    </group>
  )
}
