import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { audio } from '../../audio/audioManager'
import { mulberry32 } from '../../core/rng'
import { useGame } from '../../state/gameStore'
import { scaledBox } from '../geometry'
import { material } from '../materials'
import { drawnTexture } from '../textures'
import { bool, num, str, type PropProps } from './params'
import { useImageOrPlaceholder } from './smallItems'

/** Placeholder de retrato a óleo: fundo escuro, silhueta, craquelado. Determinístico pela seed. */
function portraitPlaceholder(key: string, seed: number, kind: string, label: string) {
  return drawnTexture(`portrait:${key}`, 384, 512, (ctx, w, h) => {
    const rng = mulberry32(seed)
    const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.45, h * 0.7)
    g.addColorStop(0, kind === 'landscape' ? '#3d5a6c' : '#4a3d2c')
    g.addColorStop(1, '#0d0b09')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    if (kind === 'landscape') {
      ctx.fillStyle = '#141a20'
      ctx.beginPath()
      ctx.moveTo(0, h * 0.7)
      for (let x = 0; x <= w; x += 24) ctx.lineTo(x, h * (0.5 + rng() * 0.15))
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.fill()
    } else {
      ctx.fillStyle = 'rgba(15,12,9,0.92)'
      ctx.beginPath()
      ctx.ellipse(w / 2, h * 0.36, w * 0.13, h * 0.12, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(w * 0.18, h)
      ctx.quadraticCurveTo(w * 0.22, h * 0.52, w / 2, h * 0.5)
      ctx.quadraticCurveTo(w * 0.78, h * 0.52, w * 0.82, h)
      ctx.fill()
      // rosto apenas sugerido
      ctx.fillStyle = 'rgba(190,160,120,0.10)'
      ctx.beginPath()
      ctx.ellipse(w / 2, h * 0.37, w * 0.09, h * 0.085, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    for (let i = 0; i < 140; i++) {
      ctx.beginPath()
      const x = rng() * w
      const y = rng() * h
      ctx.moveTo(x, y)
      ctx.lineTo(x + (rng() - 0.5) * 20, y + (rng() - 0.5) * 20)
      ctx.stroke()
    }
    if (label) {
      ctx.fillStyle = 'rgba(217,201,163,0.35)'
      ctx.font = 'italic 16px serif'
      ctx.textAlign = 'center'
      ctx.fillText('[placeholder]', w / 2, h - 18)
    }
  })
}

function plaqueTexture(text: string) {
  return drawnTexture(`plaque:${text}`, 512, 96, (ctx, w, h) => {
    ctx.fillStyle = '#9c7a45'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#5a4423'
    ctx.lineWidth = 6
    ctx.strokeRect(4, 4, w - 8, h - 8)
    ctx.fillStyle = '#2a1d0c'
    ctx.font = '600 34px "Cormorant Garamond", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + 2)
  })
}

/**
 * Quadro (retrato/paisagem). `image` aponta para o asset gerado (public/media/...);
 * enquanto ele não existir, mostra um placeholder procedural. Frente = +z.
 */
export function Frame({ obj, seed }: PropProps) {
  const p = obj.params
  const w = num(p, 'width', 0.9)
  const h = num(p, 'height', 1.2)
  const image = str(p, 'image', '')
  const plaque = str(p, 'plaque', '')
  const kind = str(p, 'kind', 'portrait')
  const tex = useImageOrPlaceholder(image, () => portraitPlaceholder(obj.id ?? image, seed, kind, image))
  const canvasMat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }), [tex])
  const frame = material(str(p, 'frame', 'brass'))
  const b = num(p, 'border', 0.08)
  return (
    <group>
      <mesh geometry={scaledBox(w + b * 2, h + b * 2, 0.06)} material={frame} castShadow />
      <mesh position={[0, 0, 0.031]} material={canvasMat}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {plaque && (
        <mesh position={[0, -h / 2 - b - 0.07, 0.01]}>
          <planeGeometry args={[0.42, 0.08]} />
          <meshStandardMaterial map={plaqueTexture(plaque)} roughness={0.4} metalness={0.6} />
        </mesh>
      )}
    </group>
  )
}

/** Abajur de mesa (banker's lamp) com luz própria. Estado: world[interactable] = on|off. */
export function DeskLamp({ obj }: PropProps) {
  const key = obj.interactable ?? obj.id ?? ''
  const on = useGame((s) => s.world[key] === 'on')
  const light = useRef<THREE.PointLight>(null)
  const shade = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1f4a35', roughness: 0.3, emissive: new THREE.Color('#4a8a5a'), emissiveIntensity: 0 }),
    [],
  )
  const flicker = num(obj.params, 'flicker', 0.35)
  const intensity = num(obj.params, 'intensity', 3)
  useFrame(({ clock }) => {
    if (!light.current) return
    const t = clock.elapsedTime
    // Eletricidade instável: quedas ocasionais.
    const dip = Math.sin(t * 13.1) * Math.sin(t * 2.3) > 0.97 ? 0.25 : 1
    const n = 1 - flicker * 0.15 * (Math.sin(t * 31) * 0.5 + 0.5)
    light.current.intensity = on ? intensity * n * dip : 0
    shade.emissiveIntensity = on ? 0.6 * dip : 0
  })
  useEffect(() => {
    if (!on) return
    const [x, y, z] = obj.position
    const hum = audio.startLoop('lamp_hum', { position: [x, y + 0.4, z] })
    return () => hum.stop()
  }, [on, obj.position])
  const brass = material('brass')
  return (
    <group>
      <mesh position={[0, 0.015, 0]} material={brass}>
        <cylinderGeometry args={[0.08, 0.09, 0.03, 16]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={brass}>
        <cylinderGeometry args={[0.008, 0.008, 0.36, 8]} />
      </mesh>
      <mesh position={[0, 0.39, 0.03]} rotation={[Math.PI / 2 + 0.2, 0, 0]} material={shade}>
        <cylinderGeometry args={[0.06, 0.06, 0.32, 16, 1, true, 0, Math.PI]} />
      </mesh>
      <pointLight ref={light} position={[0, 0.34, 0.06]} color="#ffb45e" distance={num(obj.params, 'distance', 6)} decay={1.6} intensity={0} />
    </group>
  )
}

/**
 * Símbolo da Meridian Society. points = 7 (moderno) ou 8 (antigo).
 * style: carved (sulcos na pedra) | brass | ink.
 */
export function MeridianSymbol({ obj }: PropProps) {
  const points = num(obj.params, 'points', 8)
  const size = num(obj.params, 'size', 0.8)
  const style = str(obj.params, 'style', 'carved')
  const tex = useMemo(
    () =>
      drawnTexture(`symbol:${points}:${style}`, 512, 512, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h)
        const cx = w / 2
        const cy = h / 2
        const r = w * 0.32
        const color = style === 'brass' ? '#d8b878' : style === 'ink' ? '#1a1410' : 'rgba(8,8,10,0.85)'
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.lineWidth = w * 0.03
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx, cy - r * 1.35)
        ctx.lineTo(cx, cy + r * 1.35)
        ctx.stroke()
        for (let i = 0; i < points; i++) {
          // pontos ao redor do círculo, começando no topo
          const a = (i / points) * Math.PI * 2 + Math.PI / points
          ctx.beginPath()
          ctx.arc(cx + Math.sin(a) * r * 1.3, cy - Math.cos(a) * r * 1.3, w * 0.028, 0, Math.PI * 2)
          ctx.fill()
        }
        if (style === 'carved') {
          // realce de borda (luz rasante)
          ctx.globalCompositeOperation = 'destination-over'
          ctx.strokeStyle = 'rgba(200,190,170,0.15)'
          ctx.lineWidth = w * 0.045
          ctx.beginPath()
          ctx.arc(cx + 3, cy + 3, r, 0, Math.PI * 2)
          ctx.stroke()
        }
      }),
    [points, style],
  )
  return (
    <mesh>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} transparent depthWrite={false} roughness={0.9} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

/** Contrapeso de ferro numa corrente (explicação racional para as batidas na parede). */
export function Counterweight({ obj }: PropProps) {
  const len = num(obj.params, 'length', 1.6)
  const iron = material('iron')
  const swing = bool(obj.params, 'swing', true)
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (group.current && swing) group.current.rotation.z = Math.sin(clock.elapsedTime * 0.7) * 0.015
  })
  return (
    <group ref={group}>
      {Array.from({ length: Math.round(len / 0.06) }, (_, i) => (
        <mesh key={i} position={[0, -i * 0.06, 0]} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]} material={iron}>
          <torusGeometry args={[0.018, 0.005, 4, 8]} />
        </mesh>
      ))}
      <mesh geometry={scaledBox(0.2, 0.35, 0.2)} material={iron} position={[0, -len - 0.17, 0]} castShadow />
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={iron}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
      </mesh>
    </group>
  )
}

export function Crate({ obj, seed }: PropProps) {
  const s = num(obj.params, 'size', 0.6)
  const rng = mulberry32(seed)
  return (
    <mesh geometry={scaledBox(s, s * (0.8 + rng() * 0.3), s, 0.8)} material={material('wood_worn')} position={[0, s / 2, 0]} rotation={[0, rng() * 0.4, 0]} castShadow receiveShadow />
  )
}
