# CHANGELOG

## 0.4.0 — português + correções visuais (2026-10-07)
### Idioma
- Jogo inteiro em **English / Português**: seletor no título e em Configurações; padrão pelo idioma do navegador; preferência por aparelho.
- Localização por frase-fonte: `src/content/i18n/pt.json` (narrativa, dados) + `game/i18n/pt.ui.ts` (interface). Stores guardam o texto-fonte; tradução na renderização (troca de idioma é instantânea).
- `i18n.test.ts`: falha se qualquer texto de conteúdo ou de interface (`t()`/`tr()`/`msgid()`) ficar sem tradução, e se o nome do protagonista aparecer.
- Escolhas de tradução: protagonista sem gênero ("A quem herdar" no envelope; frases em 1ª pessoa sem concordância); DOC08 permanece em francês; nomes próprios e "Meridian Society"/"The Bellweather Courier" mantidos.
### Correções
- **Chão piscando (z-fighting):** a fundação externa tinha o topo no mesmo plano do piso do Hall (agora y = -0,01); molduras de portas/janelas recuadas para não coincidir com as faces do vão; lambri sem sobreposição nos cantos; `near` da câmera 0,05 → 0,1 (dobra a precisão de profundidade).
- **Portas "abrindo pela maçaneta":** a maçaneta era desenhada do lado da dobradiça; agora fica na borda oposta.
- **Objetos flutuando:** abajur do escritório estava fora do tampo da mesa; caixa empilhada removida; a chave da varanda ficava em pé com a argola enterrada no tampo (agora deitada).

## 0.3.0 — controles para celular/tablet (2026-10-06)
- Controles de toque: joystick dinâmico (borda = apressar), arrastar para olhar, botões interagir/lamparina/journal/menu; detecção automática + opção em Settings.
- `input.move()` unifica teclado e joystick; sem pointer lock no toque; tela cheia + paisagem ao jogar; aviso em retrato.
- Inspeção: pinça para zoom e botões (virar, texto, zoom) também no desktop. Layout responsivo de inspeção, journal, menus e puzzle.
- Ação `hint` ganhou `touch` (texto alternativo); dicas do `story.json` atualizadas.
- dpr menor em celulares. Modo dev: `touch=1|0`, `journal=<aba>`. +3 testes (`input.test.ts`).

## 0.2.2 — decisões de canon do usuário (2026-10-06)
- **D-1 = A + B:** o Eighth Record é o *Witness Ledger* físico (8º livro-registro da Meridian Chamber), legível só com a cifra da família Orrin; sua última linha já traz o nome do protagonista. Escolhas finais validar/romper/ficar. `LORE_BIBLE §2.8`.
- **D-2 = 3:** sem game over; à meia-noite do 7º dia o final começa com o que foi descoberto (níveis 0–2). `GAME_DESIGN §11`.
- **D-3:** nome do protagonista **Worren**, revelado só no final (nome dado por Ruth; "Orrin" escondido no nome).
- Erro (c) de Arthur ajustado: ele achava que o livro continha a resposta.

## 0.2.1 — correção (2026-10-06)
- `Room.wallRects`: subtração geral de retângulos. Aberturas empilhadas (porta + janela alta acima) geravam uma parede tapando a porta de entrada e as janelas da fachada. Testes em `walls.test.ts`.
- Modo dev: parâmetro `pos=x,y,z`.

## 0.2.0 — vertical slice jogável (2026-10-06)
### Engine
- Frontend completo: conteúdo JSON validado (zod + referências cruzadas), Rules DSL, event bus, story director, journal + quadro de conexões, puzzles, inspeção, inventário, áudio procedural espacial, lamparina, streaming por área, relógio de jogo.
- Save local (IndexedDB, 3 slots, autosave) + nuvem (Supabase, CAS por `rev`, fila offline, resolução de conflitos).
- Auth Supabase (email/senha, Google). Backend FastAPI (validação de saves, analytics) sem service_role.
- Migration `init_schema` aplicada no projeto Supabase `houseofvale` (advisors de segurança: 0 avisos).
- Testes: 17 (frontend, incl. walkthrough completo do slice) + 10 (backend).
### Conteúdo / canon [D]
- 5 áreas (exterior, Entrance Hall, Arthur's Study, West Library, passagem), 8 documentos, 5 itens, puzzle do relógio.
- Novas decisões em `LORE_BIBLE §2.7`: relógio de 2:17 na biblioteca oeste (jornal diz "dining hall"); relógio como mecanismo; DOC08 = "Relevé, 1791" ("huit témoins"); contrapeso parado; T. Mercer; Sheriff Coyle; Sgt. Dunmore; Ada Pell; poço de luz da ala oeste (`WORLD_MAP`).
- Nota de Arthur "Not the hour. The chime." vira mecânica: é preciso deixar o relógio bater.
### Docs
- Novos: `CHARACTER_VISUAL_BIBLE.md`, `ASSET_MANIFEST.md`, `README.md`. Atualizados: ARCHITECTURE, PUZZLES, WORLD_MAP, LORE_BIBLE, CHARACTERS, TIMELINE, ROADMAP, ART_DIRECTION.
## 0.1.0 — bootstrap
- Documentação base (LORE, TIMELINE, CHARACTERS, WORLD_MAP, PUZZLES, ART, ARCHITECTURE, GAME_DESIGN, ROADMAP).
- Decisões de canon [D] registradas no LORE_BIBLE (Orrin/Witness; Julian como pista falsa; pagador = Eleanor/Ashcroft Trust).
- Prazo: 22/10–28/10/1998.
