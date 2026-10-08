import type { Action } from '../content/schemas'
import type { FlagValue, Vec3 } from '../core/types'
import { evaluate, type RuleState } from './evaluate'

/**
 * Efeitos que as ações podem produzir. A implementação real (effects.ts) conecta stores, UI e áudio;
 * testes passam uma implementação falsa.
 */
export interface RuleEffects {
  state(): RuleState
  setFlag(key: string, value: FlagValue): void
  setWorld(key: string, value: string): void
  giveItem(item: string, silent: boolean): void
  removeItem(item: string): void
  discoverDocument(document: string, open: boolean): void
  inspectItem(item: string): void
  openDocument(document: string): void
  playSound(sound: string, position?: Vec3, volume?: number): void
  playRecording(document: string): void
  message(text: string, durationMs?: number): void
  hint(text: string, durationMs?: number, touchText?: string): void
  openPuzzle(puzzle: string): void
  solvePuzzle(puzzle: string): void
  closePuzzle(): void
  unlockJournal(entry: string): void
  save(): void
  setClock(day: number, minutes: number): void
  chapter(title: string, subtitle?: string): void
  teleport(position: Vec3, yaw: number, area?: string): void
  beginEnding(): void
  schedule(ms: number, fn: () => void): void
}

export function runActions(actions: readonly Action[], fx: RuleEffects): void {
  for (const action of actions) runAction(action, fx)
}

function runAction(a: Action, fx: RuleEffects): void {
  switch (a.type) {
    case 'setFlag':
      return fx.setFlag(a.key, a.value)
    case 'setWorld':
      return fx.setWorld(a.key, a.value)
    case 'giveItem':
      return fx.giveItem(a.item, a.silent ?? false)
    case 'removeItem':
      return fx.removeItem(a.item)
    case 'discoverDocument':
      return fx.discoverDocument(a.document, a.open ?? false)
    case 'inspectItem':
      return fx.inspectItem(a.item)
    case 'openDocument':
      return fx.openDocument(a.document)
    case 'playSound':
      return fx.playSound(a.sound, a.position, a.volume)
    case 'playRecording':
      return fx.playRecording(a.document)
    case 'message':
      return fx.message(a.text, a.duration)
    case 'hint':
      return fx.hint(a.text, a.duration, a.touch)
    case 'openPuzzle':
      return fx.openPuzzle(a.puzzle)
    case 'solvePuzzle':
      return fx.solvePuzzle(a.puzzle)
    case 'closePuzzle':
      return fx.closePuzzle()
    case 'unlockJournal':
      return fx.unlockJournal(a.entry)
    case 'delay':
      return fx.schedule(a.ms, () => runActions(a.actions, fx))
    case 'if':
      return runActions(evaluate(a.condition, fx.state()) ? a.then : (a.else ?? []), fx)
    case 'save':
      return fx.save()
    case 'setClock':
      return fx.setClock(a.day, a.minutes)
    case 'chapter':
      return fx.chapter(a.title, a.subtitle)
    case 'teleport':
      return fx.teleport(a.position, a.yaw, a.area)
    case 'beginEnding':
      return fx.beginEnding()
  }
}
