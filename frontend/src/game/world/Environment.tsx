import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { audio } from '../audio/audioManager'
import { content } from '../content'
import type { LightDef } from '../content/schemas'
import { evaluate } from '../rules/evaluate'
import { useGame } from '../state/gameStore'
import { daylight } from './daylight'
import { buildEstate } from './estate/build'
import { IA } from './interiorLight'

/**
 * Atmosfera e luz do mundo inteiro (sem recompilar shaders ao trocar de área):
 * céu/neblina/hemisfério/lua ou sol encoberto conforme o relógio de jogo, chuva, relâmpagos,
 * um POOL fixo de luzes pontuais alimentado pelas luzes das áreas (as mais próximas acendem)
 * e janelas acesas vistas de fora.
 */

interface Mode {
  fog: THREE.Color
  dens: number
  hs: THREE.Color
  hg: THREE.Color
  hi: number
  kc: THREE.Color
  ki: number
  env: number
  exp: number
  ia: number
  glass: number
}
const mode = (o: { fog: number; dens: number; hs: number; hg: number; hi: number; kc: number; ki: number; env: number; exp: number; ia: number; glass: number }): Mode => ({
  ...o,
  fog: new THREE.Color(o.fog),
  hs: new THREE.Color(o.hs),
  hg: new THREE.Color(o.hg),
  kc: new THREE.Color(o.kc),
})
// Valores do ambiente original (Claude Design), ajustados para jogo.
const DAY = mode({ fog: 0x66747d, dens: 0.0042, hs: 0x9aaebb, hg: 0x1e2722, hi: 1.3, kc: 0xc7d4de, ki: 0.9, env: 0.5, exp: 1.0, ia: 0.3, glass: 0.35 })
const NIGHT = mode({ fog: 0x0a1118, dens: 0.0075, hs: 0x22324a, hg: 0x07090a, hi: 0.75, kc: 0x7d93b5, ki: 0.42, env: 0.16, exp: 1.45, ia: 0.06, glass: 2.2 })

const POOL = 8

interface Source {
  def: LightDef
  pos: THREE.Vector3
}

const sources: Source[] = [...content.areas.values()].flatMap((a) =>
  a.lights.filter((l) => (l.type === 'point' || l.type === 'spot') && l.position).map((def) => ({ def, pos: new THREE.Vector3(...def.position!) })),
)

export function Environment() {
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)
  const estate = useMemo(() => buildEstate(), [])
  const hemi = useMemo(() => new THREE.HemisphereLight(0x9aaebb, 0x1e2722, 1.2), [])
  const key = useMemo(() => {
    const l = new THREE.DirectionalLight(0xc7d4de, 1)
    l.castShadow = true
    l.shadow.mapSize.set(2048, 2048)
    Object.assign(l.shadow.camera, { left: -46, right: 46, top: 46, bottom: -46, near: 1, far: 260 })
    l.shadow.camera.updateProjectionMatrix()
    l.shadow.bias = -0.0005
    l.shadow.normalBias = 0.05
    return l
  }, [])
  const bolt = useMemo(() => new THREE.DirectionalLight(0xd8e0ff, 0), [])
  const pool = useMemo(() => Array.from({ length: POOL }, () => new THREE.PointLight(0xffb46a, 0, 12, 2)), [])
  const fog = useMemo(() => new THREE.FogExp2(0x0a1118, 0.0075), [])
  const rain = useMemo(() => makeRain(), [])
  const flash = useRef<{ t: number } | null>(null)
  const assignT = useRef(0)
  const blend = useRef({ day: 0, inside: 0 })
  const tmp = useMemo(() => ({ fog: new THREE.Color(), c: new THREE.Color() }), [])

  useEffect(() => {
    scene.fog = fog
    scene.background = new THREE.Color(0x0a1118)
    // Ambiente para reflexos: gradiente céu/chão (como no original).
    const es = new THREE.Scene()
    const g = new THREE.SphereGeometry(10, 32, 16)
    const cols: number[] = []
    const c1 = new THREE.Color(0x8ea2ae)
    const c2 = new THREE.Color(0x1a2224)
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i) / 10
      const k = c2.clone().lerp(c1, THREE.MathUtils.smoothstep(y, -0.2, 0.6))
      cols.push(k.r, k.g, k.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })))
    const pm = new THREE.PMREMGenerator(gl)
    const envTex = pm.fromScene(es, 0.04).texture
    scene.environment = envTex
    pm.dispose()
    const off = audio.onThunder(() => {
      flash.current = { t: 0 }
      bolt.position.set((Math.random() - 0.5) * 300, 160, (Math.random() - 0.5) * 300)
    })
    return () => {
      off()
      scene.environment = null
      envTex.dispose()
    }
  }, [scene, gl, fog, bolt])

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const game = useGame.getState()
    const area = content.areas.get(game.player.area)
    const inside = area?.kind === 'interior' ? 1 : 0
    const b = blend.current
    b.day = THREE.MathUtils.damp(b.day, daylight(game.clock.minutes), 2, dt)
    b.inside = THREE.MathUtils.damp(b.inside, inside, 3, dt)
    const d = b.day
    const lerp = (a: number, c: number) => a + (c - a) * d

    // céu, neblina, luz de fora
    tmp.fog.copy(NIGHT.fog).lerp(DAY.fog, d)
    const areaFog = area?.fog
    if (areaFog) {
      tmp.c.set(areaFog.color)
      tmp.fog.lerp(tmp.c, b.inside)
    }
    fog.color.copy(tmp.fog)
    fog.density = THREE.MathUtils.lerp(lerp(NIGHT.dens, DAY.dens), areaFog?.density ?? lerp(NIGHT.dens, DAY.dens), b.inside)
    ;(scene.background as THREE.Color).copy(tmp.fog)
    hemi.color.copy(NIGHT.hs).lerp(DAY.hs, d)
    hemi.groundColor.copy(NIGHT.hg).lerp(DAY.hg, d)
    hemi.intensity = lerp(NIGHT.hi, DAY.hi)
    key.color.copy(NIGHT.kc).lerp(DAY.kc, d)
    // Dentro de casa a luz direta de fora atravessaria frestas da sombra: atenuada.
    key.intensity = lerp(NIGHT.ki, DAY.ki) * (1 - 0.65 * b.inside)
    scene.environmentIntensity = lerp(NIGHT.env, DAY.env)
    const ambient = area?.ambient ?? 1
    IA.value = lerp(NIGHT.ia, DAY.ia) * ambient
    gl.toneMappingExposure = lerp(NIGHT.exp, DAY.exp)

    // sombra da "lua" acompanha o jogador (texels alinhados para não tremer)
    const step = 92 / 2048
    const cx = Math.round(camera.position.x / step) * step
    const cz = Math.round(camera.position.z / step) * step
    key.target.position.set(cx, 0, cz)
    key.position.set(cx - 50, 110, cz + 42)
    key.target.updateMatrixWorld()

    // chuva (só ao ar livre)
    rain.lines.visible = inside === 0
    if (rain.lines.visible) rain.update(camera.position, dt, d)

    // relâmpago
    const f = flash.current
    if (f) {
      f.t += dt
      const t = f.t
      const k = t < 0.06 ? 1 : t < 0.14 ? 0.15 : t < 0.22 ? 0.85 : t < 0.5 ? Math.max(0, 0.85 - (t - 0.22) * 3) : 0
      bolt.intensity = k * 6 * (1 - 0.8 * b.inside)
      ;(scene.background as THREE.Color).lerp(tmp.c.set(0xc0c8d8), k * 0.5 * (1 - b.inside))
      if (t > 0.6) {
        flash.current = null
        bolt.intensity = 0
      }
    }

    // pool de luzes + janelas acesas (reavalia a cada 0,2 s)
    assignT.current -= dt
    if (assignT.current <= 0) {
      assignT.current = 0.2
      const active = sources.filter((s) => evaluate(s.def.when, game))
      const lit = new Set(active.map((s) => s.def.room).filter((r): r is string => Boolean(r)))
      for (const [room, m] of estate.roomGlass) m.emissiveIntensity = lit.has(room) ? lerp(NIGHT.glass, DAY.glass) : 0
      active.sort((p, q) => p.pos.distanceToSquared(camera.position) - q.pos.distanceToSquared(camera.position))
      pool.forEach((l, i) => {
        const s = active[i]
        l.userData.src = s ?? null
        if (!s) {
          l.intensity = 0
          return
        }
        l.position.copy(s.pos)
        l.color.set(s.def.color)
        l.distance = s.def.distance ?? 10
        l.decay = s.def.decay ?? 2
      })
    }
    const time = performance.now() / 1000
    for (const l of pool) {
      const s = l.userData.src as Source | null
      if (!s) continue
      const fl = s.def.flicker
      const n = fl > 0 ? Math.sin(time * 7.3 + s.pos.x) * 0.5 + Math.sin(time * 17.9 + 1.3) * 0.3 + Math.sin(time * 3.1) * 0.2 : 0
      l.intensity = s.def.intensity * (1 - fl * 0.35 * (n * 0.5 + 0.5))
    }
  })

  return (
    <>
      <primitive object={hemi} />
      <primitive object={key} />
      <primitive object={key.target} />
      <primitive object={bolt} />
      {pool.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
      <primitive object={rain.lines} />
    </>
  )
}

/** Chuva em linhas ao redor da câmera (do original). */
function makeRain() {
  const N = 5000
  const pos = new Float32Array(N * 6)
  const off = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    off[i * 3] = (Math.random() - 0.5) * 100
    off[i * 3 + 1] = Math.random() * 40
    off[i * 3 + 2] = (Math.random() - 0.5) * 100
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.LineBasicMaterial({ color: 0x4c5d70, transparent: true, opacity: 0.3 })
  const lines = new THREE.LineSegments(geo, mat)
  lines.frustumCulled = false
  const night = new THREE.Color(0x4c5d70)
  const day = new THREE.Color(0xa8b9c5)
  return {
    lines,
    update(c: THREE.Vector3, dt: number, d: number) {
      mat.color.copy(night).lerp(day, d)
      for (let i = 0; i < N; i++) {
        let y = off[i * 3 + 1] - 11 * dt
        if (y < 0) y += 40
        off[i * 3 + 1] = y
        const x = c.x + off[i * 3]
        const z = c.z + off[i * 3 + 2]
        const o = i * 6
        pos[o] = x
        pos[o + 1] = c.y - 14 + y
        pos[o + 2] = z
        pos[o + 3] = x + 0.06
        pos[o + 4] = c.y - 14 + y + 0.6
        pos[o + 5] = z + 0.02
      }
      geo.attributes.position.needsUpdate = true
    },
  }
}
