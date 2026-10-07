import { msgid } from '../i18n'
import { audio } from '../audio/audioManager'
import { content } from '../content'
import type { Interactable } from '../content/schemas'
import { bus } from '../core/eventBus'
import type { Vec3 } from '../core/types'
import { openPuzzle } from '../puzzles/puzzleSystem'
import { run } from '../rules/effects'
import { evaluate } from '../rules/evaluate'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'

/** Posição de mundo de cada interactable (derivada das áreas), para sons espaciais. */
const positions = new Map<string, Vec3>()
for (const area of content.areas.values()) {
  for (const obj of area.objects) {
    if (obj.interactable) positions.set(obj.interactable, [obj.position[0], obj.position[1] + 1, obj.position[2]])
  }
}

export const interactablePosition = (id: string): Vec3 | undefined => positions.get(id)

function stateOf(it: Interactable): string {
  return useGame.getState().world[it.id] ?? it.state ?? 'default'
}

function matchingBranch(it: Interactable) {
  const s = useGame.getState()
  return it.branches.find((b) => evaluate(b.when, s))
}

export function isEnabled(id: string): boolean {
  const it = content.interactables.get(id)
  if (!it) return false
  const s = useGame.getState()
  if (s.world[id] === 'taken') return false
  return evaluate(it.enabledWhen, s)
}

/** Texto do prompt "E — <verbo> <rótulo>". */
export function describe(id: string): { verb: string; label: string } | null {
  const it = content.interactables.get(id)
  if (!it || !isEnabled(id)) return null
  const branch = matchingBranch(it)
  if (branch?.label) return { verb: branch.label, label: it.label }
  const state = stateOf(it)
  const verb = (() => {
    switch (it.interactionType) {
      case 'door':
        return state === 'open' ? msgid('Close') : state === 'locked' ? msgid('Try') : msgid('Open')
      case 'pickup':
        return msgid('Take')
      case 'read':
        return msgid('Read')
      case 'container':
        return msgid('Search')
      case 'toggle':
        return state === 'on' ? msgid('Switch off') : msgid('Switch on')
      case 'puzzle':
        return msgid('Examine')
      case 'use':
        return msgid('Use')
    }
  })()
  return { verb, label: it.label }
}

export function interact(id: string): void {
  const it = content.interactables.get(id)
  if (!it || !isEnabled(id)) return
  bus.emit('INTERACTED', { target: id })
  const at = positions.get(id)

  const branch = matchingBranch(it)
  if (branch) {
    run(branch.actions)
    return
  }

  const game = useGame.getState()
  const ui = useUi.getState()
  const state = stateOf(it)

  switch (it.interactionType) {
    case 'door': {
      if (state === 'locked') {
        if (it.requiredItem && game.inventory.includes(it.requiredItem)) {
          if (it.consumeItem) game.removeItem(it.requiredItem)
          game.setWorld(it.id, 'open')
          bus.emit('DOOR_UNLOCKED', { door: it.id })
          bus.emit('ITEM_USED', { item: it.requiredItem, target: it.id })
          audio.play('unlock', { position: at })
          audio.play(it.sound ?? 'door_open', { position: at })
          if (it.unlockMessage) ui.message(it.unlockMessage)
        } else {
          audio.play('door_locked', { position: at })
          ui.message(it.lockedMessage ?? msgid('Locked.'))
        }
      } else if (state === 'open') {
        game.setWorld(it.id, 'closed')
        audio.play('door_close', { position: at, volume: 0.6 })
      } else {
        game.setWorld(it.id, 'open')
        audio.play(it.sound ?? 'door_open', { position: at })
      }
      break
    }
    case 'pickup': {
      if (it.item) {
        audio.play(it.sound ?? 'pickup', { position: at })
        run([{ type: 'giveItem', item: it.item }])
      }
      game.setWorld(it.id, 'taken')
      if (it.document) {
        audio.play('paper', { position: at })
        run([{ type: 'discoverDocument', document: it.document, open: true }])
      }
      break
    }
    case 'read': {
      if (it.document) {
        audio.play('paper', { position: at })
        run([{ type: 'discoverDocument', document: it.document, open: true }])
      }
      break
    }
    case 'container': {
      if (state === 'searched') {
        ui.message(it.emptyMessage ?? msgid('Nothing else.'))
        return
      }
      if (it.requiredItem && !game.inventory.includes(it.requiredItem)) {
        audio.play('door_locked', { position: at })
        ui.message(it.lockedMessage ?? msgid('Locked.'))
        return
      }
      game.setWorld(it.id, 'searched')
      audio.play(it.sound ?? 'drawer', { position: at })
      break
    }
    case 'toggle': {
      game.setWorld(it.id, state === 'on' ? 'off' : 'on')
      audio.play(it.sound ?? 'switch', { position: at })
      break
    }
    case 'puzzle': {
      if (it.puzzle && game.puzzles[it.puzzle]?.status === 'solved') {
        ui.message(it.solvedMessage ?? msgid('Nothing more to do here.'))
        return
      }
      if (it.puzzle) openPuzzle(it.puzzle)
      break
    }
    case 'use':
      break
  }
  run(it.actions)
}
