import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { createNewGameState } from '../state/newGame'
import { migrateSave, SAVE_SCHEMA_VERSION, SaveError, type SaveData } from '../state/saveSchema'
import { defaultSettings } from '../state/saveSchema'

function sampleSave(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    ...createNewGameState(content),
    meta: { slot: 1, areaLabel: 'Grounds', progressPct: 0, playtimeSec: 12, updatedAt: '2026-10-06T00:00:00.000Z', contentVersion: 'test' },
    settings: defaultSettings,
  }
}

describe('save schema', () => {
  it('novo jogo deriva estados iniciais do conteúdo', () => {
    const s = createNewGameState(content)
    expect(s.world.main_door).toBe('locked')
    expect(s.world.library_bookcase).toBe('closed')
    expect(s.puzzles.library_clock).toMatchObject({ status: 'unsolved', values: { hour: 10, minute: 8 } })
    expect(s.player.area).toBe('exterior')
  })

  it('round-trip JSON preserva o save', () => {
    const save = sampleSave()
    expect(migrateSave(JSON.parse(JSON.stringify(save)))).toEqual(save)
  })

  it('rejeita lixo e saves de versões futuras', () => {
    expect(() => migrateSave(null)).toThrow(SaveError)
    expect(() => migrateSave({ ...sampleSave(), schemaVersion: SAVE_SCHEMA_VERSION + 1 })).toThrow(/mais nova/)
    expect(() => migrateSave({ ...sampleSave(), inventory: 'nope' })).toThrow(SaveError)
  })

  it('aplica migrations encadeadas até a versão atual', () => {
    // Simula um save "v0" (pré-lançamento): inventário como objeto e sem relógio.
    const v1 = sampleSave()
    const { clock: _clock, schemaVersion: _v, ...rest } = v1
    const v0 = { ...rest, schemaVersion: 0, inventory: Object.fromEntries(v1.inventory.map((i) => [i, true])) }
    const migrated = migrateSave(v0, {
      0: (d) => ({ ...d, inventory: Object.keys(d.inventory as object), clock: { day: 1, minutes: 1120 } }),
    })
    expect(migrated.schemaVersion).toBe(1)
    expect(migrated.clock).toEqual({ day: 1, minutes: 1120 })
  })
})
