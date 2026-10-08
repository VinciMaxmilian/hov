import { z } from 'zod'
import { vec3 } from '../content/schemas'

/**
 * Schema de save versionado. Ao mudar o formato:
 *  1. incremente SAVE_SCHEMA_VERSION;
 *  2. adicione migrations[versãoAntiga] que converte para versãoAntiga+1;
 *  3. adicione um teste em saveSchema.test.ts com um save da versão antiga.
 */
export const SAVE_SCHEMA_VERSION = 1

const flagValue = z.union([z.boolean(), z.number(), z.string()])

export const puzzleStateSchema = z.object({
  status: z.enum(['unsolved', 'solved']),
  values: z.record(z.union([z.number(), z.string()])).default({}),
  attempts: z.number().int().nonnegative().default(0),
})
export type PuzzleState = z.infer<typeof puzzleStateSchema>

export const settingsSchema = z.object({
  mouseSensitivity: z.number().min(0.1).max(5).default(1),
  invertY: z.boolean().default(false),
  masterVolume: z.number().min(0).max(1).default(0.8),
  subtitles: z.boolean().default(true),
  /** Tamanho do texto de legendas/diálogo (acessibilidade). */
  subtitleSize: z.enum(['small', 'medium', 'large']).default('medium'),
  /** Reduz a oscilação da câmera ao andar (conforto/acessibilidade). */
  reduceHeadBob: z.boolean().default(false),
  /** "performance" desliga sombras dinâmicas e reduz a resolução de render. */
  graphicsQuality: z.enum(['high', 'performance']).default('high'),
})
export type Settings = z.infer<typeof settingsSchema>
export const defaultSettings: Settings = settingsSchema.parse({})

export const gameStateSchema = z.object({
  player: z.object({ area: z.string(), position: vec3, yaw: z.number(), pitch: z.number().default(0) }),
  inventory: z.array(z.string()),
  world: z.record(z.string()),
  puzzles: z.record(puzzleStateSchema),
  documents: z.array(z.string()),
  flags: z.record(flagValue),
  journal: z.array(z.string()),
  /** Relógio de jogo: dia 1 = qui 22/10/1998. minutes = minutos desde 00:00. */
  clock: z.object({ day: z.number().int().min(1), minutes: z.number().min(0).max(1440) }),
  playtimeSec: z.number().nonnegative(),
})
export type GameState = z.infer<typeof gameStateSchema>

export const saveMetaSchema = z.object({
  slot: z.number().int().min(1).max(3),
  areaLabel: z.string(),
  progressPct: z.number().min(0).max(100),
  playtimeSec: z.number().nonnegative(),
  updatedAt: z.string(),
  contentVersion: z.string(),
})
export type SaveMeta = z.infer<typeof saveMetaSchema>

export const saveDataSchema = gameStateSchema.extend({
  schemaVersion: z.literal(SAVE_SCHEMA_VERSION),
  meta: saveMetaSchema,
  settings: settingsSchema,
})
export type SaveData = z.infer<typeof saveDataSchema>

type Migration = (data: Record<string, unknown>) => Record<string, unknown>

/** migrations[n] converte um save da versão n para n+1. */
export const migrations: Record<number, Migration> = {}

export class SaveError extends Error {}

export function migrateSave(raw: unknown, table: Record<number, Migration> = migrations, target = SAVE_SCHEMA_VERSION): SaveData {
  if (!raw || typeof raw !== 'object') throw new SaveError('save vazio ou corrompido')
  let data = { ...(raw as Record<string, unknown>) }
  let version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0
  if (version > target) throw new SaveError(`save de uma versão mais nova do jogo (v${version})`)
  while (version < target) {
    const step = table[version]
    if (!step) throw new SaveError(`sem migration de v${version} para v${version + 1}`)
    data = { ...step(data), schemaVersion: version + 1 }
    version++
  }
  const parsed = saveDataSchema.safeParse(data)
  if (!parsed.success) {
    throw new SaveError(`save inválido: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
  }
  return parsed.data
}
