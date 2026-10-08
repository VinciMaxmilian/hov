import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { conditionSchema } from '../../content/schemas'
import { evaluate } from '../../rules/evaluate'
import { useGame } from '../../state/gameStore'
import { scaledBox } from '../geometry'
import { material } from '../materials'
import { bool, num, str, vec, type PropProps } from './params'

/**
 * Hit-box invisível para interagir com a geometria da propriedade procedural (retratos, lareiras, cofres,
 * telescópio…). Não destaca nada: o objeto visível já está no mundo. size = [largura, altura, profundidade],
 * centrado na posição.
 */
export function Hotspot({ obj }: PropProps) {
  const [w, h, d] = vec(obj.params, 'size', [0.6, 0.6, 0.6])
  return (
    <mesh visible={false}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  )
}

/** Livro fechado ou aberto (diários, livros-registro). */
export function Book({ obj }: PropProps) {
  const w = num(obj.params, 'width', 0.18)
  const d = num(obj.params, 'depth', 0.25)
  const t = num(obj.params, 'thickness', 0.035)
  const open = bool(obj.params, 'open', false)
  const cover = useMemo(() => new THREE.MeshStandardMaterial({ color: str(obj.params, 'color', '#4a2a1a'), roughness: 0.6, metalness: str(obj.params, 'color', '').startsWith('#8') ? 0.5 : 0 }), [obj.params])
  const pages = material('paper')
  if (!open)
    return (
      <group>
        <mesh geometry={scaledBox(w, t, d)} material={cover} position={[0, t / 2, 0]} castShadow />
        <mesh geometry={scaledBox(w - 0.012, t - 0.008, d - 0.01)} material={pages} position={[0.004, t / 2, 0]} />
      </group>
    )
  return (
    <group>
      {[-1, 1].map((sx) => (
        <group key={sx} position={[(sx * w) / 2, 0, 0]} rotation={[0, 0, sx * -0.06]}>
          <mesh geometry={scaledBox(w, 0.006, d)} material={cover} position={[0, 0.003, 0]} />
          <mesh geometry={scaledBox(w - 0.01, t * 0.45, d - 0.012)} material={pages} position={[0, 0.006 + t * 0.22, 0]} />
        </group>
      ))}
    </group>
  )
}

/** Lamparina de nicho (antecâmara). Acesa quando params.litWhen (condição da DSL) é verdadeira. */
export function NicheLamp({ obj }: PropProps) {
  const parsed = useMemo(() => conditionSchema.safeParse(obj.params.litWhen), [obj.params.litWhen])
  const lit = useGame((s) => (parsed.success ? evaluate(parsed.data, s) : false))
  const flame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffcf8a', emissive: new THREE.Color('#ff9a3d'), emissiveIntensity: 0, roughness: 1 }), [])
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    flame.emissiveIntensity = lit ? 2.4 + Math.sin(clock.elapsedTime * 11 + obj.position[2]) * 0.4 : 0
    if (ref.current) ref.current.visible = lit
  })
  const brass = material('brass')
  return (
    <group>
      <mesh position={[0, 0.04, 0]} material={brass}>
        <cylinderGeometry args={[0.06, 0.08, 0.08, 14]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} material={brass}>
        <cylinderGeometry args={[0.012, 0.012, 0.05, 6]} />
      </mesh>
      <mesh ref={ref} position={[0, 0.15, 0]} material={flame}>
        <sphereGeometry args={[0.025, 8, 8]} />
      </mesh>
    </group>
  )
}
