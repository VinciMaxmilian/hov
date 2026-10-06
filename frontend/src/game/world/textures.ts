import * as THREE from 'three'
import { mulberry32, type Rng } from '../core/rng'

/**
 * Texturas procedurais em canvas (placeholders estilizados, determinísticos por seed).
 * Troca futura: KTX2/WebP gerados — mesmo id de material, outra fonte.
 */
const cache = new Map<string, THREE.Texture>()
const SIZE = 512

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = c.height = SIZE
  return [c, c.getContext('2d')!]
}

function finish(c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function speckle(ctx: CanvasRenderingContext2D, rng: Rng, count: number, alpha: number, light = false) {
  for (let i = 0; i < count; i++) {
    const v = light ? 255 : 0
    ctx.fillStyle = `rgba(${v},${v},${v},${rng() * alpha})`
    ctx.fillRect(rng() * SIZE, rng() * SIZE, 1 + rng() * 3, 1 + rng() * 3)
  }
}

const shade = (hex: string, f: number) => {
  const c = new THREE.Color(hex)
  c.multiplyScalar(f)
  return `#${c.getHexString()}`
}

type Painter = (ctx: CanvasRenderingContext2D, rng: Rng, base: string) => void

const painters: Record<string, Painter> = {
  planks: (ctx, rng, base) => {
    const rows = 8
    const h = SIZE / rows
    for (let r = 0; r < rows; r++) {
      let x = -rng() * SIZE
      while (x < SIZE) {
        const w = SIZE * (0.4 + rng() * 0.6)
        ctx.fillStyle = shade(base, 0.8 + rng() * 0.4)
        ctx.fillRect(x, r * h, w, h)
        // veios
        for (let g = 0; g < 7; g++) {
          ctx.strokeStyle = `rgba(0,0,0,${0.08 + rng() * 0.12})`
          ctx.lineWidth = 1
          ctx.beginPath()
          const y = r * h + rng() * h
          ctx.moveTo(x, y)
          ctx.bezierCurveTo(x + w * 0.3, y + (rng() - 0.5) * 6, x + w * 0.7, y + (rng() - 0.5) * 6, x + w, y)
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(x, r * h, 2, h)
        x += w
      }
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, r * h, SIZE, 2)
    }
    speckle(ctx, rng, 900, 0.15)
  },
  panel: (ctx, rng, base) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let y = 0; y < SIZE; y += 3) {
      ctx.fillStyle = `rgba(0,0,0,${rng() * 0.08})`
      ctx.fillRect(0, y, SIZE, 2)
    }
    // almofadas (painéis vitorianos)
    const m = 40
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 6
    ctx.strokeRect(m, m, SIZE - 2 * m, SIZE - 2 * m)
    ctx.strokeStyle = 'rgba(255,220,180,0.08)'
    ctx.lineWidth = 2
    ctx.strokeRect(m + 6, m + 6, SIZE - 2 * m - 12, SIZE - 2 * m - 12)
    speckle(ctx, rng, 500, 0.12)
  },
  wallpaper: (ctx, rng, base) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, SIZE, SIZE)
    // listras + medalhões (damasco simplificado)
    for (let x = 0; x < SIZE; x += 64) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(x, 0, 6, SIZE)
      ctx.fillStyle = 'rgba(255,240,200,0.05)'
      ctx.fillRect(x + 30, 0, 2, SIZE)
    }
    for (let y = 0; y < SIZE; y += 128) {
      for (let x = 0; x < SIZE; x += 128) {
        const ox = (y / 128) % 2 === 0 ? 64 : 0
        ctx.save()
        ctx.translate(x + ox, y + 64)
        ctx.fillStyle = 'rgba(210,190,140,0.10)'
        for (let k = 0; k < 4; k++) {
          ctx.rotate(Math.PI / 2)
          ctx.beginPath()
          ctx.ellipse(0, 18, 8, 20, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(0, 0, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
    // manchas de umidade
    for (let i = 0; i < 6; i++) {
      const g = ctx.createRadialGradient(rng() * SIZE, rng() * SIZE, 0, rng() * SIZE, rng() * SIZE, 60 + rng() * 120)
      g.addColorStop(0, 'rgba(60,45,20,0.10)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SIZE, SIZE)
    }
    speckle(ctx, rng, 1500, 0.08)
  },
  plaster: (ctx, rng, base) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, SIZE, SIZE)
    speckle(ctx, rng, 4000, 0.07)
    speckle(ctx, rng, 2000, 0.05, true)
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.beginPath()
      let x = rng() * SIZE
      let y = rng() * SIZE
      ctx.moveTo(x, y)
      for (let k = 0; k < 8; k++) {
        x += (rng() - 0.5) * 40
        y += rng() * 25
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  },
  stone: (ctx, rng, base) => {
    ctx.fillStyle = shade(base, 0.6)
    ctx.fillRect(0, 0, SIZE, SIZE)
    const rows = 6
    const h = SIZE / rows
    for (let r = 0; r < rows; r++) {
      let x = r % 2 ? -h * 0.7 : 0
      while (x < SIZE) {
        const w = h * (1.2 + rng() * 1.1)
        ctx.fillStyle = shade(base, 0.75 + rng() * 0.45)
        ctx.fillRect(x + 3, r * h + 3, w - 6, h - 6)
        ctx.fillStyle = 'rgba(255,255,255,0.05)'
        ctx.fillRect(x + 3, r * h + 3, w - 6, 4)
        x += w
      }
    }
    speckle(ctx, rng, 3000, 0.18)
  },
  rough: (ctx, rng, base) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = shade(base, 0.6 + rng() * 0.8)
      ctx.globalAlpha = 0.25
      ctx.fillRect(rng() * SIZE, rng() * SIZE, 2 + rng() * 5, 2 + rng() * 5)
    }
    ctx.globalAlpha = 1
  },
  tiles: (ctx, rng, base) => {
    const n = 8
    const s = SIZE / n
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const dark = (x + y) % 2 === 0
        ctx.fillStyle = dark ? shade(base, 0.35 + rng() * 0.08) : shade(base, 0.95 + rng() * 0.1)
        ctx.fillRect(x * s, y * s, s, s)
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    for (let i = 0; i <= n; i++) {
      ctx.beginPath()
      ctx.moveTo(i * s, 0)
      ctx.lineTo(i * s, SIZE)
      ctx.moveTo(0, i * s)
      ctx.lineTo(SIZE, i * s)
      ctx.stroke()
    }
    speckle(ctx, rng, 2000, 0.12)
  },
  carpet: (ctx, rng, base) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.strokeStyle = 'rgba(200,160,90,0.35)'
    ctx.lineWidth = 10
    ctx.strokeRect(20, 20, SIZE - 40, SIZE - 40)
    ctx.lineWidth = 3
    ctx.strokeRect(44, 44, SIZE - 88, SIZE - 88)
    ctx.save()
    ctx.translate(SIZE / 2, SIZE / 2)
    for (let k = 0; k < 8; k++) {
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = 'rgba(150,40,30,0.35)'
      ctx.beginPath()
      ctx.ellipse(0, 90, 22, 70, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    speckle(ctx, rng, 6000, 0.12)
  },
}

/** Retorna (e cacheia) uma textura procedural. */
export function proceduralTexture(painter: string, base: string, seed = 1): THREE.Texture {
  const key = `${painter}:${base}:${seed}`
  const hit = cache.get(key)
  if (hit) return hit
  const [c, ctx] = canvas()
  ;(painters[painter] ?? painters.plaster)(ctx, mulberry32(seed), base)
  const tex = finish(c)
  cache.set(key, tex)
  return tex
}

/** Textura de canvas genérica desenhada por callback (relógios, placas, papéis). */
export function drawnTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.Texture {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!, w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  cache.set(key, tex)
  return tex
}

/**
 * Carrega uma imagem gerada (Higgsfield) com fallback procedural se o arquivo ainda não existir.
 * O fallback é devolvido imediatamente; quando a imagem real carrega, `onReady` troca o mapa.
 */
const imageCache = new Map<string, Promise<THREE.Texture | null>>()

export function loadImageTexture(src: string): Promise<THREE.Texture | null> {
  let p = imageCache.get(src)
  if (!p) {
    p = new Promise((resolve) => {
      new THREE.TextureLoader().load(
        src,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace
          t.anisotropy = 4
          resolve(t)
        },
        undefined,
        () => resolve(null),
      )
    })
    imageCache.set(src, p)
  }
  return p
}
