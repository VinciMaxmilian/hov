# PUZZLES

## Arquitetura (resumo; detalhes em ARCHITECTURE §5)
Puzzle = dados JSON: `{id, requirements, input, conditions, successActions, failureActions}`. Tipos de input:
- `clock` — horas/minutos (A/D, W/S, E "deixar bater").
- `dials` — N mostradores com opções (dígitos, rumos, palavras); valores `d0..dn` = índice da opção (A/D escolhe, W/S gira, E tenta).
- `sequence` — toques em ordem (campainhas, lamparinas); valor `seq` = últimos N índices; confere sozinho ao completar N toques (1–9/0 no teclado).
Conditions e Actions são a DSL comum (flag, item, world, document, puzzle, clock, revelation(s), and/or/not; setWorld, giveItem, discoverDocument, setClock, chapter, teleport, beginEnding…). Novos puzzles = novos JSON.

## Princípios
Integração narrativa (não "chave azul abre porta azul"); regra de três pistas; sem mortes injustas; pistas falsas só em voz de personagens; nenhuma solução depende de um único documento.

## Cadeia principal (implementada; jogada de ponta a ponta em `src/game/__tests__/walkthrough.test.ts`)
Cada ato termina num **corte**: a tela escurece, o relógio salta para o dia seguinte e aparece o cartão do ato. O prazo (meia-noite do 7º dia) só aperta de verdade no Ato VII.

### Ato I — Arrival (quinta, 18:40, noite)
1. **Varanda (porte-cochère)** — mesa com envelope (DOC01), cartão dos executores, chave de ferro, lamparina, fósforos. Porta dupla trancada → chave ("Someone has kept it oiled").
2. **Entrance Hall** — relógio de pé parado às 7:40; tique-taque vindo do oeste. Porta-guarda-chuvas (verso do envelope: "where visitors leave their wet things") → `study_key` (7 pontos no olhal).
3. **Arthur's Study** (antiga sala de estar, porta dupla a oeste do hall) — foto (DOC06), relatório (DOC05), nota "2:17", fita (DOC07; depois dela, três batidas na parede oeste = o poço do contrapeso). Gaveta → maçaneta (`library_knob`).
4. **Porta dupla Study → Library** sem maçaneta → `library_knob` (consumida).
5. **West Library** — jornal (DOC04). Relógio alto na parede norte: **2:17 e deixar bater** → CLICK → a estante da parede oeste gira na dobradiça (antes: "worn in an arc"). As portas da biblioteca para o hall/garden hall e para o mezanino abrem por dentro (atalhos).
6. **O vão ("the seam")** — contrapeso parado atrás de uma portinhola; símbolo de **8 pontos** na parede externa da ala de 1874; embrulho com DOC08 (1791). Pegar o DOC08 encerra o Ato I.

### Ato II — The Family (sexta, 09:00)
1. Porta do vão para a ala oeste **pregada com tábuas deste lado**. Pista: painel de ferramentas da cocheira ("Cottage — for the west boards. A.V.") e dica do capítulo. **Martelo de unha** no depósito do chalé do jardineiro (o caderno do caseiro, ao lado, é pista de quem mantém a casa).
2. Ala oeste (1874): porta externa aferrolhada por dentro (atalho); lareira-falsa; cofre de Elias vazio ("H.V. took them. Good. — M.V.").
3. **Retrato de Margaret (salão antigo) — `margaret_lock`, 4 dígitos = 1849.** Pistas: diário de Margaret (quarto da viúva; "the year he found the stone — two winters after we came west"); retrato de Elias ("came west 1847"); registro da família ("autumn 1847"); caderneta de campo de Elias (1849). Atrás: **carta de 1888 (DOC02)** "He found it" + **chave de bronze**. Ler a carta encerra o Ato II.

### Ato III — The Meridian (sábado, 16:30)
1. Porta da galeria do observatório (back stair, parede norte) → chave de bronze.
2. **Luneta — `meridian_transit`: cúpula ao NORTE e altura 45°.** Pistas: cartão de Hannah ("Turn the dome to the line… as high as Bellweather stands north… look DOWN the line"), relógio de sol ("BELLWEATHER · 45° N"), caderneta de Elias (norte verdadeiro). Pela ocular: o mausoléu exatamente na linha. A gaveta do mecanismo dá a **chave do mausoléu** + mapa da linha.
3. Seguir as lajes do meridiano até o **jazigo da família**: lápide sem nome (1871, 8 pontos). Mausoléu → caixa de lata de Hannah: **ata de 1871** (8 funções; "One refused"; nome raspado; "the Witness's book… kept apart"), bilhete de Hannah ("Count the places") e **chave da ala leste**. Ler o bilhete encerra o Ato III.

### Ato IV — 1936 (domingo, 19:30)
1. Porta da ala leste (cadeado) → chave de Hannah. Demais portas da ala abrem por dentro.
2. Sala de jantar posta desde 1936: cartões de lugar (Julian = **Medicine**), lugar "W." na ponta, disposição de Lucille com **8 lugares** (foto alterada, pista 3).
3. Cozinha: livro de Mrs. Pell ("he will ring… LIBRARY, then DINING, then TURRET… the papers are behind the bells").
4. **Quadro de campainhas — `bell_board` (sequência de 3): Biblioteca → Jantar → Torre.** Painel secreto: **Ordem da Noite** (descida pelo vão às 2:17; voto de Julian "NO"; Testemunha: Eleanor Orrin) + carta de Edmund a Eleanor ("the key to the old way down, by the well"). Ler a Ordem encerra o Ato IV.
5. Opcionais: telegrama de Eleanor no porta-luvas do sedã de 1934; diário de Beatrice; carta não enviada de Lucille (quarto principal).

### Ato V — Arthur (segunda, 10:00 — dia do caseiro)
1. Pacote na mesa da varanda (St. Brigid's, a pedido de Arthur): certidão de adoção (mãe: Ruth Orrin), **carta de Ruth com a cantiga de contar** e a **chave de Ruth** (8 pontos).
2. Torre (a janela acesa): lamparina "KEEP LIT — E.O., 1937", ficha "THE HEIR IS THE EIGHTH", carta de Eleanor (1971), fita 31.
3. Perua de Arthur: fita 40 ("Mercer's cabinet… the night. Month first").
4. **Armário do Mercer (arquivo do porão) — `mercer_cabinet` = 1117 (aceita 1711).** Recibos do Ashcroft Trust (E.O. 1937–1971; 1968 "rebinding, vellum, one volume") + registro Whitmore com o recorte.
5. **Grade da passagem antiga (porão → adega oeste)** → chave de Ruth. Abrir encerra o Ato V.

### Ato VI — Below (terça, 16:00)
1. Adega oeste → **poço antigo** ("Climb down"; teleporte com escurecimento) → túnel de Elias (entalhe "IX · III · MDCCCXLIX · E.V.") → antecâmara.
2. **Oito lamparinas — `eight_lamps` (sequência de 8): na ordem em que as cadeiras se sentam, a Testemunha por último:** livro, balança, engrenagem, serpente, moeda, sino, pena, olho. Pistas: ata de 1871 (ordem + emblemas), verga ("LIGHT THEM AS THEY SIT. THE EIGHTH LAST."). Errar apaga tudo. A porta de pedra desce; entrar na câmara inicia o Ato VII.

### Ato VII — The Eighth Record (quarta, 20:30 — prazo à meia-noite)
1. Câmara do Meridiano: gravura de 8 pontos, gnômon, sete livros (todos param em 17/11/1936, 2:17), coisas dos onze nos últimos degraus da escada de 1936.
2. **Livro da Testemunha — `witness_count` (5 mostradores de palavras):** cada círculo tem um ponto; contar a partir do alto no sentido do sol (1–8) e pegar a palavra da linha correspondente da cantiga de Ruth → **"we · count · those · who · stay"** (pt: "nós · contamos · aqueles · que · ficam"). Sem ter lido a carta de Ruth, o livro "não significa nada".
3. Decifrado → o final começa (nível conforme as revelações). Meia-noite do 7º dia sem decifrar → final nível 0.

## Finais (GAME_DESIGN §11)
| Final | Condição | Escolhas |
|---|---|---|
| **The Eighth** | livro lido + revelações "o herdeiro é Orrin" e "quem pagou" + ≥ 5 das 7 revelações | validar · romper · ficar |
| **The Witness** | livro lido | validar · romper |
| **The Unread Record** | meia-noite do 7º dia sem ler | — (o nome aparece na escritura) |
Revelações = matriz LORE §5, cada uma confirmada por 2 de 3 pistas (`story.revelations`).

## Revelações × pistas implementadas
| Revelação | Pistas no jogo |
|---|---|
| Elias não fundou a Sociedade | carta de 1888 · símbolo de 8 pontos na parede de 1874 · DOC08 (1791) |
| O selo original tem 8 pontos | diário de Margaret · gravura do piso da câmara · chave de Ruth |
| A foto foi alterada | verso da foto · recorte (detalhe) ou carta de Lucille · disposição de 8 lugares |
| Testemunha apagada (Orrin) | ata de 1871 · lápide sem nome · registro Whitmore recortado |
| O herdeiro é Orrin | certidão de adoção · chave de Ruth · ficha de Arthur |
| Quem pagou | recibos do Trust · assinatura E.O./lamparina da torre/caderno do caseiro · carta de Eleanor (1971) |
| Julian não era o oitavo | cartões de lugar · Ordem da Noite (voto) · registro Whitmore |

## Catálogo para futuras expansões
| ID | Tema | Ideia |
|---|---|---|
| photo_layers | Fotografias | Luz rasante da lamparina revela o recorte (hoje é detalhe clicável). |
| flooded_cellar | Armadilha | Adega que inunda; válvula visível por reflexo. |
| meridian_tunnel | Exploração | Túnel do meridiano do observatório à cripta do mausoléu (volumes já previstos no ambiente original). |
| greenhouse_boiler | Exploração | Abóbada da caldeira sob a estufa. |
