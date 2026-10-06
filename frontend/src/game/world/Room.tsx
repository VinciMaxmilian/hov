import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type * as THREE from 'three'
import type { OpeningDef, RoomDef, Side } from '../content/schemas'
import { registerTarget } from '../interaction/targets'
import { scaledBox } from './geometry'
import { material, tileOf } from './materials'

/**
 * Sala procedural: piso, teto e quatro paredes com aberturas (portas/janelas/passagens),
 * lambri opcional, molduras e colisores. Paredes crescem PARA FORA dos limites internos,
 * então duas salas vizinhas somam as espessuras (ver WORLD_MAP: parede real × planta).
 */

interface Piece {
  /** centro e meia-extensão em coordenadas de mundo */
  center: [number, number, number]
  size: [number, number, number]
  side: Side
}

interface WallInfo {
  side: Side
  /** eixo ao longo da parede */
  axis: 'x' | 'z'
  uMin: number
  uMax: number
  /** faixa perpendicular (espessura) */
  pMin: number
  pMax: number
  /** coordenada da face interna */
  inner: number
  /** sinal da normal interna no eixo perpendicular */
  normal: 1 | -1
}

function thicknessOf(room: RoomDef, side: Side): number {
  return typeof room.thickness === 'number' ? room.thickness : room.thickness[side]
}

export function wallsOf(room: RoomDef): WallInfo[] {
  const [x0, z0] = room.min
  const [x1, z1] = room.max
  const tN = thicknessOf(room, 'north')
  const tS = thicknessOf(room, 'south')
  const tE = thicknessOf(room, 'east')
  const tW = thicknessOf(room, 'west')
  const walls: WallInfo[] = [
    { side: 'north', axis: 'x', uMin: x0 - tW, uMax: x1 + tE, pMin: z0 - tN, pMax: z0, inner: z0, normal: 1 },
    { side: 'south', axis: 'x', uMin: x0 - tW, uMax: x1 + tE, pMin: z1, pMax: z1 + tS, inner: z1, normal: -1 },
    { side: 'west', axis: 'z', uMin: z0, uMax: z1, pMin: x0 - tW, pMax: x0, inner: x0, normal: 1 },
    { side: 'east', axis: 'z', uMin: z0, uMax: z1, pMin: x1, pMax: x1 + tE, inner: x1, normal: -1 },
  ]
  return walls.filter((w) => !room.skip.includes(w.side))
}

/**
 * Divide uma parede em retângulos sólidos ao redor das aberturas [u0, u1, v0, v1].
 * Subtração geral: aberturas podem se sobrepor ou ficar empilhadas (porta com janela alta em cima).
 * A parede é fatiada em colunas nos limites das aberturas; colunas vizinhas com o mesmo perfil são fundidas.
 */
export function wallRects(wall: Pick<WallInfo, 'side' | 'uMin' | 'uMax'>, height: number, openings: OpeningDef[]): [number, number, number, number][] {
  const ops = openings
    .filter((o) => o.side === wall.side)
    .map((o) => ({
      u0: Math.max(wall.uMin, o.center - o.width / 2),
      u1: Math.min(wall.uMax, o.center + o.width / 2),
      v0: Math.max(0, o.sill),
      v1: Math.min(height, o.sill + o.height),
    }))
    .filter((o) => o.u1 > o.u0 && o.v1 > o.v0)

  const cuts = [...new Set([wall.uMin, wall.uMax, ...ops.flatMap((o) => [o.u0, o.u1])])].sort((a, b) => a - b)

  // Perfil vertical sólido de cada coluna: [0, height] menos os vãos que cobrem a coluna inteira.
  const columns: { u0: number; u1: number; solid: [number, number][] }[] = []
  for (let i = 0; i < cuts.length - 1; i++) {
    const u0 = cuts[i]
    const u1 = cuts[i + 1]
    if (u1 - u0 < 1e-6) continue
    const mid = (u0 + u1) / 2
    const gaps = ops
      .filter((o) => o.u0 < mid && o.u1 > mid)
      .map((o) => [o.v0, o.v1] as [number, number])
      .sort((a, b) => a[0] - b[0])
    const solid: [number, number][] = []
    let v = 0
    for (const [g0, g1] of gaps) {
      if (g0 > v) solid.push([v, g0])
      v = Math.max(v, g1)
    }
    if (v < height) solid.push([v, height])
    const prev = columns[columns.length - 1]
    if (prev && Math.abs(prev.u1 - u0) < 1e-6 && JSON.stringify(prev.solid) === JSON.stringify(solid)) prev.u1 = u1
    else columns.push({ u0, u1, solid })
  }

  return columns
    .flatMap((c) => c.solid.map(([v0, v1]) => [c.u0, c.u1, v0, v1] as [number, number, number, number]))
    .filter(([a, b, c, d]) => b - a > 0.001 && d - c > 0.001)
}

function toPiece(wall: WallInfo, [u0, u1, v0, v1]: [number, number, number, number], floorY: number, inset = 0, depth?: number): Piece {
  const pMid = depth !== undefined ? wall.inner + wall.normal * (inset + depth / 2) : (wall.pMin + wall.pMax) / 2
  const pSize = depth ?? wall.pMax - wall.pMin
  const uMid = (u0 + u1) / 2
  const vMid = floorY + (v0 + v1) / 2
  return wall.axis === 'x'
    ? { center: [uMid, vMid, pMid], size: [u1 - u0, v1 - v0, pSize], side: wall.side }
    : { center: [pMid, vMid, uMid], size: [pSize, v1 - v0, u1 - u0], side: wall.side }
}

/** Índice da face interna no BoxGeometry (+x, -x, +y, -y, +z, -z); as demais faces usam o material externo. */
const INNER_FACE: Record<Side, number> = { north: 4, south: 5, west: 0, east: 1 }

export function Room({ room }: { room: RoomDef }) {
  const group = useRef<THREE.Group>(null)
  useLayoutEffect(() => (group.current ? registerTarget(group.current, null) : undefined), [])

  const built = useMemo(() => {
    const walls = wallsOf(room)
    const pieces: Piece[] = []
    const wainscot: Piece[] = []
    const fillers: Piece[] = []
    for (const wall of walls) {
      const rects = wallRects(wall, room.height, room.openings)
      for (const r of rects) {
        pieces.push(toPiece(wall, r, room.floorY))
        if (room.wainscot && r[2] < room.wainscot.height) {
          wainscot.push(toPiece(wall, [r[0], r[1], r[2], Math.min(r[3], room.wainscot.height)], room.floorY, 0, 0.035))
        }
      }
      // Janelas bloqueiam passagem.
      for (const o of room.openings.filter((op) => op.side === wall.side && op.kind === 'window')) {
        fillers.push(toPiece(wall, [o.center - o.width / 2, o.center + o.width / 2, o.sill, o.sill + o.height], room.floorY))
      }
    }
    return { walls, pieces, wainscot, fillers }
  }, [room])

  const wallMat = material(room.wall)
  const floorMat = material(room.floor)
  const [x0, z0] = room.min
  const [x1, z1] = room.max
  const w = x1 - x0
  const d = z1 - z0
  const mats = (side: Side) => {
    // Com face externa definida, os vãos (laterais/topo/base das peças) usam o material externo.
    const outerId = room.outer[side]
    const arr: THREE.Material[] = Array(6).fill(outerId ? material(outerId) : wallMat)
    arr[INNER_FACE[side]] = wallMat
    return arr
  }

  return (
    <group ref={group} name={`room:${room.id}`}>
      <RigidBody type="fixed" colliders={false}>
        {/* piso */}
        <mesh geometry={scaledBox(w, 0.2, d, tileOf(room.floor))} material={floorMat} position={[x0 + w / 2, room.floorY - 0.1, z0 + d / 2]} receiveShadow />
        <CuboidCollider args={[w / 2 + 0.3, 0.1, d / 2 + 0.3]} position={[x0 + w / 2, room.floorY - 0.1, z0 + d / 2]} />
        {/* teto */}
        {room.ceiling && (
          <>
            <mesh
              geometry={scaledBox(w, 0.2, d, tileOf(room.ceiling))}
              material={material(room.ceiling)}
              position={[x0 + w / 2, room.floorY + room.height + 0.1, z0 + d / 2]}
            />
            <CuboidCollider args={[w / 2, 0.1, d / 2]} position={[x0 + w / 2, room.floorY + room.height + 0.1, z0 + d / 2]} />
          </>
        )}
        {built.pieces.map((p, i) => (
          <group key={`p${i}`}>
            <mesh geometry={scaledBox(p.size[0], p.size[1], p.size[2], tileOf(room.wall))} material={mats(p.side)} position={p.center} receiveShadow castShadow />
            {!room.noCollide.includes(p.side) && <CuboidCollider args={[p.size[0] / 2, p.size[1] / 2, p.size[2] / 2]} position={p.center} />}
          </group>
        ))}
        {built.fillers.map((p, i) => (
          <CuboidCollider key={`f${i}`} args={[p.size[0] / 2, p.size[1] / 2, p.size[2] / 2]} position={p.center} />
        ))}
      </RigidBody>
      {room.wainscot &&
        built.wainscot.map((p, i) => (
          <mesh key={`w${i}`} geometry={scaledBox(p.size[0], p.size[1], p.size[2], tileOf(room.wainscot!.material))} material={material(room.wainscot!.material)} position={p.center} receiveShadow />
        ))}
      {room.openings.map((o, i) => {
        const wall = built.walls.find((wl) => wl.side === o.side)
        return wall ? <OpeningTrim key={`o${i}`} wall={wall} opening={o} floorY={room.floorY} /> : null
      })}
    </group>
  )
}

/** Molduras de portas/janelas e vidro. */
function OpeningTrim({ wall, opening: o, floorY }: { wall: WallInfo; opening: OpeningDef; floorY: number }) {
  const trim = material('wood_trim')
  const t = 0.09
  const depth = wall.pMax - wall.pMin + 0.04
  const u0 = o.center - o.width / 2
  const u1 = o.center + o.width / 2
  const v0 = o.sill
  const v1 = o.sill + o.height
  const rects: [number, number, number, number][] = [
    [u0 - t, u0, v0, v1 + t],
    [u1, u1 + t, v0, v1 + t],
    [u0, u1, v1, v1 + t],
  ]
  if (o.kind === 'window') rects.push([u0 - t, u1 + t, v0 - t, v0])
  if (o.kind === 'passage') return null
  const pieces = rects.map((r) => toPiece(wall, r, floorY, -0.02, depth))
  // centraliza a moldura na espessura da parede
  const mid = (wall.pMin + wall.pMax) / 2
  for (const p of pieces) {
    if (wall.axis === 'x') p.center[2] = mid
    else p.center[0] = mid
  }
  const glass = o.glass ? toPiece(wall, [u0, u1, v0, v1], floorY) : null
  if (glass) {
    if (wall.axis === 'x') glass.size[2] = 0.02
    else glass.size[0] = 0.02
  }
  const bars = o.glass
    ? [toPiece(wall, [o.center - 0.025, o.center + 0.025, v0, v1], floorY), toPiece(wall, [u0, u1, v0 + o.height * 0.55, v0 + o.height * 0.55 + 0.05], floorY)]
    : []
  for (const b of bars) {
    if (wall.axis === 'x') b.size[2] = 0.05
    else b.size[0] = 0.05
  }
  return (
    <group>
      {pieces.map((p, i) => (
        <mesh key={i} geometry={scaledBox(p.size[0], p.size[1], p.size[2])} material={trim} position={p.center} />
      ))}
      {glass && <mesh geometry={scaledBox(glass.size[0], glass.size[1], glass.size[2])} material={material('glass')} position={glass.center} />}
      {bars.map((b, i) => (
        <mesh key={`b${i}`} geometry={scaledBox(b.size[0], b.size[1], b.size[2])} material={trim} position={b.center} />
      ))}
    </group>
  )
}
