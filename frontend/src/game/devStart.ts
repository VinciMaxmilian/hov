import { content } from './content'
import { teleport } from './player/playerRuntime'
import { beginPlay, startNewGame } from './session'
import { useGame } from './state/gameStore'
import { useUi } from './state/uiStore'
import { openPuzzle } from './puzzles/puzzleSystem'

/**
 * SOMENTE DEV (import.meta.env.DEV): começa um jogo no slot 3 direto numa área.
 * ?dev&area=<id>&yaw=<rad>&lamp=1&items=a,b&open=door1,door2&inspect=<doc|item>&puzzle=<id>&pos=x,y,z
 */
export function startDevSession(params: URLSearchParams): void {
  startNewGame(3)
  const areaId = params.get('area') ?? content.story.start.area
  const area = content.areas.get(areaId)
  const game = useGame.getState()
  for (const item of (params.get('items') ?? '').split(',').filter(Boolean)) game.addItem(item)
  for (const door of (params.get('open') ?? '').split(',').filter(Boolean)) game.setWorld(door, 'open')
  if (params.has('lamp')) {
    game.addItem('oil_lamp')
    game.addItem('matches')
    game.setFlag('lamp_lit', true)
  }
  if (area?.spawn) {
    const yaw = params.has('yaw') ? Number(params.get('yaw')) : area.spawn.yaw
    useGame.setState((s) => ({ player: { ...s.player, area: areaId } }))
    const pos = params.get('pos')?.split(',').map(Number)
    const at = pos && pos.length === 3 && pos.every(Number.isFinite) ? (pos as [number, number, number]) : area.spawn.position
    teleport(at, yaw, Number(params.get('pitch') ?? 0))
  }
  beginPlay(true)
  const inspect = params.get('inspect')
  if (inspect) {
    const kind = content.documents.has(inspect) ? 'document' : 'item'
    if (kind === 'document') game.discoverDocument(inspect)
    useUi.getState().openInspect({ kind, id: inspect })
  }
  const puzzle = params.get('puzzle')
  if (puzzle) openPuzzle(puzzle)
}
