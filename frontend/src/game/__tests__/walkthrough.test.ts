import { beforeEach, describe, expect, it } from 'vitest'
import { content } from '../content'
import { scheduler } from '../core/scheduler'
import { describe as describeTarget, interact } from '../interaction/interact'
import { refreshJournal, installJournalSystem } from '../journal/journalSystem'
import { adjustClock, attemptPuzzle, pressSequence, turnDial } from '../puzzles/puzzleSystem'
import { progressOf } from '../save/saveManager'
import { useGame } from '../state/gameStore'
import { createNewGameState } from '../state/newGame'
import { useUi } from '../state/uiStore'
import { installStoryDirector } from '../story/storyDirector'
import { chooseEnding, currentEnding } from '../story/endings'
import { installSessionHooks } from '../session'
import { toggleLamp } from '../player/lampControl'
import { run } from '../rules/effects'
import { evaluate } from '../rules/evaluate'

/**
 * Joga o jogo inteiro pela engine (sem renderização): garante que a cadeia dos sete atos é solucionável,
 * que o relógio/os capítulos avançam e que os três finais são alcançáveis.
 */
installStoryDirector()
installJournalSystem()
installSessionHooks()

const g = () => useGame.getState()
const ui = () => useUi.getState()
const closeOverlays = () => useUi.setState({ mode: 'playing', inspect: null, activePuzzle: null, cameraFocus: null })
const enter = (area: string) => g().setArea(area)
const wait = (ms: number) => scheduler.tick(ms)
/** Lê o documento como a UI faz: todas as páginas (onView). */
const read = (doc: string) => {
  for (const p of content.documents.get(doc)!.pages) run(p.onView)
  closeOverlays()
}
const act = (id: string) => {
  interact(id)
  closeOverlays()
}
const take = (id: string, doc?: string) => {
  interact(id)
  if (doc) read(doc)
  closeOverlays()
}
const dials = (puzzle: string, deltas: number[]) => deltas.forEach((d, i) => d && turnDial(puzzle, i, d))

function playActOne() {
  take('porch_envelope', 'doc_arthur_letter')
  take('porch_card', 'doc_executor_card')
  act('porch_key')
  act('porch_lamp')
  act('porch_matches')
  toggleLamp()
  expect(g().flags.lamp_lit).toBe(true)
  expect(describeTarget('porch_key')).toBeNull()

  act('main_door')
  expect(g().world.main_door).toBe('open')
  expect(g().flags.front_door_oiled).toBe(true)
  enter('entrance_hall')
  wait(3000)
  expect(g().world.main_door).toBe('closed') // a corrente de ar fecha a porta atrás do jogador

  act('study_door')
  expect(g().world.study_door).toBe('locked')
  act('hall_umbrella_stand')
  act('study_door')
  expect(g().world.study_door).toBe('open')
  enter('arthur_study')
  take('study_photo', 'doc_meridian_photo')
  take('study_report', 'doc_police_report_1936')
  take('study_note_217', 'doc_arthur_note_217')
  act('study_tape_recorder')
  act('library_door')
  expect(g().world.library_door).toBe('locked')
  act('study_desk_drawer')
  expect(g().inventory).toContain('library_knob')
  wait(33000)
  expect(g().flags.heard_knocking).toBe(true) // batidas na parede oeste depois da fita

  act('library_door')
  expect(g().world.library_door).toBe('open')
  expect(g().inventory).not.toContain('library_knob')
  enter('library')
  take('library_newspaper', 'doc_newspaper_1936')
  // portas trancadas do lado da biblioteca abrem por dentro
  act('hall_library_door')
  expect(g().world.hall_library_door).toBe('open')

  interact('library_clock')
  expect(ui().mode).toBe('puzzle')
  attemptPuzzle('library_clock')
  expect(g().puzzles.library_clock.status).toBe('unsolved')
  for (let i = 0; i < 4; i++) adjustClock('library_clock', 'hour', 1)
  for (let i = 0; i < 9; i++) adjustClock('library_clock', 'minute', 1)
  attemptPuzzle('library_clock')
  expect(g().puzzles.library_clock.status).toBe('solved')
  wait(5000)
  expect(g().world.library_bookcase).toBe('open')
  expect(ui().mode).toBe('playing')

  enter('the_seam')
  act('passage_counterweight')
  act('passage_symbol')
  take('passage_record', 'doc_pre1847_record')
  wait(7000)
  expect(g().clock.day).toBe(2)
}

function playActTwo() {
  act('seam_west_door')
  expect(g().world.seam_west_door).toBe('locked')
  enter('cottage')
  take('caretaker_book', 'doc_caretaker_book')
  act('cottage_hammer')
  enter('the_seam')
  act('seam_west_door')
  expect(g().world.seam_west_door).toBe('open')
  enter('west_wing')
  act('west_door')
  expect(g().world.west_door).toBe('open')
  take('widow_diary', 'doc_margaret_diary')
  take('elias_field_book', 'doc_field_book_1849')
  take('family_register', 'doc_family_register')
  interact('margaret_portrait')
  expect(ui().activePuzzle).toBe('margaret_lock')
  dials('margaret_lock', [0, -1, 3, -2]) // 1 9 1 1 → 1 8 4 9
  attemptPuzzle('margaret_lock')
  expect(g().inventory).toContain('meridian_key')
  wait(2500)
  expect(g().documents).toContain('doc_letter_1888')
  read('doc_letter_1888')
  wait(7000)
  expect(g().clock).toMatchObject({ day: 3 })
}

function playActThree() {
  enter('entrance_hall')
  act('gallery_door')
  expect(g().world.gallery_door).toBe('open')
  enter('observatory')
  take('observing_card', 'doc_observing_card')
  interact('telescope')
  attemptPuzzle('meridian_transit')
  expect(g().puzzles.meridian_transit.status).toBe('unsolved')
  dials('meridian_transit', [-4, 1]) // sul → norte, 30° → 45°
  attemptPuzzle('meridian_transit')
  expect(g().inventory).toContain('vault_key')
  wait(3000)
  read('doc_meridian_chart')
  enter('cemetery')
  act('grave_nameless')
  act('vault_door')
  enter('vale_vault')
  interact('hannah_box')
  expect(g().inventory).toContain('east_wing_key')
  read('doc_hannah_note')
  read('doc_minutes_1871')
  wait(7000)
  expect(g().clock.day).toBe(4)
}

function playActFour() {
  enter('entrance_hall')
  act('east_wing_door')
  expect(g().world.east_wing_door).toBe('open')
  enter('east_wing')
  take('dining_place_cards', 'doc_place_cards')
  act('dining_w_card')
  take('dining_seating', 'doc_seating_1936')
  take('pell_daybook', 'doc_pell_daybook')
  enter('upper_floors')
  take('lucille_letter', 'doc_lucille_letter')
  enter('garage')
  interact('sedan_glovebox')
  read('doc_eleanor_telegram')
  enter('east_wing')
  interact('bell_board')
  pressSequence('bell_board', 1) // errado: recomeça
  pressSequence('bell_board', 2)
  pressSequence('bell_board', 3)
  expect(g().puzzles.bell_board.status).toBe('unsolved')
  for (const b of [0, 1, 8]) pressSequence('bell_board', b)
  expect(g().puzzles.bell_board.status).toBe('solved')
  wait(3000)
  read('doc_edmund_letter')
  read('doc_order_of_night')
  wait(7000)
  expect(g().clock.day).toBe(5)
}

function playActFive() {
  enter('exterior')
  expect(describeTarget('porch_parcel')).not.toBeNull()
  take('porch_parcel', 'doc_st_brigid')
  read('doc_ruth_letter')
  expect(g().inventory).toContain('ruth_key')
  enter('east_wing')
  act('turret_lamp')
  take('arthur_heir_card', 'doc_arthur_heir_card')
  take('eleanor_letter', 'doc_eleanor_letter_1971')
  act('turret_tape')
  enter('exterior')
  act('arthur_car')
  enter('cellars')
  interact('mercer_cabinet')
  dials('mercer_cabinet', [1, 1, 1, -3]) // a noite: 11/17
  attemptPuzzle('mercer_cabinet')
  expect(g().puzzles.mercer_cabinet.status).toBe('solved')
  wait(2500)
  read('doc_ashcroft_receipts')
  read('doc_whitmore_register')
  act('old_passage_grille')
  expect(g().world.old_passage_grille).toBe('open')
  wait(7000)
  expect(g().clock.day).toBe(6)
}

function playActsSixSeven() {
  enter('west_cellar')
  act('old_well')
  wait(1200)
  expect(g().player.area).toBe('below')
  act('elias_tally')
  act('lintel')
  interact('chamber_door')
  expect(ui().activePuzzle).toBe('eight_lamps')
  for (const i of [2, 6, 4, 7, 0, 3, 5, 0]) pressSequence('eight_lamps', i) // o oitavo errado
  expect(g().puzzles.eight_lamps.status).toBe('unsolved')
  for (const i of [2, 6, 4, 7, 0, 3, 5, 1]) pressSequence('eight_lamps', i)
  expect(g().puzzles.eight_lamps.status).toBe('solved')
  wait(4000)
  expect(g().world.chamber_door).toBe('open')
  closeOverlays()

  enter('meridian_chamber')
  wait(7000)
  expect(g().clock).toMatchObject({ day: 7, minutes: 1230 })
  act('chamber_floor')
  act('stair_1936_effects')
  take('seven_ledgers', 'doc_seven_ledgers')
  interact('witness_ledger')
  expect(ui().activePuzzle).toBe('witness_count')
  dials('witness_count', [-2, 1, 3, 4, 5]) // nós · contamos · aqueles · que · ficam
  attemptPuzzle('witness_count')
  expect(g().flags.ledger_read).toBe(true)
  wait(10000)
}

describe('jogo completo — walkthrough', () => {
  beforeEach(() => {
    scheduler.clear()
    g().replace(createNewGameState(content), 1)
    useUi.setState({ mode: 'playing', endingPending: false, ending: null })
  })

  it('dos portões à Câmara do Meridiano: o final completo', () => {
    playActOne()
    playActTwo()
    playActThree()
    playActFour()
    playActFive()
    playActsSixSeven()

    const ending = currentEnding()
    expect(ending?.def.id).toBe('the_eighth')
    expect(ending?.choices.map((c) => c.id)).toEqual(['validate', 'break', 'stay'])
    expect(ui().mode).toBe('ending')
    chooseEnding('stay')
    expect(g().flags.ending_choice).toBe('stay')

    for (const r of content.story.revelations) expect(evaluate({ type: 'revelation', id: r.id }, g()), r.id).toBe(true)
    refreshJournal()
    expect(g().journal).toEqual(expect.arrayContaining(['j_arthur', 'j_found_it', 'j_minutes', 'j_reckoning', 'j_payer', 'j_eighth_record']))
    expect(progressOf()).toBe(100)
  })

  it('meia-noite do sétimo dia sem ler o livro: o registro não lido', () => {
    g().setClock(7, 1439)
    g().setClock(8, 1)
    wait(3500)
    expect(currentEnding()?.def.id).toBe('the_unread_record')
    expect(currentEnding()?.choices).toEqual([])
  })

  it('lendo o livro sem as revelações principais: a testemunha', () => {
    g().setFlag('ledger_read', true)
    run([{ type: 'beginEnding' }])
    expect(currentEnding()?.def.id).toBe('the_witness')
    expect(currentEnding()?.choices.map((c) => c.id)).toEqual(['validate', 'break'])
  })

  it('container já revistado não dá o item de novo', () => {
    interact('hall_umbrella_stand')
    g().removeItem('study_key')
    interact('hall_umbrella_stand')
    expect(g().inventory).not.toContain('study_key')
  })
})
