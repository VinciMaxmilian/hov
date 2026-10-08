import { z } from 'zod'
import {
  areaSchema,
  documentSchema,
  interactableSchema,
  itemSchema,
  journalSchema,
  puzzleSchema,
  soundSchema,
  storySchema,
  type Action,
  type AreaDef,
  type Condition,
  type GameDocument,
  type Interactable,
  type Item,
  type JournalContent,
  type Puzzle,
  type SoundDef,
  type StoryContent,
} from './schemas'

/**
 * ContentRegistry: carrega TODO o conteúdo de src/content (JSON), valida com zod e
 * confere referências cruzadas (um interactable que dá um item inexistente quebra o boot, não o jogo).
 */
export interface ContentRegistry {
  areas: Map<string, AreaDef>
  items: Map<string, Item>
  documents: Map<string, GameDocument>
  interactables: Map<string, Interactable>
  puzzles: Map<string, Puzzle>
  sounds: Map<string, SoundDef>
  journal: JournalContent
  story: StoryContent
}

type RawModules = Record<string, unknown>

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Conteúdo inválido:\n- ${problems.join('\n- ')}`)
  }
}

function unwrap(mod: unknown): unknown {
  return mod && typeof mod === 'object' && 'default' in mod ? (mod as { default: unknown }).default : mod
}

function collect<T extends { id: string }>(
  modules: RawModules,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  kind: string,
  problems: string[],
): Map<string, T> {
  const out = new Map<string, T>()
  for (const [file, mod] of Object.entries(modules)) {
    const raw = unwrap(mod)
    const list = Array.isArray(raw) ? raw : [raw]
    list.forEach((entry, i) => {
      const parsed = schema.safeParse(entry)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          problems.push(`${kind} ${file}[${i}] ${issue.path.join('.')}: ${issue.message}`)
        }
        return
      }
      if (out.has(parsed.data.id)) problems.push(`${kind} duplicado: ${parsed.data.id} (${file})`)
      out.set(parsed.data.id, parsed.data)
    })
  }
  return out
}

function single<T>(modules: RawModules, schema: z.ZodType<T, z.ZodTypeDef, unknown>, kind: string, problems: string[]): T | null {
  const entries = Object.entries(modules)
  if (entries.length !== 1) {
    problems.push(`${kind}: esperado exatamente 1 arquivo, encontrado ${entries.length}`)
    return null
  }
  const [file, mod] = entries[0]
  const parsed = schema.safeParse(unwrap(mod))
  if (!parsed.success) {
    for (const issue of parsed.error.issues) problems.push(`${kind} ${file} ${issue.path.join('.')}: ${issue.message}`)
    return null
  }
  return parsed.data
}

export interface RawContent {
  areas: RawModules
  items: RawModules
  documents: RawModules
  interactables: RawModules
  puzzles: RawModules
  sounds: RawModules
  journal: RawModules
  story: RawModules
}

export function buildRegistry(raw: RawContent): ContentRegistry {
  const problems: string[] = []
  const reg = {
    areas: collect(raw.areas, areaSchema, 'area', problems),
    items: collect(raw.items, itemSchema, 'item', problems),
    documents: collect(raw.documents, documentSchema, 'document', problems),
    interactables: collect(raw.interactables, interactableSchema, 'interactable', problems),
    puzzles: collect(raw.puzzles, puzzleSchema, 'puzzle', problems),
    sounds: collect(raw.sounds, soundSchema, 'sound', problems),
    journal: single(raw.journal, journalSchema, 'journal', problems),
    story: single(raw.story, storySchema, 'story', problems),
  }
  if (problems.length === 0 && reg.journal && reg.story) {
    const full = reg as ContentRegistry
    problems.push(...crossCheck(full))
    if (problems.length === 0) return full
  }
  throw new ContentError(problems)
}

// ------------------------------------------------------------------ referências cruzadas

function crossCheck(reg: ContentRegistry): string[] {
  const problems: string[] = []
  const need = (map: Map<string, unknown>, ref: string | undefined, where: string, kind: string) => {
    if (ref !== undefined && !map.has(ref)) problems.push(`${where}: ${kind} "${ref}" não existe`)
  }

  const checkCondition = (c: Condition | undefined, where: string): void => {
    if (!c) return
    switch (c.type) {
      case 'hasItem':
        return need(reg.items, c.item, where, 'item')
      case 'document':
        return need(reg.documents, c.document, where, 'documento')
      case 'puzzleSolved':
      case 'puzzleValue':
        return need(reg.puzzles, c.puzzle, where, 'puzzle')
      case 'area':
        return need(reg.areas, c.area, where, 'área')
      case 'journal':
        return need(journalIds, c.entry, where, 'entrada de journal')
      case 'revelation':
        if (!reg.story.revelations.some((r) => r.id === c.id)) problems.push(`${where}: revelação "${c.id}" não existe`)
        return
      case 'all':
      case 'any':
        return c.of.forEach((x) => checkCondition(x, where))
      case 'not':
        return checkCondition(c.condition, where)
      default:
        return
    }
  }

  const checkActions = (actions: Action[], where: string): void => {
    for (const a of actions) {
      switch (a.type) {
        case 'giveItem':
        case 'removeItem':
        case 'inspectItem':
          need(reg.items, a.item, where, 'item')
          break
        case 'discoverDocument':
        case 'openDocument':
          need(reg.documents, a.document, where, 'documento')
          break
        case 'playRecording':
          need(reg.documents, a.document, where, 'documento')
          if (!reg.documents.get(a.document)?.audio) problems.push(`${where}: documento ${a.document} não tem audio`)
          break
        case 'playSound':
          need(reg.sounds, a.sound, where, 'som')
          break
        case 'openPuzzle':
        case 'solvePuzzle':
          need(reg.puzzles, a.puzzle, where, 'puzzle')
          break
        case 'unlockJournal':
          need(journalIds, a.entry, where, 'entrada de journal')
          break
        case 'teleport':
          need(reg.areas, a.area, where, 'área')
          break
        case 'delay':
          checkActions(a.actions, where)
          break
        case 'if':
          checkCondition(a.condition, where)
          checkActions(a.then, where)
          checkActions(a.else ?? [], where)
          break
        default:
          break
      }
    }
  }

  const journalIds = new Map(reg.journal.entries.map((e) => [e.id, e]))

  for (const area of reg.areas.values()) {
    area.neighbors.forEach((n) => need(reg.areas, n, `area ${area.id}`, 'vizinha'))
    for (const obj of area.objects) {
      need(reg.interactables, obj.interactable, `area ${area.id} objeto ${obj.id ?? obj.type}`, 'interactable')
      checkCondition(obj.visibleWhen, `area ${area.id} objeto ${obj.id ?? obj.type}`)
    }
    area.ambience.forEach((s) => need(reg.sounds, s.sound, `area ${area.id} ambience`, 'som'))
    area.lights.forEach((l) => checkCondition(l.when, `area ${area.id} luz`))
  }

  for (const it of reg.interactables.values()) {
    const where = `interactable ${it.id}`
    need(reg.items, it.item, where, 'item')
    need(reg.items, it.requiredItem, where, 'item')
    need(reg.documents, it.document, where, 'documento')
    need(reg.puzzles, it.puzzle, where, 'puzzle')
    need(reg.sounds, it.sound, where, 'som')
    checkCondition(it.enabledWhen, where)
    it.branches.forEach((b) => {
      checkCondition(b.when, where)
      checkActions(b.actions, where)
    })
    checkActions(it.actions, where)
    if (it.interactionType === 'puzzle' && !it.puzzle) problems.push(`${where}: tipo puzzle sem "puzzle"`)
    if (it.interactionType === 'pickup' && !it.item && !it.document) problems.push(`${where}: pickup sem item/document`)
  }

  for (const p of reg.puzzles.values()) {
    checkCondition(p.requirements, `puzzle ${p.id}`)
    checkCondition(p.conditions, `puzzle ${p.id}`)
    checkActions(p.successActions, `puzzle ${p.id}`)
    checkActions(p.failureActions, `puzzle ${p.id}`)
  }

  for (const d of reg.documents.values()) {
    d.pages.forEach((pg, i) => checkActions(pg.onView, `document ${d.id} página ${i}`))
    d.details.forEach((det) => {
      if (det.page >= d.pages.length) problems.push(`document ${d.id} detalhe ${det.id}: página inexistente`)
      checkActions(det.onFound, `document ${d.id} detalhe ${det.id}`)
    })
  }

  for (const e of reg.journal.entries) {
    checkCondition(e.unlockWhen, `journal ${e.id}`)
    checkCondition(e.resolvedWhen, `journal ${e.id}`)
  }
  const nodeIds = new Set(reg.journal.board.nodes.map((n) => n.id))
  reg.journal.board.nodes.forEach((n) => {
    checkCondition(n.showWhen, `board ${n.id}`)
    checkCondition(n.revealWhen, `board ${n.id}`)
  })
  reg.journal.board.edges.forEach((e) => {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) problems.push(`board aresta ${e.from}→${e.to}: nó inexistente`)
    checkCondition(e.showWhen, `board ${e.from}→${e.to}`)
    checkCondition(e.confirmedWhen, `board ${e.from}→${e.to}`)
  })

  for (const t of reg.story.triggers) {
    checkCondition(t.conditions, `trigger ${t.id}`)
    checkActions(t.actions, `trigger ${t.id}`)
  }
  reg.story.progress.forEach((p) => checkCondition(p.when, `progress ${p.id}`))
  for (const r of reg.story.revelations) r.clues.forEach((c) => checkCondition(c, `revelation ${r.id}`))
  for (const e of reg.story.endings) {
    checkCondition(e.when, `ending ${e.id}`)
    e.choices.forEach((c) => checkCondition(c.when, `ending ${e.id}/${c.id}`))
  }
  const lastEnding = reg.story.endings[reg.story.endings.length - 1]
  if (lastEnding?.when) problems.push('story.endings: o último final deve ser incondicional (fallback)')
  need(reg.areas, reg.story.start.area, 'story.start', 'área')

  return problems
}
