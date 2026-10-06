import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32, range } from '../../core/rng'
import { scaledBox } from '../geometry'
import { material, tileOf } from '../materials'
import { num, str, vec, type PropProps } from './params'

/** Chão externo com colisor. */
export function Ground({ obj }: PropProps) {
  const size = num(obj.params, 'size', 300)
  const mat = str(obj.params, 'material', 'grass')
  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh geometry={scaledBox(size, 0.2, size, tileOf(mat))} material={material(mat)} position={[0, -0.1, 0]} receiveShadow />
      <CuboidCollider args={[size / 2, 0.1, size / 2]} position={[0, -0.1, 0]} />
    </RigidBody>
  )
}

/** Colisor invisível (limites da propriedade, volumes sem visual). */
export function Blocker({ obj }: PropProps) {
  const [w, h, d] = vec(obj.params, 'size', [1, 3, 1])
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[w / 2, h / 2, d / 2]} position={[0, h / 2, 0]} />
    </RigidBody>
  )
}

/** Céu em gradiente (não recebe neblina) + lua. */
export function Sky({ obj }: PropProps) {
  const top = str(obj.params, 'top', '#05080d')
  const horizon = str(obj.params, 'horizon', '#2e4a62')
  const moonDir = vec(obj.params, 'moon', [-0.35, 0.45, -0.8])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color(top) }, horizon: { value: new THREE.Color(horizon) } },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vDir;
          void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 c = mix(horizon, top, pow(h, 0.55));
          float n = fract(sin(dot(floor(vDir.xz*900.0), vec2(12.9898,78.233)))*43758.5453);
          gl_FragColor = vec4(c + (n > 0.9994 && vDir.y > 0.25 ? vec3(0.35) : vec3(0.0)), 1.0); }`,
      }),
    [top, horizon],
  )
  const moonPos = new THREE.Vector3(...moonDir).normalize().multiplyScalar(420)
  const group = useRef<THREE.Group>(null)
  // O céu acompanha a câmera (nunca se aproxima).
  useFrame(({ camera }) => group.current?.position.copy(camera.position))
  return (
    <group ref={group}>
      <mesh material={mat} renderOrder={-10} raycast={() => null}>
        <sphereGeometry args={[480, 32, 16]} />
      </mesh>
      <mesh position={moonPos} raycast={() => null}>
        <circleGeometry args={[14, 32]} />
        <meshBasicMaterial color="#cfd8e0" fog={false} />
      </mesh>
      <mesh position={moonPos.clone().multiplyScalar(0.99)} raycast={() => null}>
        <circleGeometry args={[40, 32]} />
        <meshBasicMaterial color="#3d5a6c" transparent opacity={0.18} fog={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Cordilheira distante (silhuetas sem neblina, um tom acima do céu). */
export function Mountains({ obj, seed }: PropProps) {
  const color = str(obj.params, 'color', '#121c27')
  const geo = useMemo(() => {
    const rng = mulberry32(seed)
    const segs = 160
    const positions: number[] = []
    const R = 380
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2
      const a1 = ((i + 1) / segs) * Math.PI * 2
      const h0 = 40 + Math.abs(Math.sin(a0 * 3.1 + seed)) * 70 + rng() * 25
      const h1 = 40 + Math.abs(Math.sin(a1 * 3.1 + seed)) * 70 + rng() * 25
      const p = (a: number, h: number) => [Math.cos(a) * R, h, Math.sin(a) * R]
      positions.push(...p(a0, -10), ...p(a1, -10), ...p(a1, h1), ...p(a0, -10), ...p(a1, h1), ...p(a0, h0))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return g
  }, [seed])
  return (
    <mesh geometry={geo} raycast={() => null}>
      <meshBasicMaterial color={color} side={THREE.DoubleSide} fog={false} />
    </mesh>
  )
}

/**
 * Floresta instanciada (2 draw calls). Seed → posições; evita o caminho e a casa.
 * params: count, inner, outer, center, clear (retângulos [x0,z0,x1,z1] sem árvores).
 */
export function Forest({ obj, seed }: PropProps) {
  const count = num(obj.params, 'count', 260)
  const inner = num(obj.params, 'inner', 28)
  const outer = num(obj.params, 'outer', 110)
  const trunks = useRef<THREE.InstancedMesh>(null)
  const crowns = useRef<THREE.InstancedMesh>(null)

  const trees = useMemo(() => {
    const center = vec(obj.params, 'center', [0, 0, 10])
    const clear = (obj.params.clear as [number, number, number, number][] | undefined) ?? []
    const rng = mulberry32(seed)
    const out: { x: number; z: number; h: number; r: number }[] = []
    let guard = 0
    while (out.length < count && guard++ < count * 20) {
      const a = rng() * Math.PI * 2
      const d = Math.sqrt(range(rng, inner * inner, outer * outer))
      const x = center[0] + Math.cos(a) * d
      const z = center[2] + Math.sin(a) * d
      if (clear.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) continue
      out.push({ x, z, h: range(rng, 9, 22), r: range(rng, 1.6, 3.4) })
    }
    return out
  }, [seed, count, inner, outer, obj.params])

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.15, 0.3, 1, 6).translate(0, 0.5, 0), [])
  const crownGeo = useMemo(() => new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), [])
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 1 }), [])
  const crownMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f1d1a', roughness: 1 }), [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    trees.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, 0, t.z), q, new THREE.Vector3(1, t.h * 0.35, 1))
      trunks.current?.setMatrixAt(i, m)
      for (let k = 0; k < 3; k++) {
        const s = t.r * (1 - k * 0.27)
        m.compose(new THREE.Vector3(t.x, t.h * (0.25 + k * 0.22), t.z), q, new THREE.Vector3(s, t.h * 0.42, s))
        crowns.current?.setMatrixAt(i * 3 + k, m)
      }
    })
    if (trunks.current) {
      trunks.current.instanceMatrix.needsUpdate = true
      trunks.current.computeBoundingSphere()
    }
    if (crowns.current) {
      crowns.current.instanceMatrix.needsUpdate = true
      crowns.current.computeBoundingSphere()
    }
  }, [trees])

  return (
    <group>
      <instancedMesh ref={trunks} args={[trunkGeo, trunkMat, trees.length]} raycast={() => null} />
      <instancedMesh ref={crowns} args={[crownGeo, crownMat, trees.length * 3]} raycast={() => null} castShadow />
    </group>
  )
}

/** Grade de ferro instanciada ao longo de x local, com abertura opcional (portão). */
export function Fence({ obj }: PropProps) {
  const length = num(obj.params, 'length', 40)
  const h = num(obj.params, 'height', 1.8)
  const gap = num(obj.params, 'gap', 0)
  const spacing = 0.16
  const bars = useRef<THREE.InstancedMesh>(null)
  const positions = useMemo(() => {
    const out: number[] = []
    for (let x = -length / 2; x <= length / 2; x += spacing) if (Math.abs(x) > gap / 2) out.push(x)
    return out
  }, [length, gap])
  const geo = useMemo(() => new THREE.BoxGeometry(0.025, h, 0.025).translate(0, h / 2, 0), [h])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    positions.forEach((x, i) => bars.current?.setMatrixAt(i, m.makeTranslation(x, 0, 0)))
    if (bars.current) {
      bars.current.instanceMatrix.needsUpdate = true
      bars.current.computeBoundingSphere()
    }
  }, [positions])
  const iron = material('iron')
  const side = (length - gap) / 2
  return (
    <RigidBody type="fixed" colliders={false}>
      <instancedMesh ref={bars} args={[geo, iron, positions.length]} raycast={() => null} />
      {[-1, 1].map((s) => (
        <group key={s}>
          {[0.15, h - 0.1].map((y) => (
            <mesh key={y} geometry={scaledBox(side, 0.04, 0.04)} material={iron} position={[s * (gap / 2 + side / 2), y, 0]} />
          ))}
          <CuboidCollider args={[side / 2, h / 2, 0.1]} position={[s * (gap / 2 + side / 2), h / 2, 0]} />
        </group>
      ))}
    </RigidBody>
  )
}

/** Pilares do portão + folha entreaberta. */
export function Gate({ obj }: PropProps) {
  const width = num(obj.params, 'width', 4)
  const stone = material('stone')
  const iron = material('iron')
  return (
    <RigidBody type="fixed" colliders={false}>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * (width + 0.6)) / 2, 0, 0]}>
          <mesh geometry={scaledBox(0.6, 2.6, 0.6, 1.2)} material={stone} position={[0, 1.3, 0]} castShadow />
          <mesh geometry={scaledBox(0.75, 0.15, 0.75)} material={stone} position={[0, 2.67, 0]} />
          <mesh position={[0, 2.9, 0]} material={stone}>
            <sphereGeometry args={[0.2, 12, 8]} />
          </mesh>
          <CuboidCollider args={[0.3, 1.3, 0.3]} position={[0, 1.3, 0]} />
        </group>
      ))}
      {/* folha esquerda aberta para dentro */}
      <group position={[-width / 2, 0, 0]} rotation={[0, -1.25, 0]}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} geometry={scaledBox(0.025, 2.1, 0.025)} material={iron} position={[0.1 + i * 0.16, 1.1, 0]} />
        ))}
        {[0.3, 1.9].map((y) => (
          <mesh key={y} geometry={scaledBox(1.95, 0.05, 0.03)} material={iron} position={[1, y, 0]} />
        ))}
      </group>
    </RigidBody>
  )
}

/**
 * Chuva em shader: segmentos que acompanham a câmera e nunca caem dentro dos volumes cobertos.
 */
export function Rain({ obj }: PropProps) {
  const count = num(obj.params, 'count', 5000)
  const geo = useMemo(() => {
    const rng = mulberry32(99)
    const offsets = new Float32Array(count * 2 * 3)
    const ends = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const x = rng() * 40
      const y = rng() * 24
      const z = rng() * 40
      for (let k = 0; k < 2; k++) {
        offsets.set([x, y, z], (i * 2 + k) * 3)
        ends[i * 2 + k] = k
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(offsets, 3))
    g.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1))
    return g
  }, [count])
  const mat = useMemo(() => {
    const exclude = (obj.params.exclude as [number, number, number, number][] | undefined) ?? []
    const boxes = exclude.slice(0, 4)
    while (boxes.length < 4) boxes.push([0, 0, 0, 0])
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCam: { value: new THREE.Vector3() },
        uBoxes: { value: boxes.map((b) => new THREE.Vector4(...b)) },
      },
      vertexShader: `
        uniform float uTime; uniform vec3 uCam; uniform vec4 uBoxes[4];
        attribute float aEnd; varying float vAlpha;
        void main(){
          vec3 p = position;
          p.xz = uCam.xz + mod(p.xz - uCam.xz + 20.0, 40.0) - 20.0;
          p.y = mod(p.y - uTime * 11.0, 24.0) + uCam.y - 9.0;
          vAlpha = 1.0;
          for (int i = 0; i < 4; i++) {
            vec4 b = uBoxes[i];
            if (p.x > b.x && p.x < b.z && p.z > b.y && p.z < b.w) vAlpha = 0.0;
          }
          p += aEnd * vec3(0.06, 0.55, 0.02);
          vAlpha *= 0.28 * (1.0 - smoothstep(10.0, 20.0, length(p.xz - uCam.xz)));
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `varying float vAlpha; void main(){ if (vAlpha <= 0.001) discard; gl_FragColor = vec4(0.68, 0.75, 0.82, vAlpha); }`,
    })
  }, [obj.params])
  useFrame(({ camera, clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    ;(mat.uniforms.uCam.value as THREE.Vector3).copy(camera.position)
  })
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} raycast={() => null} />
}

/** Janela iluminada (emissiva) numa fachada — "alguém ainda paga a luz". */
export function GlowWindow({ obj }: PropProps) {
  const [w, h] = [num(obj.params, 'width', 1), num(obj.params, 'height', 1.6)]
  const lit = str(obj.params, 'state', 'dark') === 'lit'
  return (
    <group>
      <mesh geometry={scaledBox(w + 0.16, h + 0.16, 0.08)} material={material('wood_trim')} />
      <mesh position={[0, 0, 0.045]} material={material(lit ? 'window_lit' : 'window_dark')}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh geometry={scaledBox(0.04, h, 0.02)} material={material('wood_trim')} position={[0, 0, 0.06]} />
      <mesh geometry={scaledBox(w, 0.04, 0.02)} material={material('wood_trim')} position={[0, h * 0.1, 0.06]} />
    </group>
  )
}
