import type { Vec3 } from '../core/types'

/**
 * Estado contínuo do jogador (posição/câmera), mutado a cada frame fora do React.
 * O save copia daqui; o carregamento pede teleporte via `teleport`.
 */
export const playerRuntime = {
  position: [0, 0, 0] as Vec3,
  yaw: 0,
  pitch: 0,
  /** Incrementado a cada pedido de teleporte; o Player compara com o último que aplicou. */
  teleportSeq: 0,
  teleportTo: { position: [0, 0, 0] as Vec3, yaw: 0, pitch: 0 },
  /** Distância percorrida (para passos). */
  stride: 0,
}

export function teleport(position: Vec3, yaw: number, pitch = 0): void {
  playerRuntime.teleportTo = { position: [...position], yaw, pitch }
  playerRuntime.position = [...position]
  playerRuntime.yaw = yaw
  playerRuntime.pitch = pitch
  playerRuntime.teleportSeq++
}
