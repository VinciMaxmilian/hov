# PUZZLES

## Arquitetura (resumo; detalhes em ARCHITECTURE §5)
Puzzle = dados JSON: `{id, requirements, conditions, input?, successActions, failureActions}`. Conditions e Actions são uma DSL pequena e comum (flag, item, world, document, puzzle, and/or/not; setWorld, giveItem, revealDocument, setFlag, playSound, emit…). Novos puzzles = novos JSON.

## Princípios
Integração narrativa (não "chave azul abre porta azul"); regra de três pistas; sem mortes injustas; pistas falsas só em voz de personagens.

## Vertical slice — cadeia principal
1. **Envelope de Arthur** (Entrance Hall): carta DOC01. Flag `read_arthur_letter`.
2. **Chegada**: na mesa da varanda ficam `entry_key`, lamparina e fósforos; a porta principal está trancada. **Porta do Study** — trancada; a chave com símbolo de 7 pontos (`study_key`) está no porta-guarda-chuvas do Hall. Objeto: porta-guarda-chuvas no Hall contém `study_key`. A dica está no verso do envelope ("What matters, I keep where visitors leave their wet things.") — só aparece ao inspecionar o verso.
3. **Study**: fotografia da Meridian Society (DOC06, inspecionável, frente/verso). Verso: "Seven remained. One refused." Mesa com anotação de Arthur: "2:17 — the stopped clock. Not the hour. The chime." + DOC07 fita (gravador).
4. **Relógio de pé (Library)**: ponteiros ajustáveis (hora/minuto). Condição: hour==2, minute==17 → `library_clock` solved.
   - Pista 1: relatório policial (DOC05) no Study: "stopped at 2:17".
   - Pista 2: anotação de Arthur na mesa.
   - Pista 3: manchete do jornal 1936 (DOC04) na Library: "...the clock in the dining hall stopped at 2:17 a.m."
5. **CLICK** → mecanismo na parede → estante (x=-10, parede sul) desliza → Secret Passage 01 revelada.
6. Fim do slice: símbolo de 8 pontos na parede da passagem + DOC08 fragmento (registro pré-1847).

## Puzzles do jogo completo (catálogo de ideias)
| ID | Tema | Ideia |
|---|---|---|
| margaret_portrait | Genealogia | Retrato de Margaret: atrás, mecanismo de 3 símbolos → compartimento com chave Meridian. Pista: registro "Elias guardava documentos atrás do retrato de Margaret". |
| meridian_sun_dial | Astronomia | Gnômon no observatório; luz do equinócio alinha a escada. |
| music_room_organ | Música | Sequência de notas = datas de nascimento das sete famílias. |
| archive_index | Registros | Índice do Mercer: rasuras em ordem de data revelam número do cofre. |
| flooded_cellar | Armadilha | Sala que inunda; alavanca visível por reflexo; porta cede ao detectar a válvula. |
| foundation_alignment | Arquitetura | Alinhar 8 pontos de luz nas paredes da Meridian Chamber. |
| photo_layers | Fotografias | Luz rasante revela o recorte; 8 posições de cadeira. |
| payor_trail | Documentos | Recibos Ashcroft → "E.O." → certidão. |
| lantern_oil | Iluminação | Lamparina limitada; luz fria/quente revela tinta invisível. |
