import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { registerTarget } from '../interaction/targets'
import { buildEstate, collisionChunks, type Estate } from './estate/build'

/** Raio (m) da cerca invisível da propriedade: a floresta continua, mas o jogo termina aqui. */
export const ESTATE_RADIUS = 232

/**
 * A propriedade procedural (casa, anexos, terreno, floresta, subterrâneo): renderização sempre montada
 * (não depende de streaming de área) + colisão estática no Rapier.
 */
export function EstateView() {
  const estate = useMemo(() => buildEstate(), [])
  const tick = useRef(0)
  const clock = useRef(0)

  // Paredes, pisos e móveis bloqueiam o raio de interação (não se interage através de paredes).
  useLayoutEffect(() => {
    const offs = [...new Set([...estate.colliders, ...estate.walkables])].map((m) => registerTarget(m, null))
    return () => offs.forEach((off) => off())
  }, [estate])

  // Chuva constante: superfícies externas sempre molhadas.
  useEffect(() => {
    for (const m of estate.outdoorMats) {
      const base = m.userData.base as { r: number; c: THREE.Color } | undefined
      if (!base) continue
      const k = Number(m.userData.wet ?? 1)
      m.roughness = base.r * (1 - 0.6 * k)
      m.color.copy(base.c).multiplyScalar(1 - 0.22 * k)
    }
  }, [estate])

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    clock.current += dt
    for (const a of estate.animators) a(dt, clock.current)
    tick.current -= dt
    if (tick.current > 0) return
    tick.current = 0.25
    // Interiores distantes não são desenhados (as fachadas continuam).
    for (const ig of estate.interiorGroups) {
      const [x, y, z] = ig.c
      ig.g.visible = camera.position.distanceTo(new THREE.Vector3(x, y, z)) < 140
    }
  })

  return (
    <>
      <primitive object={estate.model} />
      <EstatePhysics estate={estate} />
    </>
  )
}

function EstatePhysics({ estate }: { estate: Estate }) {
  const { world, rapier } = useRapier()
  useEffect(() => {
    const body = world.createRigidBody(rapier.RigidBodyDesc.fixed())
    for (const ch of collisionChunks(estate)) world.createCollider(rapier.ColliderDesc.trimesh(ch.vertices, ch.indices), body)
    for (const [x, z, r] of estate.trunks) {
      if (x * x + z * z < (ESTATE_RADIUS + 8) ** 2) world.createCollider(rapier.ColliderDesc.cylinder(4, r).setTranslation(x, 4, z), body)
    }
    // Cerca invisível: anel de caixas.
    const N = 72
    const seg = ((2 * Math.PI * ESTATE_RADIUS) / N) * 0.55 + 0.5
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2 - a) // eixo x da caixa = tangente
      world.createCollider(
        rapier.ColliderDesc.cuboid(seg, 6, 0.5)
          .setTranslation(Math.cos(a) * ESTATE_RADIUS, 4, Math.sin(a) * ESTATE_RADIUS)
          .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }),
        body,
      )
    }
    // O portão fica entreaberto no desenho; a saída para a estrada é bloqueada (o testamento pede 7 dias).
    const g = estate.gate
    const yaw = Math.atan2(g.tx, g.tz)
    const qg = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    world.createCollider(
      rapier.ColliderDesc.cuboid(3.2, 2, 0.3)
        .setTranslation(g.x, 2, g.z)
        .setRotation({ x: qg.x, y: qg.y, z: qg.z, w: qg.w }),
      body,
    )
    return () => {
      world.removeRigidBody(body)
    }
  }, [world, rapier, estate])
  return null
}
