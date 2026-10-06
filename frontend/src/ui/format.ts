/** Formatações de UI (tempo de jogo, relógio diegético). */

export function formatPlaytime(sec: number): string {
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return [h, m, r].map((n) => String(n).padStart(2, '0')).join(':')
}

const DAYS = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']

/** Dia 1 = quinta, 22 de outubro de 1998. */
export function formatGameClock(day: number, minutes: number): string {
  const date = 21 + day
  const h24 = Math.floor(minutes / 60) % 24
  const m = Math.floor(minutes % 60)
  const h12 = ((h24 + 11) % 12) + 1
  const ampm = h24 < 12 ? 'AM' : 'PM'
  return `Day ${day} · ${DAYS[(day - 1) % 8]} ${date} Oct 1998 · ${h12}:${String(m).padStart(2, '0')} ${ampm}`
}
