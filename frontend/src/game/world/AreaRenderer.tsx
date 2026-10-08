import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { audio } from '../audio/audioManager'
import type { AreaDef, AreaObject, LightDef } from '../content/schemas'
import { hashString, seedFrom } from '../core/rng'
import { registerTarget } from '../interaction/targets'
import { evaluate } from '../rules/evaluate'
import { useGame } from '../state/gameStore'
import { deg } from './geometry'
import { propRegistry } from './props'
import { vec } from './props/params'
import { Room } from './Room'

/**
 * Monta uma área a partir do JSON: salas procedurais (opcional), objetos e ambiência.
 * Luzes pontuais das áreas vão para o pool global (world/Environment); aqui só as direcionais/ambiente
 * declaradas explicitamente (raras).
 */
export function AreaRenderer({ area }: { area: AreaDef }) {
  return (
    <group name={`area:${area.id}`} dispose={null}>
      {area.rooms.map((r) => (
        <Room key={r.id} room={r} />
      ))}
      {area.lights
        .filter((l) => l.type !== 'point' && l.type !== 'spot')
        .map((l, i) => (
          <AreaLight key={i} light={l} />
        ))}
      {area.objects.map((o, i) => (
        <AreaObjectView key={o.id ?? `${o.type}-${i}`} obj={o} seed={seedFrom(o.seed, hashString(`${area.id}:${o.id ?? i}`))} />
      ))}
      {area.ambience.map((a, i) => (
        <Ambience key={i} sound={a.sound} position={a.position} volume={a.volume} when={a.when} />
      ))}
    </group>
  )
}

function useVisible(obj: AreaObject): boolean {
  return useGame((s) => {
    if (obj.id && s.world[obj.id] === 'taken') return false
    if (obj.interactable && s.world[obj.interactable] === 'taken') return false
    return evaluate(obj.visibleWhen, s)
  })
}

function AreaObjectView({ obj, seed }: { obj: AreaObject; seed: number }) {
  const visible = useVisible(obj)
  const ref = useRef<THREE.Group>(null)
  const entry = propRegistry[obj.type]

  useLayoutEffect(() => {
    if (!visible || !ref.current) return
    return registerTarget(ref.current, obj.interactable ?? null)
  }, [visible, obj.interactable])

  if (!entry) {
    console.warn(`[world] prop desconhecido: ${obj.type}`)
    return null
  }
  if (!visible) return null

  const Component = entry.component
  const scale = typeof obj.scale === 'number' ? ([obj.scale, obj.scale, obj.scale] as const) : (obj.scale ?? [1, 1, 1])
  const rotation = obj.rotation.map(deg) as [number, number, number]
  // Hit-box invisível para objetos pequenos (mira mais justa sem destacar o objeto).
  const hit = obj.interactable ? vec(obj.params, 'hit', [0, 0, 0]) : null

  const inner = entry.selfTransform ? (
    <Component obj={obj} seed={seed} />
  ) : entry.collider === 'auto' && obj.collider !== false ? (
    <RigidBody type="fixed" colliders="cuboid" position={obj.position} rotation={rotation}>
      <group scale={[...scale]}>
        <Component obj={obj} seed={seed} />
      </group>
    </RigidBody>
  ) : (
    <group position={obj.position} rotation={rotation} scale={[...scale]}>
      <Component obj={obj} seed={seed} />
      {hit && hit[0] > 0 && (
        <mesh visible={false} position={[0, hit[1] / 2, 0]}>
          <boxGeometry args={hit} />
        </mesh>
      )}
    </group>
  )

  return (
    <group ref={ref} name={obj.id ?? obj.type}>
      {inner}
    </group>
  )
}

function AreaLight({ light }: { light: LightDef }) {
  const on = useGame((s) => evaluate(light.when, s))
  const ref = useRef<THREE.Light>(null)
  const targetRef = useRef<THREE.Object3D>(null)

  useLayoutEffect(() => {
    const l = ref.current
    if (!l) return
    if ((l instanceof THREE.DirectionalLight || l instanceof THREE.SpotLight) && targetRef.current) l.target = targetRef.current
    if (l instanceof THREE.DirectionalLight && light.castShadow) {
      const cam = l.shadow.camera
      cam.left = -38
      cam.right = 38
      cam.top = 38
      cam.bottom = -38
      cam.near = 1
      cam.far = 160
      l.shadow.mapSize.set(2048, 2048)
      l.shadow.bias = -0.0006
      l.shadow.normalBias = 0.03
      cam.updateProjectionMatrix()
    }
    if (l instanceof THREE.SpotLight && light.castShadow) {
      l.shadow.mapSize.set(1024, 1024)
      l.shadow.bias = -0.0008
    }
  }, [light.castShadow])

  useFrame(({ clock }) => {
    if (!ref.current || light.flicker <= 0) return
    const t = clock.elapsedTime
    const n = Math.sin(t * 7.3) * 0.5 + Math.sin(t * 17.9 + 1.3) * 0.3 + Math.sin(t * 3.1) * 0.2
    ref.current.intensity = light.intensity * (1 - light.flicker * 0.35 * (n * 0.5 + 0.5))
  })

  if (!on) return null
  const common = { color: light.color, intensity: light.intensity }
  switch (light.type) {
    case 'ambient':
      return <ambientLight ref={ref as React.Ref<THREE.AmbientLight>} {...common} />
    case 'hemisphere':
      return <hemisphereLight ref={ref as React.Ref<THREE.HemisphereLight>} {...common} groundColor={light.groundColor ?? '#000000'} />
    case 'directional':
      return (
        <>
          <directionalLight ref={ref as React.Ref<THREE.DirectionalLight>} {...common} position={light.position} castShadow={light.castShadow} />
          <object3D ref={targetRef} position={light.target ?? [0, 0, 0]} />
        </>
      )
    case 'point':
      return (
        <pointLight
          ref={ref as React.Ref<THREE.PointLight>}
          {...common}
          position={light.position}
          distance={light.distance ?? 8}
          decay={light.decay ?? 1.6}
          castShadow={light.castShadow}
        />
      )
    case 'spot':
      return (
        <>
          <spotLight
            ref={ref as React.Ref<THREE.SpotLight>}
            {...common}
            position={light.position}
            distance={light.distance ?? 14}
            decay={light.decay ?? 1.4}
            angle={light.angle ?? 0.6}
            penumbra={light.penumbra ?? 0.6}
            castShadow={light.castShadow}
          />
          <object3D ref={targetRef} position={light.target ?? [0, 0, 0]} />
        </>
      )
  }
}

function Ambience({ sound, position, volume, when }: { sound: string; position?: [number, number, number]; volume: number; when?: AreaDef['ambience'][number]['when'] }) {
  const on = useGame((s) => evaluate(when, s))
  useEffect(() => {
    if (!on) return
    const loop = audio.startLoop(sound, { position, volume })
    return () => loop.stop()
  }, [on, sound, position, volume])
  return null
}
