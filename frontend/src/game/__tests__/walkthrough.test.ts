import { beforeEach, describe, expect, it } from 'vitest'
import { content } from '../content'
import { scheduler } from '../core/scheduler'
import { describe as describeTarget, interact } from '../interaction/interact'
import { refreshJournal, installJournalSystem } from '../journal/journalSystem'
import { adjustClock, attemptPuzzle } from '../puzzles/puzzleSystem'
import { progressOf } from '../save/saveManager'
import { useGame } from '../state/gameStore'
import { createNewGameState } from '../state/newGame'
import { useUi } from '../state/uiStore'
import { installStoryDirector } from '../story/storyDirector'
import { installSessionHooks } from '../session'
import { toggleLamp } from '../player/lampControl'

/**
 * Joga o vertical slice inteiro pela engine (sem renderização): garante que a cadeia
 * narrativa/puzzles é solucionável e que os estados do mundo evoluem como o design pede.
 */
installStoryDirector()
installJournalSystem()
installSessionHooks()

const g = () => useGame.getState()
const closeOverlays = () => useUi.setState({ mode: 'playing', inspect: null, activePuzzle: null, cameraFocus: null })
const enter = (area: string) => g().setArea(area)
const wait = (ms: number) => scheduler.tick(ms)

describe('vertical slice — walkthrough', () => {
  beforeEach(() => {
    scheduler.clear()
    g().replace(createNewGameState(content), 1)
    useUi.setState({ mode: 'playing', endingPending: false })
  })

  it('do portão à passagem secreta', () => {
    // Varanda: carta, chave, lamparina, fósforos.
    interact('porch_envelope')
    expect(g().documents).toContain('doc_arthur_letter')
    expect(useUi.getState().mode).toBe('inspect')
    closeOverlays()
    interact('porch_key')
    interact('porch_lamp')
    interact('porch_matches')
    toggleLamp()
    expect(g().flags.lamp_lit).toBe(true)
    expect(g().inventory).toEqual(expect.arrayContaining(['entry_key', 'oil_lamp', 'matches']))
    expect(g().world.porch_key).toBe('taken')
    expect(describeTarget('porch_key')).toBeNull()

    // Porta principal: trancada → destrancada com a chave.
    interact('main_door')
    expect(g().world.main_door).toBe('open')
    expect(g().flags.front_door_oiled).toBe(true)
    enter('entrance_hall')
    wait(3000)
    expect(g().world.main_door).toBe('closed') // a corrente de ar fecha a porta atrás do jogador

    // Study trancado até achar a chave no porta-guarda-chuvas.
    interact('study_door')
    expect(g().world.study_door).toBe('locked')
    interact('hall_umbrella_stand')
    expect(g().inventory).toContain('study_key')
    interact('study_door')
    expect(g().world.study_door).toBe('open')
    enter('arthur_study')

    // Study: foto, relatório, nota, fita, gaveta → maçaneta.
    for (const id of ['study_photo', 'study_report', 'study_note_217']) {
      interact(id)
      closeOverlays()
    }
    interact('study_tape_recorder')
    expect(g().documents).toContain('doc_arthur_tape_01')
    interact('library_door')
    expect(g().world.library_door).toBe('locked')
    interact('study_desk_drawer')
    expect(g().inventory).toContain('library_knob')
    wait(33000)
    expect(g().flags.heard_knocking).toBe(true) // batidas na parede depois da fita

    // Biblioteca: a maçaneta é consumida ao destravar.
    enter('entrance_hall')
    interact('library_door')
    expect(g().world.library_door).toBe('open')
    expect(g().inventory).not.toContain('library_knob')
    enter('library')
    interact('library_newspaper')
    closeOverlays()

    // Relógio: hora errada falha; 2:17 abre a estante.
    interact('library_clock')
    expect(useUi.getState().mode).toBe('puzzle')
    attemptPuzzle('library_clock')
    expect(g().puzzles.library_clock.status).toBe('unsolved')
    // 10:08 → 2:17 = +4 h e +9 min
    for (let i = 0; i < 4; i++) adjustClock('library_clock', 'hour', 1)
    for (let i = 0; i < 9; i++) adjustClock('library_clock', 'minute', 1)
    expect(g().puzzles.library_clock.values).toEqual({ hour: 2, minute: 17 })
    attemptPuzzle('library_clock')
    expect(g().puzzles.library_clock.status).toBe('solved')
    expect(g().world.library_bookcase).toBe('closed') // o mecanismo demora
    wait(5000)
    expect(g().world.library_bookcase).toBe('open')
    expect(useUi.getState().mode).toBe('playing') // close-up encerrado

    // Passagem: símbolo de 8 pontos e o registro pré-1847 encerram o slice.
    enter('secret_passage')
    interact('passage_symbol')
    interact('passage_record')
    expect(g().documents).toContain('doc_pre1847_record')
    expect(useUi.getState().endingPending).toBe(true)
    useUi.getState().closeInspect()
    expect(useUi.getState().mode).toBe('ending')

    // Journal organizou o que foi descoberto. Só falta o que depende da UI (virar páginas: onView).
    refreshJournal()
    expect(g().journal).toEqual(expect.arrayContaining(['j_arthur', 'j_1936', 'j_passage', 'j_symbol_eight', 'u_217']))
    expect(progressOf()).toBe(94)
  })

  it('container já revistado não dá o item de novo', () => {
    interact('hall_umbrella_stand')
    g().removeItem('study_key')
    interact('hall_umbrella_stand')
    expect(g().inventory).not.toContain('study_key')
  })
})
