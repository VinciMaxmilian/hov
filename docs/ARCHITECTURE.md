# ARCHITECTURE

Objetivo: uma pequena **engine especializada** (sistemas) separada do **conteúdo** (JSON). Adicionar sala/documento/puzzle = dados, não código.
Estado: implementado para o vertical slice (v0.2). Este documento descreve o código real.

## 1. Visão geral
```
 src/content/**/*.json ──zod──▶ ContentRegistry (valida + confere referências cruzadas no boot)
                                        │
          ┌─────────────────────────────┼───────────────────────────────┐
          ▼                             ▼                               ▼
  Rules DSL (evaluate/runActions)   World (R3F)                   UI (React DOM)
  interact · puzzles · story ·      AreaRenderer → Room + props   HUD · Journal/Board ·
  journal · progress                Player (Rapier KCC) · Lamp    Inspect · Puzzle · Menus
          │                             │                               │
          └──────────────▶  gameStore (zustand, serializável)  ◀────────┘
                                   │  todo mutador emite ▶ EventBus (tipado)
                                   ▼
                     SaveManager: IndexedDB (sempre) ⇄ Supabase (fila + retry, CAS por rev)
```
- **Gameplay 100% local.** Nenhuma ação de jogo espera rede.
- **gameStore** é a única fonte de verdade serializável. Objetos 3D só *leem* estado (porta aberta, estante deslizada, ponteiros do relógio).
- A posição contínua do jogador fica fora do React (`player/playerRuntime.ts`) para não re-renderizar por frame; o save copia de lá.

## 2. Stack
Vite 5 · React 18 · TypeScript strict · three r170 · @react-three/fiber 8 · drei 9 · @react-three/rapier 1.5 · zustand 5 · zod 3 · idb-keyval · @supabase/supabase-js 2 · Vitest · ESLint 9.
Backend: Python 3.11 · FastAPI · httpx · PyJWT · pytest. Banco/Auth: Supabase (Postgres 17, RLS). Deploy: Netlify (front), Render (back).

## 3. Estrutura de pastas (real)
```
frontend/src/
  main.tsx                  boot: valida conteúdo, instala sistemas, monta UI (erro de conteúdo = tela de erro)
  game/
    core/        eventBus, rng (mulberry32/FNV), scheduler (timers pausáveis), GameLoop, types
    content/     schemas.ts (contrato zod), registry.ts (carga + cross-check), index.ts (import.meta.glob)
    rules/       evaluate.ts (condições, pura), execute.ts (ações), effects.ts (efeitos reais)
    state/       gameStore, uiStore, settingsStore, saveSchema (versão + migrations), newGame
    interaction/ targets (registro de raycast), InteractionProbe, interact (comportamentos por tipo)
    puzzles/     puzzleSystem (open/adjust/attempt/close)
    documents/   recordings (fitas: áudio real ou chiado + legendas)
    journal/     journalSystem (destrava entradas por condição; view do quadro)
    story/       storyDirector (gatilhos declarativos sobre o bus)
    player/      Player (KCC Rapier), Lamp (rig 3D), lampControl, input (teclado/mouse/pointer lock), playerRuntime
    world/       AreaRenderer, Room (paredes com aberturas), areas (área atual/streaming), textures, materials, geometry
      props/     biblioteca procedural (basic, furniture, clocks, movers, decor, smallItems, exterior) + registro
    audio/       audioManager (WebAudio, HRTF, abafamento), synths (patches procedurais)
    save/        localSaves (IndexedDB), cloudSaves (Supabase/back), saveManager (autosave, sync, conflitos)
    auth/        supabase (cliente público), authStore
    session.ts   novo jogo / carregar / título; hooks de autosave e analytics
    controls.ts  teclas → ações por modo de UI
    devStart.ts  atalho de desenvolvimento (?dev), só em DEV
    GameCanvas.tsx  Canvas + Physics + áreas montadas + Player + Lamp + Probe + Loop
  ui/            App, hud/, journal/ (JournalScreen, Board), inspect/ (DocumentView, ItemView), puzzle/, menus/, styles.css
  content/       areas/ items/ documents/ interactables/ puzzles/ journal/ story/ audio/  (JSON)
frontend/public/media/   assets gerados (ver ASSET_MANIFEST.md)
backend/app/     main, config, auth/deps (JWT), models/save (espelho do schema), saves/router, api/routes, services/supabase_rest
supabase/migrations/     SQL versionado (RLS)
docs/
```

## 4. Conteúdo (data-driven)
| Pasta | Um arquivo = | Exemplo |
|---|---|---|
| `areas/` | uma área (salas, luzes, objetos, ambiência, vizinhas, limites) | `library.json` |
| `interactables/` | lista por área | `arthur_study.json` |
| `items/` | um item | `study_key.json` |
| `documents/` | um documento (páginas frente/verso, detalhes, áudio) | `doc_meridian_photo.json` |
| `puzzles/` | um puzzle | `library_clock.json` |
| `journal/journal.json` | entradas + quadro (nós/arestas) | |
| `story/story.json` | início, gatilhos narrativos, marcos de progresso | |
| `audio/sounds.json` | catálogo de sons (patch + sample opcional) | |

O registry falha o boot com mensagens tipo `interactable porch_key: item "x" não existe`. `npm test` roda a mesma validação.

### 4.1 Objetos de área → props procedurais
`{ "type": "Bookshelf", "position": [...], "rotation": [graus], "seed": 101, "params": {...}, "interactable": "id", "visibleWhen": {...} }`
- `type` resolve em `world/props/index.ts` (`propRegistry`): componente + política de colisão (`auto` = cuboides das malhas, `none` = o prop cuida).
- Seed determinística (`seed` explícita ou hash de `área:id`) → mesma estante, mesmos livros em qualquer save.
- Objeto com `interactable` some quando `world[id] === "taken"`. `params.hit = [x,y,z]` cria uma hit-box invisível (mira justa sem destacar o objeto).

### 4.2 Salas (`Room`)
`min/max` são os limites **internos**; paredes crescem para fora com espessura por lado. Aberturas por lado (`door|window|arch|passage`, `center` em coordenada de mundo). `outer` define material externo (fachadas, faces dentro de cavidades). Janelas ganham vidro, caixilho e colisor.

## 5. Rules DSL (compartilhada)
**Condições:** `flag` (truthy ou `equals`), `hasItem`, `world`, `document`, `puzzleSolved`, `puzzleValue`, `area`, `journal`, `all`, `any`, `not`.
**Ações:** `setFlag`, `setWorld`, `giveItem`, `removeItem`, `discoverDocument(open?)`, `inspectItem`, `openDocument`, `playSound(position?)`, `playRecording`, `message`, `hint`, `openPuzzle`, `solvePuzzle`, `closePuzzle`, `unlockJournal`, `delay(ms, actions)`, `if(condition, then, else)`, `save`, `endSlice`.
Usada por interactables, puzzles, páginas de documento (`onView`), detalhes (`onFound`), gatilhos narrativos, journal e progresso. `evaluate` é pura (testada isoladamente); `runActions` recebe um objeto de efeitos (real em `effects.ts`, falso nos testes).

## 6. Sistemas
- **EventBus** (`core/eventBus.ts`): `GAME_STARTED, ITEM_PICKED, ITEM_REMOVED, ITEM_USED, DOCUMENT_DISCOVERED, DOCUMENT_VIEWED, PUZZLE_SOLVED, PUZZLE_FAILED, AREA_ENTERED, DOOR_UNLOCKED, WORLD_STATE_CHANGED, STORY_FLAG_CHANGED, TIME_CHANGED, INTERACTED, JOURNAL_UPDATED, SOUND_REQUEST, SLICE_COMPLETE`. Handlers isolados (erro num não derruba os outros); proteção contra cascata infinita.
- **Interaction**: raycast do centro da câmera a cada 2 frames, alcance 2,6 m, contra interactables **e** oclusores (salas e móveis registram `null`), então não se interage através de paredes. Prompt `E — verbo — rótulo` sem destacar o objeto.
- **Tipos de interactable** (`interact.ts`): `door` (locked/closed/open, `requiredItem`, `consumeItem`), `pickup` (`item` e/ou `document`), `container` (revistar uma vez), `toggle` (on/off), `puzzle`, `read`, `use`. `branches[{when,label,actions}]` sobrepõem o comportamento padrão; `actions` rodam depois dele.
- **Puzzles**: `input.type = "clock"` (horas 1–12, minutos com "vai-um"), `conditions`, `successActions`, `failureActions`. Close-up de câmera definido no interactable (`focus`). Novos tipos de input entram em `puzzleSystem` + `PuzzleOverlay`.
- **Inspection**: documentos em HTML/CSS 3D (frente/verso com F, inclinar arrastando, zoom na roda, transcrição com T, detalhes clicáveis não destacados); itens em mini-Canvas 3D com OrbitControls usando os mesmos modelos procedurais do mundo (`item.model = "proc:key"`).
- **Journal**: entradas destravam por condição; categorias PEOPLE/FAMILIES/PLACES/EVENTS/DOCUMENTS/SYMBOLS/UNRESOLVED; UNRESOLVED pode ficar "com pista" (`resolvedWhen`) sem revelar a resposta. Quadro SVG: nós com "?" até `revealWhen`, arestas tracejadas até `confirmedWhen`.
- **Story director**: `{on, match, conditions, once, actions}`; "once" persiste como flag `trigger:<id>`.
- **Streaming**: monta a área atual + `neighbors` (área atual = menor volume que contém o jogador). Preparado para `React.lazy` por área quando houver GLB/texturas pesadas.
- **Tempo**: relógio diegético (dia 1 = qui 22/10/1998, 18:40), 1 min de jogo a cada 6 s, só corre fora de pausa/menus. Timers de gameplay (`scheduler`) pausam junto e são limpos ao carregar outro save.
- **Áudio**: WebAudio com ambiência (chuva/vento) abafada por área (`rainMuffle`), emissores espaciais HRTF (tique-taque, goteiras, corrente de ar), passos por superfície, trovões aleatórios. Cada som tem patch procedural; `src` opcional substitui por sample.
- **Iluminação**: luzes por área no JSON (`ambient/hemisphere/directional/spot/point`, `flicker`, `when`). Unidades físicas do three r170 (spots interiores ~45–60, lamparina ~16). Lamparina sem sombra; 1 spot com sombra por sala + lua direcional com sombra no exterior.

## 7. Save / Sync
- **Schema versionado** (`state/saveSchema.ts`, `SAVE_SCHEMA_VERSION = 1`): `{schemaVersion, meta{slot,areaLabel,progressPct,playtimeSec,updatedAt,contentVersion}, player{area,position,yaw,pitch}, inventory[], world{}, puzzles{id:{status,values,attempts}}, documents[], flags{}, journal[], clock{day,minutes}, playtimeSec, settings{}}`. `migrateSave` aplica `migrations[n]` em cadeia e valida com zod; saves de versão futura são recusados.
- **Local**: IndexedDB por slot (1–3) `{data, baseRev, dirty}`. Autosave em eventos-chave (debounce 1,2 s) + a cada 60 s + "Save now" no menu.
- **Nuvem**: função SQL `save_game(...)` faz **compare-and-swap** em `rev` (security invoker → RLS vale). `baseRev` = última revisão da nuvem conhecida pelo dispositivo. Conflito → menu Load oferece "este dispositivo", "nuvem" ou "manter este e enviar".
- **Rede intermitente**: fila por slot com backoff exponencial (2 s → 60 s), reenvio ao voltar `online` ou ao logar. A UI nunca bloqueia.

## 8. Backend (FastAPI) e banco
- Rotas: `GET /health`, `GET /me`, `POST /saves/validate`, `PUT /saves/{slot}` (valida com o espelho pydantic do schema e chama `save_game` **com o JWT do usuário**), `POST /events` (analytics).
- JWT: verificação local via JWKS (ES256/RS256) ou confirmação em `/auth/v1/user` (HS256 legado). `user_id` nunca vem do payload.
- O frontend usa o backend só se `VITE_API_URL` estiver definido; senão fala direto com o Supabase sob RLS (decisão A3).
- Tabelas (migration `20261006000001_init_schema.sql`, aplicada no projeto `houseofvale`): `profiles` (trigger no signup), `game_saves` (único por user+slot, jsonb ≤ 512 KB), `achievements`, `game_events` (insert-only). RLS deny-by-default com policies `to authenticated` usando `(select auth.uid())`. `game_state`/`discovered_documents` do plano foram **consolidados em `game_saves.data`** (um documento versionado evita joins e inconsistência entre tabelas).

## 9. Segurança
- Frontend só com URL + chave publicável. Backend também só usa a publicável (age como o usuário). Nenhum `service_role`/secret em código ou docs. `.env` ignorado; `.env.example` versionado.
- Validação: zod no boot (conteúdo) e no load (saves); pydantic no backend; checks de tamanho/tipo no SQL.

## 10. Performance
Livros e árvores instanciados (1 draw call por estante/floresta), geometrias e materiais cacheados por chave, texturas procedurais cacheadas, sombras limitadas, raycast a cada 2 frames, `dpr ≤ 1.5`, code splitting (título sem three; R3F/Rapier carregam ao entrar no jogo; visualizador 3D de itens sob demanda). O chunk do jogo (~2,2 MB, ~790 KB gzip) é dominado pelo WASM do Rapier.

## 11. Testes
- `npm test` (Vitest): conteúdo (schemas + referências + documentos canônicos), DSL de regras, schema/migrations de save e **walkthrough** que joga o slice inteiro pela engine (portão → passagem → fim).
- `backend`: `pytest` (validação de saves, auth obrigatória, CAS via RPC mockado).
- Visual: `?dev&shot&area=...` + Chrome headless (ver README).

## 12. Decisões registradas
| # | Decisão | Motivo |
|---|---|---|
| A1 | Conteúdo em JSON validado por zod, com cross-check de referências | data-driven, falha cedo e com mensagem clara |
| A2 | Estado único em zustand, serializável; posição contínua fora do React | save simples; sem re-render por frame |
| A3 | Cliente → Supabase direto sob RLS; backend opcional para validação | gameplay sem latência; backend sem privilégio extra |
| A4 | Rapier `KinematicCharacterController` + cápsula | degraus, rampas e deslizamento estáveis |
| A5 | WebAudio procedural com troca transparente por samples | jogo completo sem assets; Higgsfield depois |
| A6 | Texturas procedurais em canvas | zero assets externos no slice |
| A7 | Assets gerados em `public/media/` com fallback automático | integrar arte = salvar arquivo, sem tocar código |
| A8 | Concorrência de saves por CAS em `rev` (função SQL) | detecta conflito entre dispositivos sem lock |
| A9 | Saves consolidados em `game_saves.data` (jsonb versionado) | um documento por slot; migrations no cliente |
| A10 | Props com `selfTransform` + corpos cinemáticos para portas/estantes | o jogador é empurrado/bloqueado corretamente durante animações |
