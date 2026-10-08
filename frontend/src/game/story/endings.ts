import { content } from '../content'
import { evaluate } from '../rules/evaluate'
import { requestSave } from '../save/saveManager'
import { useGame } from '../state/gameStore'
import { useUi } from '../state/uiStore'

/** Final em curso e as escolhas disponíveis (dependem do que foi descoberto — GAME_DESIGN §11, D-2). */
export function currentEnding() {
  const ui = useUi.getState().ending
  const def = ui ? content.story.endings.find((e) => e.id === ui.id) : undefined
  if (!ui || !def) return null
  const state = useGame.getState()
  return { def, choice: ui.choice, choices: def.choices.filter((c) => evaluate(c.when, state)) }
}

export function chooseEnding(choiceId: string): void {
  const ui = useUi.getState().ending
  if (!ui || ui.choice) return
  useGame.getState().setFlag('ending_choice', choiceId)
  useUi.setState({ ending: { ...ui, choice: choiceId } })
  requestSave('event')
}
