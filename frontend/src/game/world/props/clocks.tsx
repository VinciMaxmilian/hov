import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { audio } from '../../audio/audioManager'
import { useGame } from '../../state/gameStore'
import { useUi } from '../../state/uiStore'
import { scaledBox } from '../geometry'
import { material } from '../materials'
import { drawnTexture } from '../textures'
import { num, str, type PropProps } from './params'

const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

function faceTexture() {
  return drawnTexture('clock-face', 512, 512, (ctx, w, h) => {
    const cx = w / 2
    const cy = h / 2
    ctx.fillStyle = '#d9cba6'
    ctx.beginPath()
    ctx.arc(cx, cy, w / 2, 0, Math.PI * 2)
    ctx.fill()
    const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, w / 2)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(60,40,10,0.35)')
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = '#2a2016'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(cx, cy, w / 2 - 14, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2
      const r0 = w / 2 - 22
      const r1 = r0 - (i % 5 === 0 ? 16 : 7)
      ctx.lineWidth = i % 5 === 0 ? 4 : 2
      ctx.beginPath()
      ctx.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0)
      ctx.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1)
      ctx.stroke()
    }
    ctx.fillStyle = '#1e1810'
    ctx.font = '600 46px "Cormorant Garamond", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ROMAN.forEach((n, i) => {
      const a = (i / 12) * Math.PI * 2
      const r = w / 2 - 82
      ctx.save()
      ctx.translate(cx + Math.sin(a) * r, cy - Math.cos(a) * r)
      ctx.rotate(a)
      ctx.fillText(n, 0, 0)
      ctx.restore()
    })
    ctx.font = 'italic 22px "Cormorant Garamond", serif'
    ctx.fillText('E. Vale · Bellweather', cx, cy + 92)
  })
}

/** Ponteiros: ângulo derivado do estado (horas/minutos). Pivô no centro do mostrador. */
function Hands({ hour, minute, radius }: { hour: number; minute: number; radius: number }) {
  const iron = material('black')
  const hourAngle = -(((hour % 12) + minute / 60) / 12) * Math.PI * 2
  const minAngle = -(minute / 60) * Math.PI * 2
  return (
    <group position={[0, 0, 0.012]}>
      <group rotation={[0, 0, hourAngle]}>
        <mesh geometry={scaledBox(radius * 0.06, radius * 0.55, 0.006)} material={iron} position={[0, radius * 0.22, 0]} />
      </group>
      <group rotation={[0, 0, minAngle]} position={[0, 0, 0.006]}>
        <mesh geometry={scaledBox(radius * 0.035, radius * 0.82, 0.006)} material={iron} position={[0, radius * 0.36, 0]} />
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]} material={material('brass')}>
        <cylinderGeometry args={[radius * 0.05, radius * 0.05, 0.01, 12]} />
      </mesh>
    </group>
  )
}

/**
 * Relógio de pé (puzzle do slice). Lê `puzzle` do estado: ponteiros = values.hour/minute;
 * pêndulo e tique-taque só depois de resolvido (o relógio "volta a contar").
 */
export function GrandfatherClock({ obj }: PropProps) {
  const puzzleId = str(obj.params, 'puzzle', '')
  const values = useGame((s) => s.puzzles[puzzleId]?.values)
  const solved = useGame((s) => s.puzzles[puzzleId]?.status === 'solved')
  const staticHour = num(obj.params, 'hour', 2)
  const staticMinute = num(obj.params, 'minute', 17)
  const hour = Number(values?.hour ?? staticHour)
  const minute = Number(values?.minute ?? staticMinute)
  const wood = material(str(obj.params, 'material', 'wood_dark'))
  const brass = material('brass')
  const glass = material('glass')
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: faceTexture(), roughness: 0.7 }), [])
  const pendulum = useRef<THREE.Group>(null)
  const swingPhase = useRef(0)

  useFrame((_, dt) => {
    if (!pendulum.current) return
    if (solved) swingPhase.current += dt * Math.PI
    pendulum.current.rotation.z = solved ? Math.sin(swingPhase.current) * 0.12 : 0.02
  })

  // Tique-taque espacial depois de resolvido.
  useEffect(() => {
    if (!solved) return
    const [x, y, z] = obj.position
    const loop = audio.startLoop('clock_tick_loop', { position: [x, y + 1.6, z] })
    return () => loop.stop()
  }, [solved, obj.position])

  const R = 0.2
  return (
    <group>
      {/* base, tronco, capitel */}
      <mesh geometry={scaledBox(0.62, 0.3, 0.42)} material={wood} position={[0, 0.15, 0]} castShadow />
      <mesh geometry={scaledBox(0.48, 1.25, 0.32)} material={wood} position={[0, 0.92, 0]} castShadow />
      <mesh geometry={scaledBox(0.6, 0.62, 0.4)} material={wood} position={[0, 1.85, 0]} castShadow />
      <mesh geometry={scaledBox(0.68, 0.08, 0.46)} material={wood} position={[0, 2.2, 0]} />
      <mesh geometry={scaledBox(0.3, 0.16, 0.3)} material={wood} position={[0, 2.32, 0]} />
      {/* janela do pêndulo */}
      <mesh geometry={scaledBox(0.26, 0.85, 0.01)} material={glass} position={[0, 0.98, 0.165]} />
      <group ref={pendulum} position={[0, 1.38, 0.13]}>
        <mesh geometry={scaledBox(0.012, 0.65, 0.008)} material={brass} position={[0, -0.33, 0]} />
        <mesh position={[0, -0.68, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
          <cylinderGeometry args={[0.07, 0.07, 0.015, 24]} />
        </mesh>
      </group>
      {/* mostrador */}
      <group position={[0, 1.86, 0.205]}>
        <mesh material={brass} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.004]}>
          <cylinderGeometry args={[R + 0.02, R + 0.02, 0.01, 40]} />
        </mesh>
        <mesh material={face} position={[0, 0, 0.002]}>
          <circleGeometry args={[R, 48]} />
        </mesh>
        <Hands hour={hour} minute={minute} radius={R} />
      </group>
    </group>
  )
}

/** Relógio de cornija com tique-taque espacial (o "relógio distante" do Hall). */
export function MantelClock({ obj }: PropProps) {
  const wood = material('wood_dark')
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: faceTexture(), roughness: 0.7 }), [])
  const playing = useUi((s) => s.mode !== 'title')
  const [h, m] = [num(obj.params, 'hour', 7), num(obj.params, 'minute', 40)]
  useEffect(() => {
    if (!playing) return
    const [x, y, z] = obj.position
    const loop = audio.startLoop('clock_tick_loop', { position: [x, y + 0.25, z], volume: num(obj.params, 'volume', 1) })
    return () => loop.stop()
  }, [playing, obj.position, obj.params])
  return (
    <group>
      <mesh geometry={scaledBox(0.34, 0.3, 0.14)} material={wood} position={[0, 0.15, 0]} castShadow />
      <mesh geometry={scaledBox(0.22, 0.1, 0.12)} material={wood} position={[0, 0.34, 0]} />
      <group position={[0, 0.17, 0.072]}>
        <mesh material={face}>
          <circleGeometry args={[0.1, 32]} />
        </mesh>
        <Hands hour={h} minute={m} radius={0.1} />
      </group>
    </group>
  )
}
