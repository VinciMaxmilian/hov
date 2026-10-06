# GAME DESIGN

## Pilares
Mistério ambiental · arquitetura como puzzle e narrativa · solidão e incerteza · sem combate · sem jumpscares baratos.

## Loop
EXPLORE → DISCOVER → UNDERSTAND → SOLVE → UNLOCK → DISCOVER MORE.

## Controles
WASD mover · Mouse câmera · E interagir · F lamparina · Shift correr · Tab inventário/journal · Esc menu. Ensinados progressivamente (prompts contextuais discretos).

## Estrutura (7 atos)
I Arrival · II The Family · III The Meridian · IV 1936 · V Arthur · VI Below · VII The Eighth Record.

## Tempo
7 dias de jogo (22–28/10/1998). Relógio de jogo avança lentamente com eventos/descanso; meia-noite do 7º dia = fim (soft: o jogador é avisado; decisão pendente se haverá fim forçado — ver §11).

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

## 11. DECISÕES PENDENTES (afetam canon profundo — preciso da sua escolha)
**D-1. Natureza final do "Eighth Record"** (hoje: protagonista é Orrin/Witness; ver LORE §2.1).
 - **A — A Testemunha:** o Record é o protagonista como Witness vivo; escolha final: *validar* o Rite (completa o ciclo, tudo "fica como está"), *romper* (selar/destruir a câmara) ou *ficar* (assumir a casa como Witness). Ambiguidade mantida. *(recomendada)*
 - **B — O Registro Físico:** existe uma tábua/gravação final que só o Orrin consegue "ler" (ressonância/ritual); o protagonista é a chave, não o conteúdo. Mais jogável, menos "você é o registro".
 - **C — O Ciclo:** o Record é a lista de Witnesses anteriores; o protagonista é a 8ª entrada e as anteriores desapareceram (tom mais sobrenatural). Maior risco de clichê.
**D-2. Fim do prazo (7 dias):** (1) soft: final "tarde demais" mas explorável; (2) hard: fim do jogo; (3) sem game over, o final muda conforme descobertas. *(recomendo 3)*
**D-3. Protagonista:** nome revelado só no final vs. nunca. *(recomendo nunca)*
Enquanto não decidir, o slice usa A como padrão (não compromete o código).
