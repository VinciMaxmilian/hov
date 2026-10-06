import { z } from 'zod'

/**
 * Contrato entre ENGINE e CONTEÚDO. Todo JSON em src/content/ é validado aqui no boot (falha cedo).
 * Adicionar sala/documento/puzzle = adicionar JSON; a engine não muda.
 */

const id = z.string().regex(/^[a-z0-9_]+$/, 'ids usam snake_case minúsculo')
export const vec3 = z.tuple([z.number(), z.number(), z.number()])
const vec2 = z.tuple([z.number(), z.number()])
const flagValue = z.union([z.boolean(), z.number(), z.string()])

// ------------------------------------------------------------------ Rules DSL: Conditions

export type Condition =
  | { type: 'flag'; key: string; equals?: boolean | number | string }
  | { type: 'hasItem'; item: string }
  | { type: 'world'; key: string; equals: string }
  | { type: 'document'; document: string }
  | { type: 'puzzleSolved'; puzzle: string }
  | { type: 'puzzleValue'; puzzle: string; key: string; equals: number | string }
  | { type: 'area'; area: string }
  | { type: 'journal'; entry: string }
  | { type: 'all'; of: Condition[] }
  | { type: 'any'; of: Condition[] }
  | { type: 'not'; condition: Condition }

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('flag'), key: z.string(), equals: flagValue.optional() }),
    z.object({ type: z.literal('hasItem'), item: id }),
    z.object({ type: z.literal('world'), key: z.string(), equals: z.string() }),
    z.object({ type: z.literal('document'), document: id }),
    z.object({ type: z.literal('puzzleSolved'), puzzle: id }),
    z.object({ type: z.literal('puzzleValue'), puzzle: id, key: z.string(), equals: z.union([z.number(), z.string()]) }),
    z.object({ type: z.literal('area'), area: id }),
    z.object({ type: z.literal('journal'), entry: id }),
    z.object({ type: z.literal('all'), of: z.array(conditionSchema) }),
    z.object({ type: z.literal('any'), of: z.array(conditionSchema) }),
    z.object({ type: z.literal('not'), condition: conditionSchema }),
  ]),
)

// ------------------------------------------------------------------ Rules DSL: Actions

export type Action =
  | { type: 'setFlag'; key: string; value: boolean | number | string }
  | { type: 'setWorld'; key: string; value: string }
  | { type: 'giveItem'; item: string; silent?: boolean }
  | { type: 'removeItem'; item: string }
  | { type: 'discoverDocument'; document: string; open?: boolean }
  | { type: 'inspectItem'; item: string }
  | { type: 'openDocument'; document: string }
  | { type: 'playSound'; sound: string; position?: [number, number, number]; volume?: number }
  | { type: 'playRecording'; document: string }
  | { type: 'message'; text: string; duration?: number }
  | { type: 'hint'; text: string; duration?: number }
  | { type: 'openPuzzle'; puzzle: string }
  | { type: 'solvePuzzle'; puzzle: string }
  | { type: 'closePuzzle' }
  | { type: 'unlockJournal'; entry: string }
  | { type: 'delay'; ms: number; actions: Action[] }
  | { type: 'if'; condition: Condition; then: Action[]; else?: Action[] }
  | { type: 'save' }
  | { type: 'endSlice' }

export const actionSchema: z.ZodType<Action> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('setFlag'), key: z.string(), value: flagValue }),
    z.object({ type: z.literal('setWorld'), key: z.string(), value: z.string() }),
    z.object({ type: z.literal('giveItem'), item: id, silent: z.boolean().optional() }),
    z.object({ type: z.literal('removeItem'), item: id }),
    z.object({ type: z.literal('discoverDocument'), document: id, open: z.boolean().optional() }),
    z.object({ type: z.literal('inspectItem'), item: id }),
    z.object({ type: z.literal('openDocument'), document: id }),
    z.object({ type: z.literal('playSound'), sound: id, position: vec3.optional(), volume: z.number().optional() }),
    z.object({ type: z.literal('playRecording'), document: id }),
    z.object({ type: z.literal('message'), text: z.string(), duration: z.number().optional() }),
    z.object({ type: z.literal('hint'), text: z.string(), duration: z.number().optional() }),
    z.object({ type: z.literal('openPuzzle'), puzzle: id }),
    z.object({ type: z.literal('solvePuzzle'), puzzle: id }),
    z.object({ type: z.literal('closePuzzle') }),
    z.object({ type: z.literal('unlockJournal'), entry: id }),
    z.object({ type: z.literal('delay'), ms: z.number().nonnegative(), actions: z.array(actionSchema) }),
    z.object({
      type: z.literal('if'),
      condition: conditionSchema,
      then: z.array(actionSchema),
      else: z.array(actionSchema).optional(),
    }),
    z.object({ type: z.literal('save') }),
    z.object({ type: z.literal('endSlice') }),
  ]),
)

// ------------------------------------------------------------------ Items

export const itemCategories = ['KEY_ITEMS', 'TOOLS', 'DOCUMENTS', 'PHOTOGRAPHS', 'NOTES', 'MAPS', 'RECORDINGS'] as const
export type ItemCategory = (typeof itemCategories)[number]

export const itemSchema = z.object({
  id,
  name: z.string(),
  description: z.string(),
  category: z.enum(itemCategories),
  /** "proc:<modelo procedural>" ou caminho de GLB futuro. */
  model: z.string().optional(),
  /** Imagem 2D (Higgsfield). Se o arquivo não existir, a UI usa o placeholder procedural. */
  image: z.string().optional(),
  inspectable: z.boolean().default(true),
  combinable: z.array(id).default([]),
  usable: z.boolean().default(false),
  storyTags: z.array(z.string()).default([]),
  /** Detalhes visíveis só ao inspecionar (texto curto, não destacado). */
  inspectNote: z.string().optional(),
})
export type Item = z.infer<typeof itemSchema>

// ------------------------------------------------------------------ Documents

export const documentKinds = ['letter', 'note', 'card', 'newspaper', 'report', 'photograph', 'record', 'recording'] as const
export const pageStyles = ['handwritten', 'pencil', 'typed', 'print', 'newspaper', 'photo', 'engraved'] as const

export const documentSchema = z.object({
  id,
  /** Código do plano (DOC01…). */
  code: z.string().optional(),
  title: z.string(),
  kind: z.enum(documentKinds),
  date: z.string().optional(),
  author: z.string().optional(),
  pages: z
    .array(
      z.object({
        side: z.enum(['front', 'back']),
        style: z.enum(pageStyles),
        heading: z.string().optional(),
        text: z.string().default(''),
        /** Nota manuscrita na margem (outra caligrafia). */
        margin: z.string().optional(),
        image: z.string().optional(),
        /** Descrição do placeholder enquanto a imagem não existe. */
        placeholder: z.string().optional(),
        /** Região recortada da foto (0–1). */
        cutout: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
        onView: z.array(actionSchema).default([]),
      }),
    )
    .min(1),
  /** Detalhes "escondidos": clicar na região (0–1) registra a observação. Nunca destacados. */
  details: z
    .array(
      z.object({
        id,
        page: z.number().int().nonnegative(),
        rect: z.tuple([z.number(), z.number(), z.number(), z.number()]),
        note: z.string(),
        onFound: z.array(actionSchema).default([]),
      }),
    )
    .default([]),
  audio: z
    .object({
      src: z.string().optional(),
      duration: z.number().positive(),
      lines: z.array(z.object({ t: z.number().nonnegative(), text: z.string(), speaker: z.string().optional() })),
    })
    .optional(),
  storyTags: z.array(z.string()).default([]),
})
export type GameDocument = z.infer<typeof documentSchema>

// ------------------------------------------------------------------ Interactables

export const interactionTypes = ['door', 'pickup', 'container', 'toggle', 'puzzle', 'read', 'use'] as const

export const interactableSchema = z.object({
  id,
  label: z.string(),
  interactionType: z.enum(interactionTypes),
  /** Estado inicial em world[id] (door: locked|closed|open; toggle: on|off; container: closed|searched). */
  state: z.string().optional(),
  requiredItem: id.optional(),
  consumeItem: z.boolean().default(false),
  lockedMessage: z.string().optional(),
  unlockMessage: z.string().optional(),
  emptyMessage: z.string().optional(),
  /** pickup: item dado; read/pickup: documento descoberto. */
  item: id.optional(),
  document: id.optional(),
  puzzle: id.optional(),
  solvedMessage: z.string().optional(),
  /** Pose de câmera para puzzles/close-ups. */
  focus: z.object({ position: vec3, lookAt: vec3 }).optional(),
  enabledWhen: conditionSchema.optional(),
  branches: z
    .array(z.object({ when: conditionSchema.optional(), label: z.string().optional(), actions: z.array(actionSchema) }))
    .default([]),
  actions: z.array(actionSchema).default([]),
  sound: id.optional(),
})
export type Interactable = z.infer<typeof interactableSchema>

// ------------------------------------------------------------------ Puzzles

export const puzzleSchema = z.object({
  id,
  title: z.string(),
  requirements: conditionSchema.optional(),
  input: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('clock'),
      initial: z.object({ hour: z.number().int().min(1).max(12), minute: z.number().int().min(0).max(59) }),
      attemptLabel: z.string().default('Let it strike'),
    }),
  ]),
  conditions: conditionSchema,
  successActions: z.array(actionSchema).default([]),
  failureActions: z.array(actionSchema).default([]),
})
export type Puzzle = z.infer<typeof puzzleSchema>

// ------------------------------------------------------------------ Areas

export const sides = ['north', 'south', 'east', 'west'] as const
export type Side = (typeof sides)[number]

const openingSchema = z.object({
  side: z.enum(sides),
  /** Coordenada do centro ao longo da parede (x para north/south, z para east/west), em coordenadas de mundo. */
  center: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  sill: z.number().nonnegative().default(0),
  kind: z.enum(['door', 'window', 'arch', 'passage']).default('door'),
  glass: z.boolean().default(false),
})

const roomSchema = z.object({
  id,
  min: vec2,
  max: vec2,
  floorY: z.number().default(0),
  height: z.number().positive(),
  thickness: z
    .union([z.number(), z.object({ north: z.number(), south: z.number(), east: z.number(), west: z.number() })])
    .default(0.2),
  wall: z.string(),
  /** Material da face externa por lado (fachadas). */
  outer: z.record(z.enum(sides), z.string()).default({}),
  floor: z.string(),
  ceiling: z.string().optional(),
  wainscot: z.object({ height: z.number(), material: z.string() }).optional(),
  openings: z.array(openingSchema).default([]),
  skip: z.array(z.enum(sides)).default([]),
  /** Paredes sem colisão (ex.: fundo falso). */
  noCollide: z.array(z.enum(sides)).default([]),
})
export type RoomDef = z.infer<typeof roomSchema>
export type OpeningDef = z.infer<typeof openingSchema>

const lightSchema = z.object({
  type: z.enum(['ambient', 'hemisphere', 'directional', 'point', 'spot']),
  color: z.string().default('#ffffff'),
  groundColor: z.string().optional(),
  intensity: z.number(),
  position: vec3.optional(),
  target: vec3.optional(),
  distance: z.number().optional(),
  decay: z.number().optional(),
  angle: z.number().optional(),
  penumbra: z.number().optional(),
  castShadow: z.boolean().default(false),
  flicker: z.number().min(0).max(1).default(0),
  when: conditionSchema.optional(),
})
export type LightDef = z.infer<typeof lightSchema>

export const areaObjectSchema = z.object({
  id: id.optional(),
  type: z.string(),
  position: vec3.default([0, 0, 0]),
  /** Rotação em graus [x, y, z]. */
  rotation: vec3.default([0, 0, 0]),
  scale: z.union([z.number(), vec3]).optional(),
  params: z.record(z.unknown()).default({}),
  seed: z.union([z.number(), z.string()]).optional(),
  interactable: id.optional(),
  visibleWhen: conditionSchema.optional(),
  collider: z.boolean().optional(),
})
export type AreaObject = z.infer<typeof areaObjectSchema>

export const areaSchema = z.object({
  id,
  name: z.string(),
  sector: z.enum(['EXTERIOR', 'MAIN_HALL', 'WEST_WING', 'EAST_WING', 'UPPER', 'BASEMENT', 'UNDERGROUND']),
  kind: z.enum(['interior', 'exterior']),
  bounds: z.object({ min: vec3, max: vec3 }),
  neighbors: z.array(id).default([]),
  footsteps: z.enum(['wood', 'stone', 'gravel', 'carpet']).default('wood'),
  /** 0 = chuva plena, 1 = totalmente abafada. */
  rainMuffle: z.number().min(0).max(1).default(0.7),
  fog: z.object({ color: z.string(), density: z.number() }).optional(),
  background: z.string().optional(),
  rooms: z.array(roomSchema).default([]),
  lights: z.array(lightSchema).default([]),
  objects: z.array(areaObjectSchema).default([]),
  ambience: z
    .array(z.object({ sound: id, position: vec3.optional(), volume: z.number().default(1), when: conditionSchema.optional() }))
    .default([]),
  spawn: z.object({ position: vec3, yaw: z.number().default(0) }).optional(),
})
export type AreaDef = z.infer<typeof areaSchema>

// ------------------------------------------------------------------ Journal

export const journalCategories = ['PEOPLE', 'FAMILIES', 'PLACES', 'EVENTS', 'DOCUMENTS', 'SYMBOLS', 'UNRESOLVED'] as const
export type JournalCategory = (typeof journalCategories)[number]

export const journalSchema = z.object({
  entries: z.array(
    z.object({
      id,
      category: z.enum(journalCategories),
      title: z.string(),
      text: z.string(),
      unlockWhen: conditionSchema.optional(),
      /** Quando verdadeiro, a entrada UNRESOLVED é marcada como resolvida (não a resposta: só "you have a lead"). */
      resolvedWhen: conditionSchema.optional(),
    }),
  ),
  board: z.object({
    nodes: z.array(
      z.object({
        id,
        label: z.string(),
        x: z.number(),
        y: z.number(),
        showWhen: conditionSchema.optional(),
        /** Antes disso o nó aparece como "?". */
        revealWhen: conditionSchema.optional(),
      }),
    ),
    edges: z.array(
      z.object({
        from: id,
        to: id,
        label: z.string().optional(),
        showWhen: conditionSchema.optional(),
        /** Sem confirmação a aresta é tracejada com "?". */
        confirmedWhen: conditionSchema.optional(),
      }),
    ),
  }),
})
export type JournalContent = z.infer<typeof journalSchema>

// ------------------------------------------------------------------ Story

export const storySchema = z.object({
  /** Gatilhos narrativos reagindo a eventos do bus. */
  triggers: z.array(
    z.object({
      id,
      on: z.string(),
      /** Subconjunto do payload que precisa bater (ex.: { "area": "library" }). */
      match: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
      once: z.boolean().default(true),
      conditions: conditionSchema.optional(),
      actions: z.array(actionSchema),
    }),
  ),
  progress: z.array(z.object({ id, weight: z.number().positive(), when: conditionSchema })),
  start: z.object({
    area: id,
    position: vec3,
    yaw: z.number(),
    clock: z.object({ day: z.number().int().min(1).max(8), minutes: z.number().int().min(0).max(1439) }),
    flags: z.record(flagValue).default({}),
  }),
})
export type StoryContent = z.infer<typeof storySchema>

// ------------------------------------------------------------------ Audio

export const soundSchema = z.object({
  id,
  /** Patch procedural usado enquanto não há sample. */
  synth: z.string(),
  /** Sample real (Higgsfield/gravação). Se falhar ao carregar, cai para o synth. */
  src: z.string().optional(),
  volume: z.number().default(1),
  spatial: z.boolean().default(false),
  loop: z.boolean().default(false),
  /** Distância de referência para áudio espacial. */
  refDistance: z.number().default(2),
})
export type SoundDef = z.infer<typeof soundSchema>
