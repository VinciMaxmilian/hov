/**
 * Luz do dia a partir do relógio de jogo (fim de outubro, Oregon, céu encoberto).
 * 0 = noite, 1 = dia. Crepúsculo de ~1 h em cada ponta.
 */
export function daylight(minutes: number): number {
  const h = (((minutes / 60) % 24) + 24) % 24
  return smooth(6.9, 7.9, h) * (1 - smooth(17.6, 18.6, h))
}

function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
