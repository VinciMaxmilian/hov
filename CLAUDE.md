# The House of Vale — instruções para o Claude Code

Projeto: jogo web 3D de mistério em 1ª pessoa. **Fonte de verdade do pedido: `plan.md`.** Canon e design: `docs/`. Como rodar: `README.md`.

## Ordem de leitura
1. `plan.md` (visão completa, fases §47, qualidade §48)
2. `docs/LORE_BIBLE.md` (canon; [CORE] imutável, [DECISÃO] revisável — §2.7 tem as decisões do slice)
3. `docs/ARCHITECTURE.md` (código real), `docs/WORLD_MAP.md` (coordenadas), `docs/PUZZLES.md`
4. Arte: `docs/ASSET_MANIFEST.md` + `docs/CHARACTER_VISUAL_BIBLE.md`

## Estado
Vertical slice implementado e jogável (v0.2). Próximos passos em `docs/ROADMAP.md`.

## Regras
- Engine separada do conteúdo: narrativa/itens/puzzles/áreas em JSON (`frontend/src/content/`), validados por zod no boot. Nunca hardcode texto narrativo em componentes.
- Estado de jogo único e serializável (zustand); event bus tipado; DSL de condições/ações compartilhada (`game/rules`). Novo comportamento genérico → nova ação/condição na DSL, não código ad hoc.
- Gameplay 100% local; backend só persiste/autentica/valida.
- Ao mudar o formato do save: `SAVE_SCHEMA_VERSION` + migration + teste; espelhar em `backend/app/models/save.py`.
- Antes de concluir: `npm run typecheck && npm run lint && npm test` (frontend) e `pytest` (backend). O walkthrough test deve continuar passando — se mudar a cadeia do slice, atualize-o.
- Verificação visual: `npm run dev` + `/?dev&shot&area=<id>&lamp=1` (ver README) com Chrome headless.
- **Segredos:** `plan.md` contém chaves do Supabase. NÃO copie para código, docs ou commits. Frontend e backend usam só URL + chave publicável (`.env`, ignorado). Não commitar `plan.md`.
- Decisões pendentes do usuário: `docs/GAME_DESIGN.md §11` (D-1, D-2, D-3). Não comprometa o código além do padrão A.
- Mudanças de canon → `docs/CHANGELOG.md` e `LORE_BIBLE`.
- Assets visuais/sonoros são gerados via Higgsfield em outra conversa (Claude Desktop): caminhos em `frontend/public/media/` listados no `ASSET_MANIFEST.md`; o jogo usa placeholder procedural enquanto o arquivo não existir.
