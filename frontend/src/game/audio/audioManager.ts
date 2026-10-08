import type { SoundDef } from '../content/schemas'
import type { Vec3 } from '../core/types'
import { loopers, makeNoiseBuffers, synths, type SynthCtx } from './synths'

/**
 * AudioManager (WebAudio). Camadas: ambiência (chuva/vento, abafada em interiores) e efeitos.
 * Áudio espacial com HRTF quando o som tem posição. Samples reais substituem os patches procedurais.
 */

export interface PlayOptions {
  position?: Vec3
  volume?: number
}

export interface LoopHandle {
  stop(): void
  setPosition(p: Vec3): void
}

class AudioManager {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private sfx!: GainNode
  private ambience!: GainNode
  private muffleFilter!: BiquadFilterNode
  private rainGain!: GainNode
  /** Sub-bus da chuva procedural (ruído filtrado); esmaecida se o sample real carregar. */
  private rainProcGain!: GainNode
  private windGain!: GainNode
  /** Mais de um buffer por id = variação aleatória a cada tocada. */
  private buffers = new Map<string, AudioBuffer[]>()
  private failed = new Set<string>()
  private noise!: AudioBuffer
  private brown!: AudioBuffer
  private defs = new Map<string, SoundDef>()
  private volume = 0.8
  private muffle = 0
  private thunderTimer: number | null = null
  private thunderListeners = new Set<(delayMs: number) => void>()

  /** Relâmpago: chamado antes do trovão (o som chega `delayMs` depois do clarão). */
  onThunder(fn: (delayMs: number) => void): () => void {
    this.thunderListeners.add(fn)
    return () => this.thunderListeners.delete(fn)
  }

  registerSounds(defs: Iterable<SoundDef>) {
    for (const d of defs) this.defs.set(d.id, d)
  }

  get ready(): boolean {
    return this.ctx !== null
  }

  /** Precisa ser chamado num gesto do usuário (política de autoplay). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    try {
      this.ctx = new AudioContext()
    } catch (err) {
      console.warn('[audio] WebAudio indisponível', err)
      return
    }
    const ctx = this.ctx
    this.master = ctx.createGain()
    this.master.gain.value = this.volume
    this.master.connect(ctx.destination)
    this.sfx = ctx.createGain()
    this.sfx.connect(this.master)
    this.ambience = ctx.createGain()
    this.muffleFilter = ctx.createBiquadFilter()
    this.muffleFilter.type = 'lowpass'
    this.muffleFilter.frequency.value = 16000
    this.ambience.connect(this.muffleFilter).connect(this.master)
    ;({ noise: this.noise, brown: this.brown } = makeNoiseBuffers(ctx))
    this.startWeather()
    void this.loadSamples()
    void this.loadRain()
  }

  setVolume(v: number) {
    this.volume = v
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
  }

  /** 0 = exterior (chuva plena), 1 = totalmente abafado. */
  setMuffle(m: number) {
    this.muffle = m
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.muffleFilter.frequency.setTargetAtTime(16000 * Math.pow(1 - m, 2.2) + 320, t, 0.6)
    this.rainGain.gain.setTargetAtTime(0.55 * (1 - m * 0.7), t, 0.6)
    this.windGain.gain.setTargetAtTime(0.35 * (1 - m * 0.8), t, 0.8)
  }

  /** Silencia a ambiência (abertura em tela preta / fim). */
  setAmbienceLevel(level: number, seconds = 1.5) {
    if (this.ctx) this.ambience.gain.setTargetAtTime(level, this.ctx.currentTime, seconds / 3)
  }

  updateListener(position: Vec3, forward: Vec3) {
    if (!this.ctx) return
    const l = this.ctx.listener
    if (l.positionX) {
      l.positionX.value = position[0]
      l.positionY.value = position[1]
      l.positionZ.value = position[2]
      l.forwardX.value = forward[0]
      l.forwardY.value = forward[1]
      l.forwardZ.value = forward[2]
      l.upX.value = 0
      l.upY.value = 1
      l.upZ.value = 0
    } else {
      l.setPosition(...position)
      l.setOrientation(forward[0], forward[1], forward[2], 0, 1, 0)
    }
  }

  play(id: string, opts: PlayOptions = {}): void {
    if (!this.ctx) return
    const def = this.defs.get(id)
    if (!def) {
      console.warn(`[audio] som desconhecido: ${id}`)
      return
    }
    const volume = def.volume * (opts.volume ?? 1)
    const dest = this.output(def, opts.position)
    const buffer = this.pickBuffer(id)
    if (buffer) {
      const src = this.ctx.createBufferSource()
      src.buffer = buffer
      const g = this.ctx.createGain()
      g.gain.value = volume
      src.connect(g).connect(dest)
      src.start()
      return
    }
    const synth = synths[def.synth]
    if (!synth) return console.warn(`[audio] patch inexistente: ${def.synth}`)
    synth(this.synthCtx(dest, volume))
  }

  startLoop(id: string, opts: PlayOptions = {}): LoopHandle {
    const noop: LoopHandle = { stop() {}, setPosition() {} }
    if (!this.ctx) return noop
    const def = this.defs.get(id)
    if (!def) return noop
    const volume = def.volume * (opts.volume ?? 1)
    const panner = opts.position ? this.makePanner(def, opts.position) : null
    const out = this.ctx.createGain()
    out.connect(panner ?? this.sfx)
    if (panner) panner.connect(this.sfx)
    let stopInner: () => void
    const buffer = this.pickBuffer(id)
    if (buffer) {
      const src = this.ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const g = this.ctx.createGain()
      g.gain.value = volume
      src.connect(g).connect(out)
      src.start()
      stopInner = () => src.stop()
    } else {
      const looper = loopers[def.synth]
      if (!looper) return noop
      stopInner = looper(this.synthCtx(out, volume))
    }
    return {
      stop: () => {
        stopInner()
        window.setTimeout(() => out.disconnect(), 1500)
      },
      setPosition: (p) => panner && setPannerPosition(panner, p),
    }
  }

  footstep(surface: string, volume = 1) {
    this.play(`footstep_${surface}`, { volume })
  }

  // ---------------------------------------------------------------- internos

  /** Escolhe um buffer (aleatório se houver variações) para o id, se o sample já carregou. */
  private pickBuffer(id: string): AudioBuffer | undefined {
    const arr = this.buffers.get(id)
    return arr && arr.length ? arr[(Math.random() * arr.length) | 0] : undefined
  }

  private synthCtx(dest: AudioNode, volume: number): SynthCtx {
    return { ctx: this.ctx!, dest, t: this.ctx!.currentTime + 0.005, volume, noise: this.noise, brown: this.brown }
  }

  private output(def: SoundDef, position?: Vec3): AudioNode {
    if (!position) return this.sfx
    const p = this.makePanner(def, position)
    p.connect(this.sfx)
    // Desconecta depois de tocar (sons one-shot têm no máximo alguns segundos).
    window.setTimeout(() => p.disconnect(), 9000)
    return p
  }

  private makePanner(def: SoundDef, position: Vec3): PannerNode {
    const p = this.ctx!.createPanner()
    p.panningModel = 'HRTF'
    p.distanceModel = 'inverse'
    p.refDistance = def.refDistance
    p.rolloffFactor = 1.3
    p.maxDistance = 60
    setPannerPosition(p, position)
    return p
  }

  private startWeather() {
    const ctx = this.ctx!
    // Chuva: ruído branco em duas bandas (esmaecida se o sample real carregar, ver loadRain()).
    this.rainGain = ctx.createGain()
    this.rainGain.gain.value = 0.55
    this.rainProcGain = ctx.createGain()
    this.rainProcGain.gain.value = 1
    this.rainProcGain.connect(this.rainGain)
    for (const [freq, q, gain] of [
      [1200, 0.4, 0.5],
      [5200, 0.8, 0.35],
    ] as const) {
      const src = ctx.createBufferSource()
      src.buffer = this.noise
      src.loop = true
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = freq
      f.Q.value = q
      const g = ctx.createGain()
      g.gain.value = gain
      src.connect(f).connect(g).connect(this.rainProcGain)
      src.start(0, Math.random() * 2)
    }
    this.rainGain.connect(this.ambience)
    // Vento: ruído marrom com filtro oscilante.
    this.windGain = ctx.createGain()
    this.windGain.gain.value = 0.35
    const wind = ctx.createBufferSource()
    wind.buffer = this.brown
    wind.loop = true
    const wf = ctx.createBiquadFilter()
    wf.type = 'bandpass'
    wf.frequency.value = 300
    wf.Q.value = 1.4
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.05
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 180
    lfo.connect(lfoGain).connect(wf.frequency)
    wind.connect(wf).connect(this.windGain).connect(this.ambience)
    wind.start()
    lfo.start()
    this.setMuffle(this.muffle)
    this.scheduleThunder()
  }

  private scheduleThunder() {
    if (this.thunderTimer) window.clearTimeout(this.thunderTimer)
    this.thunderTimer = window.setTimeout(() => {
      const delay = 300 + Math.random() * 1700
      this.thunderListeners.forEach((fn) => fn(delay))
      window.setTimeout(() => {
        if (!this.ctx || !this.defs.has('thunder')) return
        const def = this.defs.get('thunder')!
        const volume = def.volume * (0.5 + Math.random() * 0.5)
        const buffer = this.pickBuffer('thunder')
        if (buffer) {
          const src = this.ctx.createBufferSource()
          src.buffer = buffer
          const g = this.ctx.createGain()
          g.gain.value = volume
          src.connect(g).connect(this.ambience)
          src.start()
        } else {
          synths[def.synth]?.(this.synthCtx(this.ambience, volume))
        }
      }, delay)
      this.scheduleThunder()
    }, 45000 + Math.random() * 70000)
  }

  private async loadSamples() {
    for (const def of this.defs.values()) {
      if (!def.src || this.failed.has(def.id)) continue
      const srcs = Array.isArray(def.src) ? def.src : [def.src]
      const loaded: AudioBuffer[] = []
      for (const url of srcs) {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(String(res.status))
          loaded.push(await this.ctx!.decodeAudioData(await res.arrayBuffer()))
        } catch {
          // Sample ainda não gerado: ignora essa variação.
        }
      }
      if (loaded.length) this.buffers.set(def.id, loaded)
      else this.failed.add(def.id)
    }
  }

  /** Chuva gravada (se existir) substitui gradualmente o ruído filtrado procedural. */
  private async loadRain() {
    if (!this.ctx) return
    try {
      const res = await fetch(RAIN_SRC)
      if (!res.ok) throw new Error(String(res.status))
      const buf = await this.ctx.decodeAudioData(await res.arrayBuffer())
      if (!this.ctx) return
      const src = this.ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      const g = this.ctx.createGain()
      g.gain.value = 0
      src.connect(g).connect(this.rainGain)
      src.start()
      const t = this.ctx.currentTime
      g.gain.setTargetAtTime(1, t, 1.2)
      this.rainProcGain.gain.setTargetAtTime(0, t, 1.2)
    } catch {
      // Sem sample: mantém a chuva procedural.
    }
  }
}

const RAIN_SRC = '/media/audio/rain_ambience.mp3'

function setPannerPosition(p: PannerNode, [x, y, z]: Vec3) {
  if (p.positionX) {
    p.positionX.value = x
    p.positionY.value = y
    p.positionZ.value = z
  } else {
    p.setPosition(x, y, z)
  }
}

export const audio = new AudioManager()
