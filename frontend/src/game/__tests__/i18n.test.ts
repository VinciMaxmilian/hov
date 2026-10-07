import { describe, expect, it } from 'vitest'
import { content } from '../content'
import type { Action } from '../content/schemas'
import { dictionaryFor, tr, useLang } from '../i18n'

/**
 * Cobertura de tradução: todo texto visível ao jogador precisa existir no dicionário de cada idioma.
 * Conteúdo: percorre os JSON validados. Código: procura t('…'), tr('…') e msgid('…') no fonte.
 */

function contentStrings(): string[] {
  const out = new Set<string>()
  const add = (s?: string) => s && s.trim() && out.add(s)
  const actions = (list?: readonly Action[]) => {
    for (const a of list ?? []) {
      if (a.type === 'message') add(a.text)
      if (a.type === 'hint') {
        add(a.text)
        add(a.touch)
      }
      if (a.type === 'delay') actions(a.actions)
      if (a.type === 'if') {
        actions(a.then)
        actions(a.else)
      }
    }
  }
  for (const a of content.areas.values()) add(a.name)
  for (const i of content.items.values()) [i.name, i.description, i.inspectNote].forEach(add)
  for (const d of content.documents.values()) {
    ;[d.title, d.author, d.date].forEach(add)
    for (const p of d.pages) {
      ;[p.heading, p.text, p.margin, p.placeholder].forEach(add)
      actions(p.onView)
    }
    for (const det of d.details) {
      add(det.note)
      actions(det.onFound)
    }
    d.audio?.lines.forEach((l) => add(l.text))
  }
  for (const i of content.interactables.values()) {
    ;[i.label, i.lockedMessage, i.unlockMessage, i.emptyMessage, i.solvedMessage].forEach(add)
    i.branches.forEach((b) => {
      add(b.label)
      actions(b.actions)
    })
    actions(i.actions)
  }
  for (const p of content.puzzles.values()) {
    add(p.title)
    add(p.input.attemptLabel)
    actions(p.successActions)
    actions(p.failureActions)
  }
  for (const e of content.journal.entries) [e.title, e.text].forEach(add)
  content.journal.board.nodes.forEach((n) => add(n.label))
  content.journal.board.edges.forEach((e) => add(e.label))
  content.story.triggers.forEach((t) => actions(t.actions))
  return [...out]
}

function sourceStrings(): string[] {
  const files = import.meta.glob(['../../**/*.{ts,tsx}', '!../../**/__tests__/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
  const out = new Set<string>()
  const re = /\b(?:t|tr|msgid)\(\s*(['"])((?:\\.|(?!\1).)*?)\1\s*[,)]/g
  for (const [file, src] of Object.entries(files)) {
    if (file.includes('/i18n/')) continue
    for (const m of src.matchAll(re)) out.add(m[2].replace(/\\(['"\\])/g, '$1'))
  }
  return [...out]
}

describe('i18n', () => {
  const pt = dictionaryFor('pt')

  it('todo texto de conteúdo tem tradução em português', () => {
    const missing = contentStrings().filter((s) => pt[s] === undefined)
    expect(missing).toEqual([])
  })

  it('todo texto da interface/motor tem tradução em português', () => {
    const found = sourceStrings()
    expect(found.length).toBeGreaterThan(80)
    const missing = found.filter((s) => pt[s] === undefined)
    expect(missing).toEqual([])
  })

  it('o nome do protagonista nunca vaza antes do final', () => {
    for (const lang of ['en', 'pt'] as const) {
      const all = [...Object.values(dictionaryFor(lang)), ...contentStrings()].join('\n')
      expect(all).not.toMatch(/worren/i)
    }
  })

  it('tr cai no texto original e interpola variáveis', () => {
    useLang.setState({ lang: 'pt' })
    expect(tr('Locked.')).toBe('Trancada.')
    expect(tr('texto sem tradução')).toBe('texto sem tradução')
    expect(tr('{n} ok', { n: 3 })).toBe('3 ok')
    useLang.setState({ lang: 'en' })
    expect(tr('Locked.')).toBe('Locked.')
  })
})
