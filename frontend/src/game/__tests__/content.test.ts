import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { buildRegistry, ContentError } from '../content/registry'
import { propRegistry } from '../world/props'

describe('conteúdo do jogo', () => {
  it('valida todos os JSON e referências cruzadas', () => {
    expect(content.areas.size).toBeGreaterThanOrEqual(5)
    expect(content.documents.size).toBeGreaterThanOrEqual(3)
    expect(content.puzzles.has('library_clock')).toBe(true)
  })

  it('todo objeto de área usa um prop registrado', () => {
    for (const area of content.areas.values()) {
      for (const obj of area.objects) expect(propRegistry[obj.type], `${area.id}: ${obj.type}`).toBeDefined()
    }
  })

  it('todo interactable aparece em alguma área (nada órfão)', () => {
    const placed = new Set([...content.areas.values()].flatMap((a) => a.objects.map((o) => o.interactable).filter(Boolean)))
    for (const id of content.interactables.keys()) expect(placed.has(id), id).toBe(true)
  })

  it('documentos obrigatórios do plano existem com os trechos canônicos', () => {
    const letter = content.documents.get('doc_arthur_letter')!
    expect(letter.pages[0].text).toContain('If you are reading this, then I failed.')
    expect(letter.pages[0].text).toContain('Find the Eighth Record.')
    const report = content.documents.get('doc_police_report_1936')!
    expect(report.pages[0].text).toContain('2:17')
    expect(report.pages[0].margin).toBe("Room measurements don't match the exterior wall.")
    const photo = content.documents.get('doc_meridian_photo')!
    expect(photo.pages[1].text).toBe('Seven remained.\nOne refused.')
    const tape = content.documents.get('doc_arthur_tape_01')!
    expect(tape.audio!.lines.map((l) => l.text).join(' ')).toContain("If you hear knocking from inside the walls, don't answer.")
    expect(content.documents.get('doc_newspaper_1936')!.pages[0].heading).toContain('ELEVEN MISSING FROM VALE ESTATE')
  })

  it('referência quebrada derruba o boot com mensagem clara', () => {
    expect(() =>
      buildRegistry({
        areas: {},
        items: {},
        documents: {},
        interactables: { 'x.json': [{ id: 'broken', label: 'x', interactionType: 'pickup', item: 'nao_existe' }] },
        puzzles: {},
        sounds: {},
        journal: { 'j.json': { entries: [], board: { nodes: [], edges: [] } } },
        story: { 's.json': { triggers: [], progress: [], start: { area: 'nowhere', position: [0, 0, 0], yaw: 0, clock: { day: 1, minutes: 0 } } } },
      }),
    ).toThrow(ContentError)
  })

  it('progresso soma 100 pontos', () => {
    expect(content.story.progress.reduce((s, p) => s + p.weight, 0)).toBe(100)
  })
})
