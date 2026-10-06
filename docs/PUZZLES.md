# PUZZLES

## Arquitetura (resumo; detalhes em ARCHITECTURE §5)
Puzzle = dados JSON: `{id, requirements, conditions, input?, successActions, failureActions}`. Conditions e Actions são uma DSL pequena e comum (flag, item, world, document, puzzle, and/or/not; setWorld, giveItem, revealDocument, setFlag, playSound, emit…). Novos puzzles = novos JSON.

## Princípios
Integração narrativa (não "chave azul abre porta azul"); regra de três pistas; sem mortes injustas; pistas falsas só em voz de personagens.

## Vertical slice — cadeia principal (implementada; ver `src/content/`)
Testada de ponta a ponta em `src/game/__tests__/walkthrough.test.ts`.

1. **Varanda (exterior)** — mesa com `entry_key`, lamparina, fósforos, envelope (DOC01) e o cartão dos executores (Hawthorne & Mercer). Porta principal trancada → abre com a chave ("Someone has kept it oiled" → pista de quem mantém a casa). Ao entrar, a porta se fecha atrás (corrente de ar) e a chuva abafa.
2. **Entrance Hall** — porta do Study trancada (fechadura de latão). Verso do envelope (só na inspeção, tecla F): *"What matters, I keep where visitors leave their wet things."* → **porta-guarda-chuvas** → `study_key` (latão, símbolo de **7 pontos** no bow — visível só ao inspecionar). Pode ser achada sem ler o verso (revistar é permitido).
   - Ambiente: tique-taque vem de *dentro da parede oeste*; o relógio de cornija visível está parado (pista e inquietação).
3. **Arthur's Study** — sobre a mesa: foto da Sociedade (DOC06; verso "Seven remained. One refused." + lápis de Arthur "Julian W.? — the eighth?" = **pista falsa na voz de Arthur**), relatório policial (DOC05; margem "Room measurements don't match the exterior wall.") e a nota "2:17 — the stopped clock. Not the hour. The chime.". Gravador: fita DOC07. **Gaveta** → maçaneta de latão (`library_knob`); revistar de novo: régua marcada a 1,2 m (pista da cavidade).
   - Ao voltar ao Study após ouvir a fita: **três batidas** dentro da parede norte (a cavidade). Não confirmado.
   - Detalhes da foto (clique, não destacados): bordas do recorte (cortado com lâmina) e **marcas no piso — demais para sete cadeiras**.
4. **Porta da Library** — sem maçaneta, só o eixo quadrado ("tirada, não quebrada") → usar `library_knob` (consumida).
5. **Library** — jornal de 1936 (DOC04) na mesa. **Relógio de pé**: close-up; A/D horas, W/S minutos (Shift ×5), E "Let it strike".
   - Pistas de 2:17 (regra de três): relatório (DOC05), nota de Arthur, jornal (DOC04).
   - "Not the hour. The chime.": acertar a hora não basta — é preciso **deixar bater**. Hora errada → uma badalada surda, nada acontece.
   - 2:17 → duas badaladas (2 h) → **CLICK** dentro da parede sul → a estante desliza para oeste (corpo cinemático, ~3,6 s) → passagem.
   - Pista ambiental extra: examinar a estante antes ("a finger's width proud of the wall… worn in a straight line, westward").
6. **Secret Passage** — corredor de 1,2 m entre Library e Study; contrapeso de ferro **parado** na corrente (explicação racional possível para as batidas — "If it swung, it would knock… It isn't swinging."). A passagem **desce** (rampa de 0,8 m): profundidade física = histórica. No fim: símbolo de **8 pontos** cortado em pedra anterior à parede + DOC08 (folha de levantamento de 1791, em francês: *"huit points… huit témoins… le registre y était déjà"*). Pegar o DOC08 encerra o slice.

### Revelações do slice × pistas
| O jogador pode concluir | Pistas no slice |
|---|---|
| Alguém mantém a casa | fechadura recém-lubrificada · lamparina preparada · janela acesa na ala leste |
| A versão pública de 1936 é falsa | jornal × relatório (porta trancada por dentro vs. "todas destrancadas"; relógio "elétrico" que é de corda; biblioteca × sala de jantar) |
| Existe uma 8ª posição | marcas no piso da foto · 8 pontos na pedra · "huit témoins" |
| Julian é "o oitavo"? (falso, voz de Arthur) | lápis no verso da foto — refutado em atos futuros (LORE §5) |

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
