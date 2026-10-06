# GAME DESIGN

## Pilares

Mistério ambiental · arquitetura como puzzle e narrativa · solidão e incerteza · sem combate · sem jumpscares baratos.

## Loop

EXPLORE → DISCOVER → UNDERSTAND → SOLVE → UNLOCK → DISCOVER MORE.

## Controles (implementados)

WASD mover · Mouse câmera · E interagir · F lamparina · Shift correr · Tab pertences/journal/quadro · Esc menu.
Na inspeção: arrastar inclina, roda dá zoom, F vira, T transcrição, E/Esc larga. No relógio: A/D horas, W/S minutos (Shift ×5), E "Let it strike", Esc recua.
Ensino progressivo por gatilhos (`story.json`): WASD aos 2,5 s; Shift aos 16 s; "F — light the lamp" ao ter lamparina + fósforos; "Tab" no primeiro documento; avisos de escuridão na biblioteca/passagem se a lamparina estiver apagada.

## Estrutura (7 atos)

I Arrival · II The Family · III The Meridian · IV 1936 · V Arthur · VI Below · VII The Eighth Record.

## Tempo

7 dias de jogo (22–28/10/1998). Relógio de jogo: 1 min a cada 6 s reais, avança só fora de pausa. Meia-noite do 7º dia = começa o final com o que o jogador descobriu (sem game over — ver §11, D-2).

## Interação & Inspeção

Raycast central. Inspeção: aproximar, girar, zoom, frente/verso, detalhes (verso de fotografia, número na chave, base de estátua). Pistas **não** são destacadas automaticamente.

## Inventário

KEY ITEMS, TOOLS, DOCUMENTS, PHOTOGRAPHS, NOTES, MAPS, RECORDINGS. Itens combináveis (ex.: fita + gravador).

## Journal

Preenche sozinho, sem resolver mistérios. Categorias: PEOPLE, FAMILIES, PLACES, EVENTS, DOCUMENTS, SYMBOLS, UNRESOLVED. Grafo: nós conhecidos, arestas confirmadas, "?" para inferências.

## Perigo

Sem inimigos. Armadilhas arquiteturais telegrafadas e justas. Escuridão e som criam tensão.

## Progressão

Narrativa como mecanismo (ver PUZZLES). Regra dos três.

## Vertical slice (10–20 min)

Chegada → carta → Hall → pista → Study → foto + 2:17 → Library → relógio → CLICK → passagem. (ver PUZZLES.md)

## 11. DECISÕES DE CANON (tomadas pelo usuário em 2026-10-06)

**D-1 → A + B: a Testemunha e o Registro Físico.** O Eighth Record existe como objeto *e* só se completa com o protagonista.
- **Objeto:** o *Witness Ledger* — o oitavo dos oito livros-registro guardados na Meridian Chamber (um por função). Os outros sete continuam em uso/cópia (Mercer). O oitavo para em 1871 (a recusa de Josiah Orrin); as entradas Orrin anteriores foram raspadas.
- **Só um Orrin consegue lê-lo:** as entradas da Testemunha estão numa contagem cifrada transmitida oralmente na família (uma cantiga de contar que Eleanor ensinou a Ruth; Ruth a deixa na carta guardada em St. Brigid's). Explicação racional (memória de família = chave); leitura ambígua possível (o livro "espera" quem lê).
- **Você é o Eighth Record:** decifrado, o livro não contém a resposta que Arthur procurava — contém a linhagem Orrin, e a última linha **já traz o nome do protagonista**, numa caligrafia antiga (ver D-3). O registro está incompleto até a Testemunha viva confirmar.
- **Escolha final (de A):** *validar* (assinar como Testemunha: o Rite se completa, a casa "silencia"), *romper* (destruir o livro e selar a câmara), *ficar* (guardar o livro e assumir a casa como Testemunha). As opções disponíveis dependem do que foi descoberto (D-2).

**D-2 → 3: sem game over; o final muda conforme as descobertas.**
- À meia-noite do 7º dia o prazo vence e o final começa **onde o jogador estiver**, com o que ele sabe. Antes disso, chegar à Meridian Chamber e abrir o Witness Ledger também leva ao final.
- Níveis (revelações da matriz `LORE_BIBLE §5` confirmadas por ≥ 2 pistas cada):

  | Nível | Condição aproximada | Final |
  |---|---|---|
  | 0 — *The Unread Record* | não abriu o Ledger | Os executores voltam ao amanhecer; a casa fica com o jogador, o livro fica fechado. O nome aparece só na escritura. |
  | 1 — *The Witness* | abriu o Ledger, poucas revelações | Escolhas: validar ou romper. Epílogo curto, várias perguntas abertas. |
  | 2 — *The Eighth* | abriu + maioria das revelações (inclui "o protagonista é Orrin" e "quem pagou") | As três escolhas (validar/romper/ficar) + epílogo completo (Eleanor, Ruth, 1936). |

- Não há morte nem "tarde demais" punitivo: perder o prazo só reduz o que o final explica.

**D-3 → nome revelado só no final: WORREN.**
- Nunca aparece antes: cartas dizem "Dear Heir"; documentos oficiais têm o nome rasurado/coberto; a UI nunca o mostra; nada no slice o menciona.
- No final, é lido na última linha do Witness Ledger (níveis 1–2) ou na escritura entregue pelos executores (nível 0).
- [DECISÃO] Worren é o nome dado por **Ruth Orrin** ao nascer — o sobrenome escondido no próprio nome (W·ORREN ≈ ORRIN). O sobrenome adotivo nunca é mostrado. Gênero do protagonista permanece não especificado.
