import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { scaledBox } from '../geometry'
import { material } from '../materials'
import { drawnTexture, loadImageTexture } from '../textures'
import { num, str, type PropProps } from './params'
import { msgid, useTr } from '../../i18n'

/**
 * Objetos pequenos. Os modelos (KeyModel, LampModel…) são reutilizados no modo de inspeção 3D:
 * item.model = "proc:key" → models.key.
 */

export function KeyModel({ variant = 'iron' }: { variant?: 'iron' | 'brass' }) {
  const mat = material(variant === 'brass' ? 'brass' : 'iron')
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, 0.05]} material={mat}>
        <torusGeometry args={[0.022, 0.006, 8, 20]} />
      </mesh>
      <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <cylinderGeometry args={[0.004, 0.004, 0.1, 8]} />
      </mesh>
      <mesh position={[0.008, 0, -0.06]} material={mat}>
        <boxGeometry args={[0.016, 0.004, 0.018]} />
      </mesh>
    </group>
  )
}

export function LampModel({ lit = false }: { lit?: boolean }) {
  const brass = material('brass')
  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f3e3bd',
        transparent: true,
        opacity: lit ? 0.28 : 0.4,
        emissive: new THREE.Color('#ffb45e'),
        emissiveIntensity: lit ? 1.4 : 0,
        roughness: 0.05,
        depthWrite: false,
      }),
    [lit],
  )
  const flameMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.95, depthWrite: false }),
    [],
  )
  const flameCore = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#fff6dc', transparent: true, opacity: 1, depthWrite: false }),
    [],
  )
  const halo = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,200,110,0.85)')
    g.addColorStop(0.35, 'rgba(255,160,70,0.35)')
    g.addColorStop(1, 'rgba(255,140,50,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(c)
    return new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  }, [])
  return (
    <group>
      {/* base + reservatório */}
      <mesh position={[0, 0.012, 0]} material={brass}>
        <cylinderGeometry args={[0.07, 0.078, 0.024, 24]} />
      </mesh>
      <mesh position={[0, 0.06, 0]} material={brass}>
        <sphereGeometry args={[0.065, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.058, 0]} scale={[1, 0.55, 1]} material={brass}>
        <sphereGeometry args={[0.062, 24, 14]} />
      </mesh>
      <mesh position={[0, 0.103, 0]} material={brass}>
        <cylinderGeometry args={[0.032, 0.04, 0.026, 18]} />
      </mesh>
      {/* pavio */}
      <mesh position={[0, 0.125, 0]} material={brass}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 10]} />
      </mesh>
      {/* globo de vidro */}
      <mesh position={[0, 0.2, 0]} scale={[1, 1.3, 1]} material={glass} renderOrder={2}>
        <sphereGeometry args={[0.052, 24, 16]} />
      </mesh>
      {/* aros */}
      <mesh position={[0, 0.138, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
        <torusGeometry args={[0.036, 0.004, 8, 24]} />
      </mesh>
      <mesh position={[0, 0.268, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
        <torusGeometry args={[0.03, 0.004, 8, 24]} />
      </mesh>
      {/* tampa */}
      <mesh position={[0, 0.29, 0]} material={brass}>
        <coneGeometry args={[0.04, 0.035, 20]} />
      </mesh>
      <mesh position={[0, 0.315, 0]} material={brass}>
        <sphereGeometry args={[0.009, 10, 8]} />
      </mesh>
      {/* alça */}
      <mesh position={[0, 0.32, 0]} material={brass}>
        <torusGeometry args={[0.055, 0.004, 8, 24, Math.PI]} />
      </mesh>
      <mesh position={[-0.058, 0.075, 0]} rotation={[0, 0, Math.PI / 2]} material={brass}>
        <torusGeometry args={[0.03, 0.005, 8, 16, Math.PI]} />
      </mesh>
      {lit && (
        <group position={[0, 0.2, 0]}>
          <mesh position={[0, -0.04, 0]} scale={[1, 2.2, 1]} material={flameMat}>
            <sphereGeometry args={[0.016, 12, 10]} />
          </mesh>
          <mesh position={[0, -0.05, 0]} scale={[1, 1.8, 1]} material={flameCore}>
            <sphereGeometry args={[0.008, 10, 8]} />
          </mesh>
          <sprite position={[0, -0.03, 0]} scale={[0.5, 0.5, 1]} material={halo} />
        </group>
      )}
    </group>
  )
}

export function MatchboxModel() {
  const tex = useMemo(
    () =>
      drawnTexture('matchbox', 256, 128, (ctx, w, h) => {
        ctx.fillStyle = '#8a2a1e'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#e8d8a8'
        ctx.fillRect(10, 10, w - 20, h - 20)
        ctx.fillStyle = '#8a2a1e'
        ctx.font = 'bold 26px serif'
        ctx.textAlign = 'center'
        ctx.fillText("BELL'S", w / 2, 52)
        ctx.font = '16px serif'
        ctx.fillText('HARDWARE · BELLWEATHER', w / 2, 84)
      }),
    [],
  )
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), [tex])
  return (
    <mesh material={mat}>
      <boxGeometry args={[0.1, 0.02, 0.055]} />
    </mesh>
  )
}

export function KnobModel() {
  const brass = material('brass')
  return (
    <group>
      <mesh position={[0, 0, 0.02]} material={brass}>
        <sphereGeometry args={[0.03, 16, 12]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]} material={brass}>
        <cylinderGeometry args={[0.01, 0.012, 0.04, 10]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.035]} material={material('iron')}>
        <boxGeometry args={[0.008, 0.03, 0.008]} />
      </mesh>
    </group>
  )
}

export function CassetteModel() {
  const body = material('black')
  const label = material('paper')
  return (
    <group>
      <mesh material={body}>
        <boxGeometry args={[0.1, 0.012, 0.064]} />
      </mesh>
      <mesh position={[0, 0.0065, 0.005]} material={label}>
        <boxGeometry args={[0.08, 0.001, 0.03]} />
      </mesh>
    </group>
  )
}

/** Martelo de unha (arrancar pregos). Deitado no plano xz, cabo ao longo de x. */
export function HammerModel() {
  const wood = material('wood_worn')
  const iron = material('iron')
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh position={[0, -0.02, 0]} material={wood}>
        <cylinderGeometry args={[0.012, 0.014, 0.3, 10]} />
      </mesh>
      <mesh position={[0, 0.135, 0]} rotation={[0, 0, Math.PI / 2]} material={iron}>
        <cylinderGeometry args={[0.014, 0.014, 0.05, 10]} />
      </mesh>
      <mesh position={[-0.045, 0.14, 0]} rotation={[0, 0, -0.5]} material={iron}>
        <boxGeometry args={[0.06, 0.012, 0.014]} />
      </mesh>
    </group>
  )
}

export const models: Record<string, () => JSX.Element> = {
  hammer: () => <HammerModel />,
  key: () => <KeyModel />,
  key_brass: () => <KeyModel variant="brass" />,
  lamp: () => <LampModel />,
  matches: () => <MatchboxModel />,
  knob: () => <KnobModel />,
  cassette: () => <CassetteModel />,
}

// ------------------------------------------------------------------ props no mundo

export function KeyProp({ obj }: PropProps) {
  // O KeyModel fica "em pé" (bom para a inspeção); sobre uma superfície ele deita: desfaz a rotação e apoia no tampo.
  return (
    <group>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <KeyModel variant={str(obj.params, 'variant', 'iron') === 'brass' ? 'brass' : 'iron'} />
      </group>
      {/* etiqueta de papel */}
      <mesh position={[0.05, 0.002, 0.02]} rotation={[-Math.PI / 2, 0, 0.4]} material={material('paper')}>
        <planeGeometry args={[0.04, 0.025]} />
      </mesh>
    </group>
  )
}

export function HammerProp() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
      <HammerModel />
    </group>
  )
}

export function OilLampProp() {
  return <LampModel />
}

export function MatchboxProp() {
  return <MatchboxModel />
}

/** Texturas genéricas de "papel escrito" para documentos sobre mesas. */
function paperTexture(variant: string, addressee: string) {
  return drawnTexture(`paper:${variant}:${addressee}`, 256, 320, (ctx, w, h) => {
    ctx.fillStyle = variant === 'newspaper' ? '#cfc6ad' : variant === 'envelope' ? '#d8c69a' : '#e2d6b8'
    ctx.fillRect(0, 0, w, h)
    if (variant === 'envelope') {
      ctx.strokeStyle = 'rgba(80,60,30,0.4)'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(w / 2, h * 0.45)
      ctx.lineTo(w, 0)
      ctx.stroke()
      ctx.fillStyle = '#5a1a14'
      ctx.beginPath()
      ctx.arc(w / 2, h * 0.45, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(30,25,20,0.8)'
      ctx.font = 'italic 18px serif'
      ctx.textAlign = 'center'
      ctx.fillText(addressee, w / 2, h * 0.75)
      return
    }
    if (variant === 'newspaper') {
      ctx.fillStyle = 'rgba(20,20,20,0.85)'
      ctx.fillRect(16, 16, w - 32, 26)
      ctx.fillRect(16, 52, w - 32, 10)
      for (let c = 0; c < 3; c++) for (let y = 74; y < h - 16; y += 7) ctx.fillRect(16 + c * ((w - 32) / 3), y, (w - 44) / 3, 2.5)
      ctx.fillStyle = 'rgba(40,40,40,0.4)'
      ctx.fillRect(16 + (w - 32) / 3, 74, ((w - 32) / 3) * 2 - 8, 90)
      return
    }
    ctx.fillStyle = variant === 'report' ? 'rgba(20,20,30,0.7)' : 'rgba(30,25,60,0.55)'
    for (let y = 30; y < h - 30; y += variant === 'report' ? 10 : 14) {
      const len = (0.6 + ((y * 7919) % 37) / 100) * (w - 50)
      ctx.fillRect(24, y, len, variant === 'report' ? 2.5 : 2)
    }
    if (variant === 'report') {
      ctx.strokeStyle = 'rgba(30,30,90,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(w - 30, 60)
      for (let y = 60; y < 170; y += 12) ctx.lineTo(w - 24 - (y % 24), y)
      ctx.stroke()
    }
  })
}

export function Paper({ obj }: PropProps) {
  const variant = str(obj.params, 'variant', 'letter')
  const w = num(obj.params, 'width', variant === 'newspaper' ? 0.42 : variant === 'note' ? 0.1 : variant === 'envelope' ? 0.22 : 0.21)
  const d = num(obj.params, 'depth', variant === 'newspaper' ? 0.3 : variant === 'note' ? 0.075 : variant === 'envelope' ? 0.12 : 0.28)
  const layers = variant === 'report' ? 4 : 1
  const t = useTr()
  const addressee = t(msgid('The Heir'))
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: paperTexture(variant, addressee), roughness: 0.95 }), [variant, addressee])
  const edge = material('paper')
  return (
    <group>
      {Array.from({ length: layers }, (_, i) => (
        <mesh key={i} position={[i * 0.004, 0.001 + i * 0.0015, -i * 0.003]} rotation={[0, i * 0.03, 0]} material={i === layers - 1 ? mat : edge} receiveShadow>
          <boxGeometry args={[w, 0.0015, d]} />
        </mesh>
      ))}
    </group>
  )
}

/** Foto em porta-retrato de pé (ou deitada). Usa a imagem gerada se existir. */
export function PhotoFrame({ obj }: PropProps) {
  const image = str(obj.params, 'image', '')
  const w = num(obj.params, 'width', 0.24)
  const h = num(obj.params, 'height', 0.18)
  const tex = useImageOrPlaceholder(image, () =>
    drawnTexture(`photo-ph:${image}`, 320, 240, (ctx, cw, ch) => {
      const g = ctx.createLinearGradient(0, 0, 0, ch)
      g.addColorStop(0, '#6d5c44')
      g.addColorStop(1, '#2e251a')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, cw, ch)
      // seis silhuetas sentadas + um vazio recortado
      for (let i = 0; i < 7; i++) {
        const x = 28 + i * 44
        if (i === 4) {
          ctx.fillStyle = '#121212'
          ctx.fillRect(x - 18, 70, 36, 120)
          continue
        }
        ctx.fillStyle = 'rgba(20,15,10,0.85)'
        ctx.beginPath()
        ctx.arc(x, 105, 11, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(x - 16, 118, 32, 60)
      }
    }),
  )
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), [tex])
  const wood = material('wood_trim')
  return (
    <group rotation={[-0.25, 0, 0]} position={[0, h / 2 + 0.01, 0]}>
      <mesh geometry={scaledBox(w + 0.03, h + 0.03, 0.015)} material={wood} />
      <mesh position={[0, 0, 0.008]} material={mat}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  )
}

export function TapeRecorder() {
  const body = material('cloth_dark')
  const metal = material('iron')
  return (
    <group>
      <mesh geometry={scaledBox(0.34, 0.08, 0.24)} material={body} position={[0, 0.04, 0]} castShadow />
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.085, -0.02]} material={metal}>
          <cylinderGeometry args={[0.045, 0.045, 0.01, 20]} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.09 + i * 0.06, 0.085, 0.085]} material={metal}>
          <boxGeometry args={[0.04, 0.015, 0.03]} />
        </mesh>
      ))}
      <mesh position={[0, 0.0825, -0.02]} material={material('paper')}>
        <boxGeometry args={[0.06, 0.004, 0.02]} />
      </mesh>
    </group>
  )
}

/** Hook: textura de imagem gerada com fallback procedural imediato. */
export function useImageOrPlaceholder(src: string, placeholder: () => THREE.Texture): THREE.Texture {
  const fallback = useMemo(placeholder, [src]) // eslint-disable-line react-hooks/exhaustive-deps
  const [tex, setTex] = useState<THREE.Texture>(fallback)
  useEffect(() => {
    if (!src) return
    let alive = true
    void loadImageTexture(src).then((t) => alive && t && setTex(t))
    return () => {
      alive = false
    }
  }, [src])
  return tex
}
