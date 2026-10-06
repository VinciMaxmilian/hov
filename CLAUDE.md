# The House of Vale — instruções para o Claude Code

Projeto: jogo web 3D de mistério em 1ª pessoa. **Fonte de verdade do pedido: `plan.md`.** Canon e design: `docs/`.

## Ordem de leitura
1. `plan.md` (visão completa, fases §47, qualidade §48)
2. `docs/LORE_BIBLE.md` (canon; marcações [CORE] imutáveis, [DECISÃO] revisáveis)
3. `docs/ARCHITECTURE.md`, `docs/GAME_DESIGN.md`, `docs/WORLD_MAP.md` (coordenadas canônicas do vertical slice), `docs/PUZZLES.md`

## Regras
- Implemente SOMENTE o bootstrap + sistemas do primeiro vertical slice (plan.md §35 e §46). Fases em `docs/ROADMAP.md`.
- Engine separada do conteúdo: conteúdo narrativo em JSON validado por zod (`frontend/src/content/`), nunca hardcoded em componentes.
- Estado de jogo único e serializável (zustand), event bus tipado, DSL de condições/ações compartilhada por interações/puzzles/portas.
- Gameplay 100% local; backend só persiste/autentica/valida.
- **Segredos:** `plan.md` contém chaves do Supabase. NÃO copie para código, docs ou commits. Use `.env` (ignorado) + `.env.example`; frontend só com URL e publishable/anon key; `service_role`/secret só em env do backend. Não commitar `plan.md`.
- Decisões pendentes que o usuário precisa tomar: `docs/GAME_DESIGN.md §11` (D-1, D-2, D-3). Não comprometa o código com uma alternativa além do padrão A.
- Documente mudanças de canon em `docs/CHANGELOG.md`.
- Os assets visuais (retratos, fotos, jornais, símbolos, texturas) serão gerados depois via Higgsfield, em outra conversa: deixe pontos de troca (campos `image`/`model` nos JSON) e use placeholders procedurais.
