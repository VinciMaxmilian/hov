import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useUi } from '../state/uiStore'
import { describe } from './interact'
import { resolveTarget, targetObjects } from './targets'

export const INTERACT_DISTANCE = 2.6

/**
 * Raycast do centro da câmera contra interactables + oclusores (paredes/móveis).
 * Atualiza ui.focus apenas quando o alvo muda (sem re-render por frame).
 */
export function InteractionProbe() {
  const raycaster = useMemo(() => {
    const r = new THREE.Raycaster()
    r.far = INTERACT_DISTANCE
    return r
  }, [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])
  const frame = useRef(0)

  useFrame(({ camera }) => {
    const ui = useUi.getState()
    if (ui.mode !== 'playing') {
      if (ui.focus) ui.setFocus(null)
      return
    }
    if (frame.current++ % 2) return
    raycaster.setFromCamera(center, camera)
    const hits = raycaster.intersectObjects(targetObjects(), true)
    let focus: typeof ui.focus = null
    for (const hit of hits) {
      const id = resolveTarget(hit.object)
      if (id) {
        const d = describe(id)
        if (d) focus = { id, label: d.label, verb: d.verb }
      }
      break // o primeiro objeto atingido decide (paredes bloqueiam)
    }
    ui.setFocus(focus)
  })
  return null
}
