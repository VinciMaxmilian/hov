# ARCHITECTURE

Objetivo: uma pequena **engine especializada** (sistemas) separada do **conteúdo** (JSON). Adicionar sala/documento/puzzle = dados, não código.

## 1. Visão geral
```
 content/ (JSON)  --zod-->  ContentRegistry  --->  Systems (puzzle, interaction, inventory, journal)
                                                       |  emit/subscribe
                                                  EventBus  <---->  gameStore (zustand, serializável)
                                                       |                    |
                                          R3F World (areas, procedural)   SaveManager (local IndexedDB ⇄ Supabase)
```
- **Gameplay 100% local.** Backend só persiste/autentica/sincroniza.
- **gameStore** é a única fonte de verdade do estado de jogo (serializável). Objetos Three não guardam estado: derivam do store.
- **EventBus** tipado: sistemas reagem sem se importar.

## 2. Stack
Vite + React + TypeScript strict · three · @react-three/fiber · drei · @react-three/rapier · zustand · zod · idb-keyval · @supabase/supabase-js · Backend FastAPI · Supabase (Postgres/Auth/Storage, RLS) · Netlify (front) / Render (back).

## 3. Estrutura de pastas
```
frontend/src/
  game/
    core/        eventBus, types, rng (seed), clock, ids
    content/     schemas (zod), registry/loader
    state/       gameStore, saveSchema (versão+migrations), selectors
    rules/       DSL de Conditions/Actions (avaliador + executor)
    interaction/ raycast, Interactable, executor de interações
    inventory/   itens, regras de combinação
    puzzles/     runtime de puzzles (inputs, estado)
    documents/   leitura/descoberta
    journal/     derivação do journal a partir de documentos/flags
    player/      Player FPS (rapier), lamparina
    world/       AreaRenderer, streaming, procedural/ (Wall, Door, Bookshelf, Clock, …)
    audio/       AudioManager (WebAudio)
    save/        local, cloud, sync
    lighting/    rigs
  ui/            HUD, Inventory/Journal, Inspection, DocumentReader, Menus, Auth
  content/       areas/ documents/ items/ puzzles/ interactables/ (JSON)
backend/app/     api, auth (JWT Supabase), saves, models, services
supabase/migrations/  SQL com RLS
docs/
```

## 4. Sistemas
- **EventBus**: `ITEM_PICKED, DOCUMENT_DISCOVERED, PUZZLE_SOLVED, PUZZLE_FAILED, AREA_ENTERED, DOOR_UNLOCKED, WORLD_STATE_CHANGED, STORY_FLAG_CHANGED, TIME_CHANGED, SOUND_REQUEST`.
- **Rules DSL** (conditions/actions) compartilhada por interactables, puzzles, portas, eventos.
- **Interaction**: raycast do centro da câmera (distância ≤ 2.6 m, camada própria). Cada interactable no JSON: `{id,label,interactionType,requiredItem?,state?,actions[]}`. Estado variante em `world[id]` (ex.: door: locked/unlocked/open).
- **Inventory**: categorias KEY_ITEMS, TOOLS, DOCUMENTS, PHOTOGRAPHS, NOTES, MAPS, RECORDINGS; item `{id,name,description,model,image,inspectable,combinable,usable,storyTags}`.
- **Inspection**: overlay com objeto/papel girável (frente/verso, zoom); detalhes escondidos (não marcados).
- **Journal**: derivado de documentos/flags: PEOPLE, FAMILIES, PLACES, EVENTS, DOCUMENTS, SYMBOLS, UNRESOLVED + grafo de conexões (nós "?" = desconhecidos).
- **Procedural**: componentes parametrizados com `seed` (mulberry32) → determinístico entre saves.
- **Streaming**: setores carregados por proximidade/progressão (vertical slice: 5 áreas, `AreaRenderer` monta vizinhas por portas).

## 5. Puzzles
`Puzzle { id, requirements, conditions, input, state, successActions, failureActions }`. Estado em `puzzles[id]`. Componente genérico `ClockPuzzle` lê `input.type="clock"`. Ver PUZZLES.md.

## 6. Save
Schema versionado (`schemaVersion`), migrations por versão. Conteúdo: `{schemaVersion, meta:{slot,playtimeSec,areaLabel,progressPct,updatedAt}, player:{area,position,yaw}, inventory[], world{}, puzzles{}, documents[], flags{}, journal{}, settings{}}`.
- **Local**: IndexedDB (idb-keyval), autosave em eventos-chave + intervalo. Sempre funciona offline.
- **Cloud**: tabela `game_saves` (jsonb) com RLS `auth.uid() = user_id`; **user_id nunca vem do cliente** (default `auth.uid()` + policy `with check`). Sync: last-write-wins por `updated_at` com revisão (`rev`) para detectar conflito; conflito → escolher.
- Rede intermitente: fila de sync com retry exponencial; UI não bloqueia.

## 7. Backend (FastAPI)
Esqueleto: `/health`, `/me` (valida JWT Supabase), `/saves/validate` (validação de schema/anti-corrupção), `/events` (analytics opcional). **Decisão**: o cliente fala direto com Supabase (RLS) para save/load; o FastAPI cobre validações e analytics, evitando latência e acoplamento. Nenhuma `service_role` no frontend; no backend só via env.

## 8. Segurança
- `.env` ignorado; `.env.example` no repo. **Nenhum secret no código.** Frontend usa só URL + publishable/anon key.
- RLS deny-by-default em todas as tabelas; policies por operação.
- Validação com zod no carregamento de conteúdo e de saves.

## 9. Performance
Instancing para livros/repetições, poucas luzes com sombra, texturas canvas cacheadas, code splitting (UI/menu vs. jogo), lazy de áreas. Metas: 60 fps desktop médio, draw calls < 300 por área.

## 10. Decisões registradas
| # | Decisão | Motivo |
|---|---|---|
| A1 | Conteúdo em JSON validado por zod | data-driven, falha cedo |
| A2 | Estado único em zustand, serializável | save simples, sem estado em objetos Three |
| A3 | Cliente→Supabase direto sob RLS | sem latência/backend para gameplay |
| A4 | Rapier com capsule kinematic + sensores | colisão estável e barata |
| A5 | WebAudio procedural no slice | sem assets ainda; troca futura por samples |
| A6 | Texturas procedurais em canvas | zero assets externos no slice |
