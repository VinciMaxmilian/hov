import type { Object3D } from 'three'

/**
 * Registro de alvos para o raycast de interação. Interactables registram o próprio id;
 * paredes/móveis registram `null` (oclusores: impedem interagir através de paredes).
 */
const targets = new Map<Object3D, string | null>()
let list: Object3D[] = []
let dirty = true

export function registerTarget(obj: Object3D, id: string | null): () => void {
  targets.set(obj, id)
  dirty = true
  return () => {
    targets.delete(obj)
    dirty = true
  }
}

export function targetObjects(): Object3D[] {
  if (dirty) {
    list = [...targets.keys()]
    dirty = false
  }
  return list
}

/** Sobe a hierarquia a partir do objeto atingido até achar o alvo registrado. */
export function resolveTarget(hit: Object3D): string | null {
  let o: Object3D | null = hit
  while (o) {
    if (targets.has(o)) return targets.get(o) ?? null
    o = o.parent
  }
  return null
}
