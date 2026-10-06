import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { audio } from '../audio/audioManager'
import { content } from '../content'
import { useGame } from '../state/gameStore'
import { useSettings } from '../state/settingsStore'
import { useUi } from '../state/uiStore'
import { areaAt } from '../world/areas'
import { input } from './input'
import { playerRuntime } from './playerRuntime'

/**
 * Jogador em 1ª pessoa: cápsula cinemática + KinematicCharacterController do Rapier
 * (degraus, rampas, deslizar em paredes). A posição salva é a dos PÉS.
 */
const HALF = 0.55
const RADIUS = 0.3
const CENTER = HALF + RADIUS // pés → centro da cápsula
const EYE = 0.72 // centro → olhos (≈1.57 m)
const WALK = 2.2
const RUN = 4.0
const GRAVITY = 18
const LOOK = 0.0022

const tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const qLook = new THREE.Quaternion()
const qFocus = new THREE.Quaternion()
const vEye = new THREE.Vector3()
const vFocus = new THREE.Vector3()
const vFwd = new THREE.Vector3()
const mLook = new THREE.Matrix4()
const UP = new THREE.Vector3(0, 1, 0)

export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const collider = useRef<RapierCollider>(null)
  const { world } = useRapier()
  const vy = useRef(0)
  const appliedSeq = useRef(-1)
  const blend = useRef(0)
  const bob = useRef(0)
  const lastStep = useRef(0)

  const controller = useMemo(() => {
    const c = world.createCharacterController(0.02)
    c.enableAutostep(0.32, 0.2, true)
    c.enableSnapToGround(0.35)
    c.setMaxSlopeClimbAngle(THREE.MathUtils.degToRad(48))
    c.setMinSlopeSlideAngle(THREE.MathUtils.degToRad(60))
    c.setSlideEnabled(true)
    return c
  }, [world])
  useEffect(() => () => world.removeCharacterController(controller), [world, controller])

  const spawn = playerRuntime.position

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const rb = body.current
    const col = collider.current
    if (!rb || !col) return
    const ui = useUi.getState()
    const camera = state.camera

    // ---- teleporte (novo jogo / load)
    if (playerRuntime.teleportSeq !== appliedSeq.current) {
      appliedSeq.current = playerRuntime.teleportSeq
      const t = playerRuntime.teleportTo
      rb.setTranslation({ x: t.position[0], y: t.position[1] + CENTER, z: t.position[2] }, true)
      rb.setNextKinematicTranslation({ x: t.position[0], y: t.position[1] + CENTER, z: t.position[2] })
      playerRuntime.yaw = t.yaw
      playerRuntime.pitch = t.pitch
      vy.current = 0
      blend.current = 0
    }

    const active = ui.mode === 'playing'
    const { mouseSensitivity, invertY } = useSettings.getState()

    // ---- olhar
    const m = input.takeMouse()
    if (active) {
      playerRuntime.yaw -= m.dx * LOOK * mouseSensitivity
      playerRuntime.pitch -= m.dy * LOOK * mouseSensitivity * (invertY ? -1 : 1)
      playerRuntime.pitch = THREE.MathUtils.clamp(playerRuntime.pitch, -1.45, 1.45)
    }

    // ---- mover
    const mv = active ? input.move() : { x: 0, z: 0, run: false }
    const mx = mv.x
    const mz = mv.z
    const running = mv.run
    const speed = (running ? RUN : WALK) * dt
    const yaw = playerRuntime.yaw
    const sin = Math.sin(yaw)
    const cos = Math.cos(yaw)
    // frente = (-sin, -cos), direita = (cos, -sin)
    const dx = (mx * cos + mz * sin) * speed
    const dz = (-mx * sin + mz * cos) * speed

    vy.current -= GRAVITY * dt
    controller.computeColliderMovement(col, { x: dx, y: vy.current * dt, z: dz })
    const move = controller.computedMovement()
    const grounded = controller.computedGrounded()
    if (grounded && vy.current < 0) vy.current = -1
    const p = rb.translation()
    const next = { x: p.x + move.x, y: p.y + move.y, z: p.z + move.z }
    // Rede de segurança: caiu para fora do mundo → volta para a última área conhecida.
    if (next.y < -30) {
      const area = content.areas.get(useGame.getState().player.area)
      const s = area?.spawn?.position ?? content.story.start.position
      next.x = s[0]
      next.y = s[1] + CENTER
      next.z = s[2]
      rb.setTranslation(next, true)
      vy.current = 0
    }
    rb.setNextKinematicTranslation(next)
    playerRuntime.position = [next.x, next.y - CENTER, next.z]

    // ---- passos + head-bob
    const horiz = Math.hypot(move.x, move.z)
    if (grounded && horiz > 0.0005) {
      playerRuntime.stride += horiz
      bob.current += horiz * (running ? 2.4 : 2.9)
      if (playerRuntime.stride - lastStep.current > (running ? 0.95 : 0.72)) {
        lastStep.current = playerRuntime.stride
        const area = content.areas.get(useGame.getState().player.area)
        audio.footstep(area?.footsteps ?? 'wood', running ? 1 : 0.7)
      }
    }
    const bobY = Math.sin(bob.current * 2) * 0.025 * Math.min(1, horiz / (speed + 1e-6))

    // ---- área atual (streaming + eventos)
    if (ui.mode === 'playing' || ui.mode === 'puzzle' || ui.mode === 'inspect') {
      const area = areaAt(playerRuntime.position)
      if (area && area !== useGame.getState().player.area) useGame.getState().setArea(area)
    }

    // ---- câmera (com close-up de puzzle)
    vEye.set(next.x, next.y + EYE + bobY, next.z)
    tmpEuler.set(playerRuntime.pitch, playerRuntime.yaw, 0)
    qLook.setFromEuler(tmpEuler)
    const focus = ui.cameraFocus
    blend.current = THREE.MathUtils.damp(blend.current, focus ? 1 : 0, 5, dt)
    if (blend.current > 0.001 && focus) {
      vFocus.set(...focus.position)
      mLook.lookAt(vFocus, new THREE.Vector3(...focus.lookAt), UP)
      qFocus.setFromRotationMatrix(mLook)
      const e = blend.current * blend.current * (3 - 2 * blend.current)
      camera.position.lerpVectors(vEye, vFocus, e)
      camera.quaternion.slerpQuaternions(qLook, qFocus, e)
    } else {
      camera.position.copy(vEye)
      camera.quaternion.copy(qLook)
    }

    camera.getWorldDirection(vFwd)
    audio.updateListener([camera.position.x, camera.position.y, camera.position.z], [vFwd.x, vFwd.y, vFwd.z])
  })

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[spawn[0], spawn[1] + CENTER, spawn[2]]} enabledRotations={[false, false, false]}>
      <CapsuleCollider ref={collider} args={[HALF, RADIUS]} />
    </RigidBody>
  )
}
