import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import * as THREE from 'three'
import { scaledBox } from '../geometry'
import { material, tileOf } from '../materials'
import { bool, num, str, vec, type PropProps } from './params'

/** Caixa genérica (degraus, decks, volumes de fachada, vigas). size = [w, h, d], base no chão. */
export function Box({ obj }: PropProps) {
  const [w, h, d] = vec(obj.params, 'size', [1, 1, 1])
  const mat = str(obj.params, 'material', 'plaster')
  return <mesh geometry={scaledBox(w, h, d, tileOf(mat))} material={material(mat)} position={[0, h / 2, 0]} castShadow={bool(obj.params, 'castShadow', true)} receiveShadow />
}

/** Telhado de duas águas (prisma triangular). size = [largura, altura da cumeeira, profundidade]. */
export function Gable({ obj }: PropProps) {
  const [w, h, d] = vec(obj.params, 'size', [4, 2, 6])
  const mat = str(obj.params, 'material', 'roof')
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2, 0)
    shape.lineTo(w / 2, 0)
    shape.lineTo(0, h)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false })
    g.translate(0, 0, -d / 2)
    // UV em metros
    const uv = g.attributes.uv as THREE.BufferAttribute
    const t = tileOf(mat)
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / t, uv.getY(i) / t)
    return g
  }, [w, h, d, mat])
  return <mesh geometry={geo} material={material(mat)} castShadow receiveShadow />
}

export function Column({ obj }: PropProps) {
  const h = num(obj.params, 'height', 3)
  const r = num(obj.params, 'radius', 0.15)
  const mat = material(str(obj.params, 'material', 'wood_trim'))
  return (
    <group>
      <mesh position={[0, h / 2, 0]} material={mat} castShadow>
        <cylinderGeometry args={[r, r * 1.1, h, 12]} />
      </mesh>
      <mesh position={[0, 0.08, 0]} material={mat}>
        <boxGeometry args={[r * 3, 0.16, r * 3]} />
      </mesh>
      <mesh position={[0, h - 0.08, 0]} material={mat}>
        <boxGeometry args={[r * 3, 0.16, r * 3]} />
      </mesh>
    </group>
  )
}

/** Rampa com colisor (usada sob escadas e na descida da passagem). Sobe ao longo de -z local. */
export function Ramp({ obj }: PropProps) {
  const w = num(obj.params, 'width', 1.2)
  const length = num(obj.params, 'length', 2)
  const rise = num(obj.params, 'rise', 1)
  const mat = str(obj.params, 'material', 'stone_dark')
  const visible = bool(obj.params, 'visible', true)
  const slope = Math.atan2(rise, length)
  const hyp = Math.hypot(rise, length)
  return (
    <RigidBody type="fixed" colliders={false}>
      <group position={[0, rise / 2, -length / 2]} rotation={[slope, 0, 0]}>
        {visible && <mesh geometry={scaledBox(w, 0.12, hyp, tileOf(mat))} material={material(mat)} position={[0, -0.06, 0]} receiveShadow />}
        <CuboidCollider args={[w / 2, 0.06, hyp / 2]} position={[0, -0.06, 0]} />
      </group>
    </RigidBody>
  )
}

export function Rug({ obj }: PropProps) {
  const [w, d] = [num(obj.params, 'width', 2), num(obj.params, 'depth', 3)]
  const mat = str(obj.params, 'material', 'carpet_red')
  return <mesh geometry={scaledBox(w, 0.015, d, Math.max(w, d))} material={material(mat)} position={[0, 0.008, 0]} receiveShadow />
}

/** Tábuas pregadas bloqueando uma passagem (com colisor). */
export function Boards({ obj, seed }: PropProps) {
  const w = num(obj.params, 'width', 2)
  const h = num(obj.params, 'height', 2.2)
  const count = num(obj.params, 'count', 5)
  const mat = material('boards')
  const boards = useMemo(() => {
    const out: { y: number; rot: number; len: number }[] = []
    let s = seed
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < count; i++) out.push({ y: 0.3 + (i / Math.max(1, count - 1)) * (h - 0.6), rot: (rnd() - 0.5) * 0.25, len: w * (1.02 + rnd() * 0.1) })
    return out
  }, [seed, count, w, h])
  return (
    <RigidBody type="fixed" colliders={false}>
      {boards.map((b, i) => (
        <mesh key={i} geometry={scaledBox(b.len, 0.18, 0.03, 1.2)} material={mat} position={[0, b.y, 0]} rotation={[0, 0, b.rot]} castShadow />
      ))}
      <CuboidCollider args={[w / 2, h / 2, 0.15]} position={[0, h / 2, 0]} />
    </RigidBody>
  )
}
