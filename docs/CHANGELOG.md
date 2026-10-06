# CHANGELOG

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
