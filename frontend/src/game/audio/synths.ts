/**
 * Patches procedurais (placeholders sonoros). Cada um agenda nós WebAudio num destino.
 * Quando um sample real existir (SoundDef.src), o AudioManager o usa no lugar do patch.
 */

export interface SynthCtx {
  ctx: AudioContext
  dest: AudioNode
  t: number
  volume: number
  noise: AudioBuffer
  brown: AudioBuffer
}

type Synth = (s: SynthCtx) => void

function env(ctx: AudioContext, t: number, attack: number, decay: number, peak: number): GainNode {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return g
}

function noiseSource(s: SynthCtx, buffer = s.noise, offset = Math.random()): AudioBufferSourceNode {
  const src = s.ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  src.loopStart = 0
  src.loopEnd = buffer.duration
  src.start(s.t, offset * (buffer.duration - 0.5))
  return src
}

function filter(ctx: AudioContext, type: BiquadFilterType, freq: number, q = 1): BiquadFilterNode {
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  return f
}

/** Rajada de ruído filtrado. */
function burst(s: SynthCtx, opts: { at?: number; type?: BiquadFilterType; freq: number; q?: number; attack?: number; decay: number; gain: number; buffer?: AudioBuffer }) {
  const t = s.t + (opts.at ?? 0)
  const src = noiseSource({ ...s, t }, opts.buffer)
  const f = filter(s.ctx, opts.type ?? 'bandpass', opts.freq, opts.q ?? 1)
  const g = env(s.ctx, t, opts.attack ?? 0.002, opts.decay, opts.gain * s.volume)
  src.connect(f).connect(g).connect(s.dest)
  src.stop(t + (opts.attack ?? 0.002) + opts.decay + 0.05)
}

/** Tom com envelope (seno/triângulo). */
function tone(s: SynthCtx, opts: { at?: number; freq: number; endFreq?: number; type?: OscillatorType; attack?: number; decay: number; gain: number }) {
  const t = s.t + (opts.at ?? 0)
  const o = s.ctx.createOscillator()
  o.type = opts.type ?? 'sine'
  o.frequency.setValueAtTime(opts.freq, t)
  if (opts.endFreq) o.frequency.exponentialRampToValueAtTime(opts.endFreq, t + (opts.attack ?? 0.005) + opts.decay)
  const g = env(s.ctx, t, opts.attack ?? 0.005, opts.decay, opts.gain * s.volume)
  o.connect(g).connect(s.dest)
  o.start(t)
  o.stop(t + (opts.attack ?? 0.005) + opts.decay + 0.05)
}

function bell(s: SynthCtx, at: number, base: number, gain: number, decay: number) {
  // Parciais inarmônicos de sino.
  for (const [ratio, amp] of [
    [1, 1],
    [2.0, 0.5],
    [2.76, 0.35],
    [5.4, 0.18],
    [8.93, 0.08],
  ] as const) {
    tone(s, { at, freq: base * ratio, decay: decay / Math.sqrt(ratio), gain: gain * amp, attack: 0.004 })
  }
}

const footstep = (freq: number, decay: number, gain: number, low: number): Synth => (s) => {
  const v = 0.85 + Math.random() * 0.3
  burst(s, { freq: freq * v, q: 0.8, decay, gain })
  tone(s, { freq: low * v, endFreq: low * 0.6, decay: decay * 0.8, gain: gain * 0.6 })
}

export const synths: Record<string, Synth> = {
  tick: (s) => {
    burst(s, { type: 'highpass', freq: 3500, decay: 0.03, gain: 0.5 })
    tone(s, { freq: 1900, decay: 0.03, gain: 0.15 })
  },
  tock: (s) => {
    burst(s, { type: 'bandpass', freq: 1800, q: 2, decay: 0.04, gain: 0.5 })
    tone(s, { freq: 1300, decay: 0.035, gain: 0.15 })
  },
  clock_hand: (s) => {
    burst(s, { type: 'highpass', freq: 4000, decay: 0.015, gain: 0.35 })
    burst(s, { at: 0.03, type: 'bandpass', freq: 2500, q: 3, decay: 0.02, gain: 0.25 })
  },
  chime: (s) => {
    // Duas badaladas (2 horas) — o relógio "conta" a hora.
    bell(s, 0, 196, 0.32, 3.6)
    bell(s, 1.6, 196, 0.3, 3.6)
  },
  chime_dull: (s) => {
    bell(s, 0, 174.6, 0.22, 1.4)
    burst(s, { at: 0.02, type: 'lowpass', freq: 300, decay: 0.3, gain: 0.3, buffer: s.brown })
  },
  mech_click: (s) => {
    for (let i = 0; i < 4; i++) burst(s, { at: i * 0.11, type: 'highpass', freq: 2500 + i * 300, decay: 0.03, gain: 0.6 })
    tone(s, { at: 0.5, freq: 90, endFreq: 40, decay: 0.5, gain: 0.7 })
    burst(s, { at: 0.5, type: 'lowpass', freq: 400, decay: 0.4, gain: 0.6, buffer: s.brown })
  },
  stone_grind: (s) => {
    const t = s.t
    const src = noiseSource(s, s.brown)
    const f = filter(s.ctx, 'lowpass', 260, 2)
    f.frequency.setValueAtTime(180, t)
    f.frequency.linearRampToValueAtTime(420, t + 1.5)
    f.frequency.linearRampToValueAtTime(160, t + 3.6)
    const g = s.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.9 * s.volume, t + 0.4)
    g.gain.setValueAtTime(0.9 * s.volume, t + 3.0)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.8)
    src.connect(f).connect(g).connect(s.dest)
    src.stop(t + 4)
    tone(s, { at: 3.6, freq: 70, endFreq: 35, decay: 0.6, gain: 0.8 })
  },
  door_open: (s) => {
    burst(s, { type: 'bandpass', freq: 2200, q: 4, decay: 0.05, gain: 0.4 })
    // Rangido: dente-de-serra filtrado com glissando irregular.
    const t = s.t + 0.08
    const o = s.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(240, t)
    o.frequency.linearRampToValueAtTime(330, t + 0.35)
    o.frequency.linearRampToValueAtTime(210, t + 0.9)
    const f = filter(s.ctx, 'bandpass', 900, 6)
    const g = env(s.ctx, t, 0.08, 0.9, 0.12 * s.volume)
    o.connect(f).connect(g).connect(s.dest)
    o.start(t)
    o.stop(t + 1.1)
  },
  door_close: (s) => {
    tone(s, { freq: 80, endFreq: 45, decay: 0.45, gain: 0.9 })
    burst(s, { type: 'lowpass', freq: 600, decay: 0.3, gain: 0.7, buffer: s.brown })
    burst(s, { at: 0.04, type: 'bandpass', freq: 2400, q: 3, decay: 0.05, gain: 0.3 })
  },
  door_locked: (s) => {
    for (let i = 0; i < 3; i++) burst(s, { at: i * 0.09, type: 'bandpass', freq: 1500 + i * 200, q: 5, decay: 0.04, gain: 0.5 })
    tone(s, { at: 0.02, freq: 110, decay: 0.12, gain: 0.3 })
  },
  unlock: (s) => {
    burst(s, { type: 'bandpass', freq: 2800, q: 4, decay: 0.04, gain: 0.5 })
    burst(s, { at: 0.18, type: 'bandpass', freq: 1700, q: 3, decay: 0.08, gain: 0.7 })
    tone(s, { at: 0.18, freq: 160, decay: 0.12, gain: 0.3 })
  },
  knock: (s) => {
    for (const at of [0, 0.42, 0.84]) {
      tone(s, { at, freq: 95, endFreq: 55, decay: 0.22, gain: 1 })
      burst(s, { at, type: 'lowpass', freq: 500, decay: 0.12, gain: 0.6, buffer: s.brown })
    }
  },
  match: (s) => {
    burst(s, { type: 'highpass', freq: 2500, attack: 0.01, decay: 0.25, gain: 0.7 })
    burst(s, { at: 0.2, type: 'bandpass', freq: 900, q: 0.6, attack: 0.05, decay: 0.8, gain: 0.25 })
  },
  lamp_off: (s) => burst(s, { type: 'bandpass', freq: 700, q: 0.7, attack: 0.01, decay: 0.25, gain: 0.3 }),
  paper: (s) => {
    for (let i = 0; i < 3; i++) burst(s, { at: i * 0.07 + Math.random() * 0.03, type: 'bandpass', freq: 3000 + Math.random() * 2000, q: 0.7, attack: 0.01, decay: 0.09, gain: 0.25 })
  },
  pickup: (s) => {
    burst(s, { type: 'bandpass', freq: 1200, q: 1, decay: 0.08, gain: 0.3 })
    tone(s, { freq: 220, decay: 0.08, gain: 0.15 })
  },
  drawer: (s) => {
    burst(s, { type: 'bandpass', freq: 500, q: 0.8, attack: 0.05, decay: 0.45, gain: 0.5, buffer: s.brown })
    tone(s, { at: 0.42, freq: 120, decay: 0.12, gain: 0.4 })
  },
  switch: (s) => {
    burst(s, { type: 'highpass', freq: 3000, decay: 0.02, gain: 0.6 })
    tone(s, { freq: 900, decay: 0.02, gain: 0.2 })
  },
  tape_button: (s) => {
    burst(s, { type: 'bandpass', freq: 1800, q: 2, decay: 0.04, gain: 0.6 })
    tone(s, { at: 0.01, freq: 140, decay: 0.08, gain: 0.4 })
  },
  thunder: (s) => {
    const t = s.t
    const src = noiseSource(s, s.brown)
    const f = filter(s.ctx, 'lowpass', 220, 0.7)
    const g = s.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.9 * s.volume, t + 0.6)
    g.gain.exponentialRampToValueAtTime(0.35 * s.volume, t + 2)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 6)
    src.connect(f).connect(g).connect(s.dest)
    src.stop(t + 6.2)
  },
  creak: (s) => {
    const t = s.t
    const o = s.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(140, t)
    o.frequency.linearRampToValueAtTime(180, t + 0.5)
    o.frequency.linearRampToValueAtTime(120, t + 1.1)
    const f = filter(s.ctx, 'bandpass', 600, 8)
    const g = env(s.ctx, t, 0.2, 1, 0.08 * s.volume)
    o.connect(f).connect(g).connect(s.dest)
    o.start(t)
    o.stop(t + 1.3)
  },
  breath: (s) => burst(s, { type: 'bandpass', freq: 700, q: 0.5, attack: 0.5, decay: 0.9, gain: 0.08 }),
  footstep_wood: footstep(900, 0.09, 0.35, 120),
  footstep_stone: footstep(2200, 0.06, 0.3, 200),
  footstep_gravel: (s) => {
    for (let i = 0; i < 3; i++) burst(s, { at: i * 0.025, type: 'bandpass', freq: 2500 + Math.random() * 2500, q: 1.2, decay: 0.05, gain: 0.25 })
  },
  footstep_carpet: footstep(500, 0.08, 0.18, 90),
  ui: (s) => tone(s, { freq: 660, decay: 0.08, gain: 0.06 }),
}

// ------------------------------------------------------------------ loops

export type Looper = (s: SynthCtx) => () => void

export const loopers: Record<string, Looper> = {
  clock_tick_loop: (s) => {
    let n = 0
    const fire = () => {
      const synth = n++ % 2 === 0 ? synths.tick : synths.tock
      synth({ ...s, t: s.ctx.currentTime + 0.02 })
    }
    fire()
    const id = window.setInterval(fire, 1000)
    return () => window.clearInterval(id)
  },
  hum: (s) => {
    const o = s.ctx.createOscillator()
    o.frequency.value = 60
    const o2 = s.ctx.createOscillator()
    o2.frequency.value = 120
    const g = s.ctx.createGain()
    g.gain.value = 0.03 * s.volume
    o.connect(g)
    o2.connect(g)
    g.connect(s.dest)
    o.start()
    o2.start()
    return () => {
      g.gain.setTargetAtTime(0, s.ctx.currentTime, 0.05)
      o.stop(s.ctx.currentTime + 0.3)
      o2.stop(s.ctx.currentTime + 0.3)
    }
  },
  tape_hiss: (s) => {
    const src = noiseSource({ ...s, t: s.ctx.currentTime })
    const f = filter(s.ctx, 'highpass', 4000, 0.5)
    const g = s.ctx.createGain()
    g.gain.value = 0.05 * s.volume
    src.connect(f).connect(g).connect(s.dest)
    return () => {
      g.gain.setTargetAtTime(0, s.ctx.currentTime, 0.05)
      src.stop(s.ctx.currentTime + 0.3)
    }
  },
  drip_loop: (s) => {
    const fire = () => tone({ ...s, t: s.ctx.currentTime + 0.01 }, { freq: 1400 + Math.random() * 600, endFreq: 700, decay: 0.08, gain: 0.12 })
    const id = window.setInterval(() => Math.random() < 0.55 && fire(), 2300)
    return () => window.clearInterval(id)
  },
  wind_draft: (s) => {
    const src = noiseSource({ ...s, t: s.ctx.currentTime }, s.brown)
    const f = filter(s.ctx, 'bandpass', 380, 3)
    const lfo = s.ctx.createOscillator()
    lfo.frequency.value = 0.09
    const lfoGain = s.ctx.createGain()
    lfoGain.gain.value = 160
    lfo.connect(lfoGain).connect(f.frequency)
    const g = s.ctx.createGain()
    g.gain.value = 0.22 * s.volume
    src.connect(f).connect(g).connect(s.dest)
    lfo.start()
    return () => {
      g.gain.setTargetAtTime(0, s.ctx.currentTime, 0.2)
      src.stop(s.ctx.currentTime + 1)
      lfo.stop(s.ctx.currentTime + 1)
    }
  },
}

export function makeNoiseBuffers(ctx: AudioContext): { noise: AudioBuffer; brown: AudioBuffer } {
  const len = ctx.sampleRate * 3
  const noise = ctx.createBuffer(1, len, ctx.sampleRate)
  const brown = ctx.createBuffer(1, len, ctx.sampleRate)
  const n = noise.getChannelData(0)
  const b = brown.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    n[i] = w
    last = (last + 0.02 * w) / 1.02
    b[i] = last * 3.5
  }
  return { noise, brown }
}
