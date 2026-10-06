import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32, range } from '../../core/rng'
import { scaledBox } from '../geometry'
import { material } from '../materials'
import { drawnTexture } from '../textures'
import { bool, num, str, type PropProps } from './params'

/** Frente dos móveis = +z local. */

export function Table({ obj }: PropProps) {
  const w = num(obj.params, 'width', 1.6)
  const d = num(obj.params, 'depth', 0.9)
  const h = num(obj.params, 'height', 0.78)
  const mat = material(str(obj.params, 'material', 'wood_dark'))
  const leg = 0.07
  return (
    <group>
      <mesh geometry={scaledBox(w, 0.05, d, 1.6)} material={mat} position={[0, h - 0.025, 0]} castShadow receiveShadow />
      <mesh geometry={scaledBox(w - 0.1, 0.1, d - 0.1)} material={mat} position={[0, h - 0.1, 0]} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} geometry={scaledBox(leg, h - 0.05, leg)} material={mat} position={[(sx * (w - leg * 2)) / 2, (h - 0.05) / 2, (sz * (d - leg * 2)) / 2]} castShadow />
      ))}
    </group>
  )
}

export function SideTable({ obj }: PropProps) {
  const r = num(obj.params, 'radius', 0.32)
  const h = num(obj.params, 'height', 0.7)
  const mat = material(str(obj.params, 'material', 'wood_dark'))
  return (
    <group>
      <mesh position={[0, h - 0.02, 0]} material={mat} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.04, 24]} />
      </mesh>
      <mesh position={[0, h / 2, 0]} material={mat}>
        <cylinderGeometry args={[0.04, 0.05, h, 8]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} material={mat}>
        <cylinderGeometry args={[r * 0.6, r * 0.7, 0.06, 16]} />
      </mesh>
    </group>
  )
}

export function Chair({ obj }: PropProps) {
  const mat = material(str(obj.params, 'material', 'wood_dark'))
  const seat = material(str(obj.params, 'seat', 'leather'))
  const s = 0.46
  return (
    <group>
      <mesh geometry={scaledBox(s, 0.06, s)} material={seat} position={[0, 0.46, 0]} castShadow />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} geometry={scaledBox(0.045, 0.44, 0.045)} material={mat} position={[(sx * (s - 0.05)) / 2, 0.22, (sz * (s - 0.05)) / 2]} />
      ))}
      <mesh geometry={scaledBox(s, 0.55, 0.05)} material={mat} position={[0, 0.78, -s / 2 + 0.025]} castShadow />
    </group>
  )
}

export function Desk({ obj }: PropProps) {
  const w = num(obj.params, 'width', 1.7)
  const d = num(obj.params, 'depth', 0.85)
  const h = num(obj.params, 'height', 0.78)
  const mat = material(str(obj.params, 'material', 'wood_dark'))
  const top = material('leather')
  const brass = material('brass')
  const pw = 0.45
  return (
    <group>
      <mesh geometry={scaledBox(w, 0.05, d, 1.6)} material={mat} position={[0, h - 0.025, 0]} castShadow receiveShadow />
      <mesh geometry={scaledBox(w - 0.3, 0.005, d - 0.25)} material={top} position={[0, h + 0.003, 0]} receiveShadow />
      {[-1, 1].map((sx) => (
        <group key={sx} position={[(sx * (w - pw)) / 2, 0, 0]}>
          <mesh geometry={scaledBox(pw, h - 0.05, d - 0.04)} material={mat} position={[0, (h - 0.05) / 2, 0]} castShadow />
          {[0, 1, 2].map((k) => (
            <group key={k} position={[0, 0.14 + k * 0.22, d / 2 - 0.01]}>
              <mesh geometry={scaledBox(pw - 0.06, 0.18, 0.02)} material={mat} />
              <mesh position={[0, 0, 0.02]} material={brass}>
                <boxGeometry args={[0.08, 0.015, 0.015]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh geometry={scaledBox(w - 2 * pw, h * 0.55, 0.03)} material={mat} position={[0, h * 0.62, -d / 2 + 0.05]} />
    </group>
  )
}

/** Gaveta que desliza para fora quando o estado do interactable vira "searched". */
export function DrawerFront({ obj }: PropProps) {
  const w = num(obj.params, 'width', 0.6)
  const mat = material(str(obj.params, 'material', 'wood_dark'))
  return (
    <group>
      <mesh geometry={scaledBox(w, 0.12, 0.5)} material={mat} position={[0, 0, -0.25]} />
      <mesh position={[0, 0, 0.012]} material={material('brass')}>
        <boxGeometry args={[0.1, 0.018, 0.02]} />
      </mesh>
    </group>
  )
}

const SPINE_COLORS = ['#3b1f1a', '#1f2f2a', '#26324a', '#4a3a22', '#2a1f2e', '#51402a', '#1c2420', '#5a2a22', '#33302a']

function spineTexture() {
  return drawnTexture('book-spine', 64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c8c0b0'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(0, 0, 4, h)
    ctx.fillRect(w - 4, 0, 4, h)
    ctx.fillStyle = '#e8cf8a'
    for (const y of [20, 30, h - 40, h - 30]) ctx.fillRect(6, y, w - 12, 4)
    ctx.fillRect(14, h * 0.35, w - 28, h * 0.12)
  })
}

/**
 * Estante procedural com livros instanciados (1 draw call para todos os livros).
 * A seed define quantidade, larguras, alturas, inclinações e cores — determinístico entre saves.
 */
export function Bookshelf({ obj, seed }: PropProps) {
  const w = num(obj.params, 'width', 2)
  const h = num(obj.params, 'height', 2.6)
  const d = num(obj.params, 'depth', 0.38)
  const shelves = num(obj.params, 'shelves', 6)
  const fill = num(obj.params, 'fill', 0.85)
  const wood = material(str(obj.params, 'material', 'wood_dark'))
  const books = useRef<THREE.InstancedMesh>(null)

  const layout = useMemo(() => {
    const rng = mulberry32(seed)
    const out: { pos: [number, number, number]; size: [number, number, number]; tilt: number; color: string }[] = []
    const inner = w - 0.08
    const gap = (h - 0.12) / shelves
    for (let s = 0; s < shelves; s++) {
      const y0 = 0.1 + s * gap
      let x = -inner / 2 + 0.02
      while (x < inner / 2 - 0.05) {
        if (rng() > fill) {
          x += range(rng, 0.08, 0.3)
          continue
        }
        const bw = range(rng, 0.025, 0.07)
        const bh = Math.min(gap - 0.05, range(rng, 0.18, 0.32))
        const bd = range(rng, d * 0.6, d * 0.85)
        const lean = rng() < 0.06 ? range(rng, 0.15, 0.35) : 0
        if (x + bw > inner / 2) break
        out.push({
          pos: [x + bw / 2 + (lean ? bh * Math.sin(lean) * 0.5 : 0), y0 + (bh / 2) * Math.cos(lean), d / 2 - bd / 2 - 0.02],
          size: [bw, bh, bd],
          tilt: -lean,
          color: SPINE_COLORS[Math.floor(rng() * SPINE_COLORS.length)],
        })
        x += bw + (lean ? bh * Math.sin(lean) : 0.002)
      }
    }
    return { books: out, gap }
  }, [seed, w, h, d, shelves, fill])

  const bookMat = useMemo(() => new THREE.MeshStandardMaterial({ map: spineTexture(), roughness: 0.8 }), [])
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  useLayoutEffect(() => {
    const mesh = books.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const c = new THREE.Color()
    layout.books.forEach((b, i) => {
      q.setFromEuler(new THREE.Euler(0, 0, b.tilt))
      m.compose(new THREE.Vector3(...b.pos), q, new THREE.Vector3(...b.size))
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, c.set(b.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [layout])

  return (
    <group>
      {/* carcaça */}
      <mesh geometry={scaledBox(w, h, 0.03)} material={wood} position={[0, h / 2, -d / 2 + 0.015]} />
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={scaledBox(0.04, h, d)} material={wood} position={[(sx * (w - 0.04)) / 2, h / 2, 0]} castShadow />
      ))}
      {Array.from({ length: shelves + 1 }, (_, s) => (
        <mesh key={s} geometry={scaledBox(w - 0.06, 0.03, d)} material={wood} position={[0, 0.085 + s * layout.gap, 0]} receiveShadow />
      ))}
      <mesh geometry={scaledBox(w + 0.06, 0.08, d + 0.04)} material={wood} position={[0, h + 0.04, 0.01]} />
      {layout.books.length > 0 && (
        <instancedMesh ref={books} args={[unitBox, bookMat, layout.books.length]} raycast={() => null} castShadow receiveShadow />
      )}
    </group>
  )
}

export function Fireplace({ obj }: PropProps) {
  const w = num(obj.params, 'width', 1.8)
  const h = num(obj.params, 'height', 1.3)
  const stone = material(str(obj.params, 'material', 'stone_dark'))
  const wood = material('wood_dark')
  const black = material('black')
  return (
    <group>
      <mesh geometry={scaledBox(w, h, 0.4, 1.2)} material={stone} position={[0, h / 2, 0]} castShadow />
      <mesh geometry={scaledBox(w * 0.55, h * 0.6, 0.42)} material={black} position={[0, h * 0.3, 0.01]} />
      <mesh geometry={scaledBox(w + 0.3, 0.08, 0.55)} material={wood} position={[0, h + 0.04, 0.05]} castShadow />
      <mesh geometry={scaledBox(w + 0.4, 0.04, 0.8)} material={stone} position={[0, 0.02, 0.4]} receiveShadow />
      {/* restos de lenha fria */}
      {[-0.15, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.1, 0.05]} rotation={[0, 0.3 * (i ? 1 : -1), Math.PI / 2]} material={material('wood_worn')}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Escada principal: degraus + corrimãos; colisão por rampa contínua (o character controller sobe liso).
 * Sobe ao longo de -z local a partir da origem.
 */
export function Staircase({ obj }: PropProps) {
  const width = num(obj.params, 'width', 3)
  const steps = num(obj.params, 'steps', 14)
  const rise = num(obj.params, 'rise', 0.25)
  const run = num(obj.params, 'run', 0.32)
  const landing = num(obj.params, 'landing', 2)
  const mat = material(str(obj.params, 'material', 'wood_dark'))
  const carpet = material('carpet_red')
  const H = steps * rise
  const L = steps * run
  const slope = Math.atan2(H, L)
  const hyp = Math.hypot(H, L)
  return (
    <RigidBody type="fixed" colliders={false}>
      {Array.from({ length: steps }, (_, i) => (
        <group key={i} position={[0, (i + 0.5) * rise, -(i + 0.5) * run]}>
          <mesh geometry={scaledBox(width, rise, run)} material={mat} receiveShadow castShadow />
          <mesh geometry={scaledBox(width * 0.6, 0.01, run)} material={carpet} position={[0, rise / 2 + 0.005, 0]} receiveShadow />
        </group>
      ))}
      {/* patamar */}
      <mesh geometry={scaledBox(width + 2, 0.2, landing, 2)} material={mat} position={[0, H - 0.1, -L - landing / 2]} receiveShadow castShadow />
      <CuboidCollider args={[(width + 2) / 2, 0.1, landing / 2]} position={[0, H - 0.1, -L - landing / 2]} />
      {/* rampa de colisão */}
      <group position={[0, H / 2, -L / 2]} rotation={[slope, 0, 0]}>
        <CuboidCollider args={[width / 2, 0.05, hyp / 2]} position={[0, -0.02, 0]} />
      </group>
      {/* corrimãos */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[(sx * (width + 0.1)) / 2, 0, 0]}>
          <group position={[0, H / 2 + 0.95, -L / 2]} rotation={[slope, 0, 0]}>
            <mesh geometry={scaledBox(0.08, 0.08, hyp + 0.2)} material={mat} castShadow />
            <CuboidCollider args={[0.06, 0.6, hyp / 2]} position={[0, -0.4, 0]} />
          </group>
          {Array.from({ length: Math.floor(steps / 2) + 1 }, (_, i) => (
            <mesh key={i} geometry={scaledBox(0.04, 0.95, 0.04)} material={mat} position={[0, i * 2 * rise + 0.475 + rise, -i * 2 * run - run / 2]} />
          ))}
          <mesh geometry={scaledBox(0.14, 1.2, 0.14)} material={mat} position={[0, 0.6, 0]} castShadow />
        </group>
      ))}
    </RigidBody>
  )
}

export function Chandelier({ obj }: PropProps) {
  const drop = num(obj.params, 'drop', 1.2)
  const r = num(obj.params, 'radius', 0.6)
  const brass = material('brass')
  const wax = material('paper')
  const arms = 8
  return (
    <group>
      <mesh position={[0, -drop / 2, 0]} material={brass}>
        <cylinderGeometry args={[0.01, 0.01, drop, 4]} />
      </mesh>
      <mesh position={[0, -drop, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
        <torusGeometry args={[r, 0.025, 6, 32]} />
      </mesh>
      <mesh position={[0, -drop - 0.1, 0]} material={brass}>
        <sphereGeometry args={[0.1, 12, 8]} />
      </mesh>
      {Array.from({ length: arms }, (_, i) => {
        const a = (i / arms) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * r, -drop + 0.08, Math.sin(a) * r]} material={wax}>
            <cylinderGeometry args={[0.018, 0.018, 0.14, 6]} />
          </mesh>
        )
      })}
    </group>
  )
}

export function CoatRack({ obj }: PropProps) {
  const wood = material('wood_dark')
  const coats = num(obj.params, 'coats', 2)
  const cloth = [material('cloth_dark'), material('wallpaper_blue')]
  return (
    <group>
      <mesh position={[0, 0.9, 0]} material={wood} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 1.8, 8]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} material={wood}>
        <cylinderGeometry args={[0.22, 0.25, 0.06, 12]} />
      </mesh>
      {Array.from({ length: coats }, (_, i) => {
        const a = i * 2.4 + 0.5
        return (
          <mesh key={i} position={[Math.cos(a) * 0.14, 1.25, Math.sin(a) * 0.14]} rotation={[0.08, a, 0]} material={cloth[i % 2]} castShadow>
            <cylinderGeometry args={[0.12, 0.24, 1.0, 8, 1, true]} />
          </mesh>
        )
      })}
    </group>
  )
}

export function UmbrellaStand({ obj }: PropProps) {
  const brass = material(str(obj.params, 'material', 'brass'))
  const black = material('cloth_dark')
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={brass} castShadow>
        <cylinderGeometry args={[0.15, 0.13, 0.6, 16, 1, true]} />
      </mesh>
      <mesh position={[0, 0.01, 0]} material={brass}>
        <cylinderGeometry args={[0.13, 0.13, 0.02, 16]} />
      </mesh>
      {[0.3, -0.25].map((tilt, i) => (
        <group key={i} position={[i ? -0.04 : 0.05, 0.45, i ? 0.03 : -0.02]} rotation={[tilt * 0.3, 0, tilt]}>
          <mesh material={black}>
            <cylinderGeometry args={[0.03, 0.05, 0.8, 8]} />
          </mesh>
          <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} material={material('wood_dark')}>
            <torusGeometry args={[0.05, 0.012, 6, 12, Math.PI]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Estátua/pedestal simples para cantos (placeholder para GLB futuro). */
export function Pedestal({ obj }: PropProps) {
  const h = num(obj.params, 'height', 1.1)
  const stone = material('stone')
  const showBust = bool(obj.params, 'bust', true)
  return (
    <group>
      <mesh geometry={scaledBox(0.4, h, 0.4)} material={stone} position={[0, h / 2, 0]} castShadow />
      {showBust && (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.16, 0]} material={stone}>
            <cylinderGeometry args={[0.12, 0.17, 0.3, 10]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={stone} castShadow>
            <sphereGeometry args={[0.11, 12, 10]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/** Estante estática com um único colisor (o InstancedMesh dos livros não deve gerar colisores automáticos). */
export function BookshelfStatic(props: PropProps) {
  const w = num(props.obj.params, 'width', 2)
  const h = num(props.obj.params, 'height', 2.6)
  const d = num(props.obj.params, 'depth', 0.38)
  return (
    <RigidBody type="fixed" colliders={false}>
      <Bookshelf {...props} />
      <CuboidCollider args={[w / 2, h / 2, d / 2]} position={[0, h / 2, 0]} />
    </RigidBody>
  )
}
