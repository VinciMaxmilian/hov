import { setRevelationDefs } from '../rules/evaluate'
import { buildRegistry, type ContentRegistry } from './registry'

/** Todo o conteúdo do jogo, carregado e validado uma vez no boot. */
export const content: ContentRegistry = buildRegistry({
  areas: import.meta.glob('../../content/areas/*.json', { eager: true }),
  items: import.meta.glob('../../content/items/*.json', { eager: true }),
  documents: import.meta.glob('../../content/documents/*.json', { eager: true }),
  interactables: import.meta.glob('../../content/interactables/*.json', { eager: true }),
  puzzles: import.meta.glob('../../content/puzzles/*.json', { eager: true }),
  sounds: import.meta.glob('../../content/audio/*.json', { eager: true }),
  journal: import.meta.glob('../../content/journal/*.json', { eager: true }),
  story: import.meta.glob('../../content/story/*.json', { eager: true }),
})

setRevelationDefs(content.story.revelations)

export type { ContentRegistry }
