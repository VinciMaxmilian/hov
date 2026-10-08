import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGame } from '../../state/gameStore'
import { deg, scaledBox } from '../geometry'
import { material } from '../materials'
import { Bookshelf, DrawerFront } from './furniture'
import { bool, num, str, vec, type PropProps } from './params'

/**
 * Objetos que se movem conforme o world state. Corpos cinemáticos: o jogador é empurrado/bloqueado
 * corretamente durante a animação. Estes props aplicam a própria transformação (selfTransform).
 */

const tmpQ = new THREE.Quaternion()
const tmpE = new THREE.Euler()

/**
 * Porta com dobradiça. Estado em world[params.state ?? obj.id]: locked | closed | open.
 * Portas duplas = dois objetos com o mesmo `state` (hinge left/right). variant: wood | iron | grille.
 */
export function Door({ obj }: PropProps) {
  const p = obj.params
  const w = num(p, 'width', 1.1)
  const h = num(p, 'height', 2.3)
  const hinge = str(p, 'hinge', 'left') === 'left' ? -1 : 1
  const swing = num(p, 'swing', 1)
  const knobless = bool(p, 'knoblessWhenLocked', false)
  const variant = str(p, 'variant', 'wood')
  const mat = material(str(p, 'material', variant === 'wood' ? 'wood_panel' : 'iron'))
  const trim = material(variant === 'wood' ? 'wood_trim' : 'iron')
  const brass = material(variant === 'wood' ? 'brass' : 'iron')
  const key = str(p, 'state', obj.id ?? '')
  const state = useGame((s) => s.world[key])
  const open = state === 'open'
  const yaw = deg(obj.rotation[1])
  const body = useRef<RapierRigidBody>(null)
  const angle = useRef(open ? swing * deg(92) * -hinge : 0)

  const hingeWorld = useMemo(() => {
    const v = new THREE.Vector3(hinge * (w / 2), 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    return [obj.position[0] + v.x, obj.position[1], obj.position[2] + v.z] as [number, number, number]
  }, [obj.position, hinge, w, yaw])

  useFrame((_, dt) => {
    const target = open ? swing * deg(92) * -hinge : 0
    const a = angle.current
    if (Math.abs(target - a) < 0.0005 || !body.current) return
    angle.current = a + (target - a) * Math.min(1, dt * 3.2)
    tmpQ.setFromEuler(tmpE.set(0, yaw + angle.current, 0))
    body.current.setNextKinematicRotation(tmpQ)
  })

  const nBars = Math.max(3, Math.round(w / 0.13))
  const bars = Array.from({ length: nBars }, (_, i) => -w / 2 + 0.06 + (i * (w - 0.12)) / (nBars - 1))
  const showKnob = !(knobless && state === 'locked')
  // Centro da folha em relação à dobradiça; a maçaneta fica na borda OPOSTA à dobradiça.
  const off = -hinge * (w / 2)
  const knobX = off * 0.8
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={hingeWorld} rotation={[0, yaw + angle.current, 0]}>
      <group position={[off, 0, 0]}>
        {variant === 'grille' ? (
          <>
            {bars.map((x) => (
              <mesh key={x} geometry={scaledBox(0.025, h - 0.04, 0.025)} material={mat} position={[x, h / 2, 0]} />
            ))}
            {[0.06, h * 0.5, h - 0.06].map((y) => (
              <mesh key={y} geometry={scaledBox(w - 0.02, 0.05, 0.035)} material={mat} position={[0, y, 0]} />
            ))}
          </>
        ) : (
          <mesh geometry={scaledBox(w - 0.02, h - 0.02, 0.06, 1.1)} material={mat} position={[0, h / 2, 0]} castShadow receiveShadow />
        )}
        {/* almofadas */}
        {variant === 'wood' && [0.28, 0.72].map((f) => (
          <group key={f}>
            <mesh geometry={scaledBox(w * 0.62, h * 0.3, 0.012)} material={trim} position={[0, h * f, 0.034]} />
            <mesh geometry={scaledBox(w * 0.62, h * 0.3, 0.012)} material={trim} position={[0, h * f, -0.034]} />
          </group>
        ))}
        {showKnob &&
          [-1, 1].map((sz) => (
            <mesh key={sz} position={[knobX, 1.0, sz * 0.06]} material={brass}>
              <sphereGeometry args={[0.035, 12, 10]} />
            </mesh>
          ))}
        {/* espelho da fechadura */}
        {[-1, 1].map((sz) => (
          <mesh key={`p${sz}`} position={[knobX, 0.92, sz * 0.032]} material={brass}>
            <boxGeometry args={[0.05, 0.14, 0.006]} />
          </mesh>
        ))}
        <CuboidCollider args={[w / 2 - 0.01, h / 2, 0.04]} position={[0, h / 2, 0]} />
      </group>
    </RigidBody>
  )
}

/**
 * Estante-porta / laje de pedra. mode "slide": desliza `offset` (mundo) quando world[obj.id] === 'open';
 * mode "swing": gira `angle` graus numa dobradiça vertical (hinge left|right). model: bookcase | slab.
 */
export function SecretBookcase(props: PropProps) {
  return str(props.obj.params, 'mode', 'slide') === 'swing' ? <SwingingCase {...props} /> : <SlidingCase {...props} />
}

function CaseModel({ obj, seed, w, h, d }: PropProps & { w: number; h: number; d: number }) {
  const shelfObj = useMemo(() => ({ ...obj, params: { width: w, height: h, depth: d, shelves: 6, fill: 0.9 } }), [obj, w, h, d])
  if (str(obj.params, 'model', 'bookcase') === 'slab')
    return <mesh geometry={scaledBox(w, h, d, 1.4)} material={material(str(obj.params, 'material', 'stone_old'))} position={[0, h / 2, 0]} castShadow receiveShadow />
  return <Bookshelf obj={shelfObj} seed={seed} />
}

function SwingingCase({ obj, seed }: PropProps) {
  const p = obj.params
  const w = num(p, 'width', 1.4)
  const h = num(p, 'height', 2.6)
  const d = num(p, 'depth', 0.4)
  const hinge = str(p, 'hinge', 'left') === 'left' ? -1 : 1
  const target = deg(num(p, 'angle', 85)) * hinge
  const duration = num(p, 'duration', 3.2)
  const key = obj.id ?? ''
  const open = useGame((s) => s.world[key] === 'open')
  const body = useRef<RapierRigidBody>(null)
  const t = useRef(open ? 1 : 0)
  const yaw = deg(obj.rotation[1])
  const hingeWorld = useMemo(() => {
    const v = new THREE.Vector3(hinge * (w / 2), 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    return [obj.position[0] + v.x, obj.position[1], obj.position[2] + v.z] as [number, number, number]
  }, [obj.position, hinge, w, yaw])
  useFrame((_, dt) => {
    const goal = open ? 1 : 0
    if (t.current === goal || !body.current) return
    t.current = goal > t.current ? Math.min(1, t.current + dt / duration) : Math.max(0, t.current - dt / duration)
    const e = t.current * t.current * (3 - 2 * t.current)
    tmpQ.setFromEuler(tmpE.set(0, yaw + target * e, 0))
    body.current.setNextKinematicRotation(tmpQ)
  })
  const e0 = t.current * t.current * (3 - 2 * t.current)
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={hingeWorld} rotation={[0, yaw + target * e0, 0]}>
      <group position={[-hinge * (w / 2), 0, 0]}>
        <CaseModel obj={obj} seed={seed} w={w} h={h} d={d} />
        <CuboidCollider args={[w / 2, h / 2, d / 2]} position={[0, h / 2, 0]} />
      </group>
    </RigidBody>
  )
}

function SlidingCase({ obj, seed }: PropProps) {
  const p = obj.params
  const w = num(p, 'width', 2.4)
  const h = num(p, 'height', 2.6)
  const d = num(p, 'depth', 0.4)
  const offset = vec(p, 'offset', [-2.5, 0, 0])
  const duration = num(p, 'duration', 3.4)
  const key = obj.id ?? ''
  const open = useGame((s) => s.world[key] === 'open')
  const body = useRef<RapierRigidBody>(null)
  const t = useRef(open ? 1 : 0)
  const yaw = deg(obj.rotation[1])
  const pos = useRef(new THREE.Vector3())

  useFrame((_, dt) => {
    const target = open ? 1 : 0
    if (t.current === target || !body.current) return
    t.current = target > t.current ? Math.min(1, t.current + dt / duration) : Math.max(0, t.current - dt / duration)
    // easing com "solavancos" de mecanismo antigo
    const e = t.current * t.current * (3 - 2 * t.current)
    const jitter = t.current > 0 && t.current < 1 ? Math.sin(t.current * 60) * 0.004 : 0
    pos.current.set(obj.position[0] + offset[0] * e + jitter, obj.position[1] + offset[1] * e, obj.position[2] + offset[2] * e)
    body.current.setNextKinematicTranslation(pos.current)
  })

  const e0 = t.current * t.current * (3 - 2 * t.current)
  const start: [number, number, number] = [obj.position[0] + offset[0] * e0, obj.position[1] + offset[1] * e0, obj.position[2] + offset[2] * e0]

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={start} rotation={[0, yaw, 0]}>
      <CaseModel obj={obj} seed={seed} w={w} h={h} d={d} />
      <CuboidCollider args={[w / 2, h / 2, d / 2]} position={[0, h / 2, 0]} />
    </RigidBody>
  )
}

/** Gaveta: desliza para frente quando world[interactable] === 'searched'. */
export function Drawer({ obj }: PropProps) {
  const key = obj.interactable ?? obj.id ?? ''
  const open = useGame((s) => s.world[key] === 'searched')
  const group = useRef<THREE.Group>(null)
  const travel = num(obj.params, 'travel', 0.32)
  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const target = open ? travel : 0
    g.position.z += (target - g.position.z) * Math.min(1, dt * 5)
  })
  return (
    <group ref={group}>
      <DrawerFront obj={obj} seed={0} />
    </group>
  )
}
