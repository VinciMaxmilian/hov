# ROADMAP

Fases do plano (§47). Estado em 2026-10-06: **vertical slice jogável de ponta a ponta** com placeholders procedurais; arte/áudio gerados pendentes (ver `ASSET_MANIFEST.md`).

| Fase | Item | Estado | Notas |
|---|---|---|---|
| 1 | Bootstrap | ✅ | Vite/React/TS strict, ESLint, Vitest, estrutura engine × conteúdo |
| 2 | R3F + cena | ✅ | Canvas, ACES, sombras, neblina por área |
| 3 | Player FPS | ✅ | WASD/mouse/Shift, pointer lock, head-bob, passos por superfície |
| 4 | Colisões | ✅ | Rapier KCC (degraus, rampas, deslize); limites da propriedade |
| 5 | Interação | ✅ | raycast com oclusão, 7 tipos de interactable, prompt discreto |
| 6 | Arquitetura procedural | ✅ | Room com aberturas/lambri/caixilhos; ~40 props com seed |
| 7 | Portas | ✅ | dobradiça cinemática, trancas por item, consumo de item |
| 8 | Itens | ✅ | 5 itens do slice, modelos procedurais reutilizados na inspeção |
| 9 | Inventário | ✅ | aba Belongings (itens + documentos por categoria) |
| 10 | Inspection mode | ✅ | documentos (frente/verso, zoom, inclinação, transcrição, detalhes) e itens 3D |
| 11 | Documentos | ✅ | 8 documentos (DOC01, 04, 05, 06, 07, 08 + cartão + nota) |
| 12 | Puzzle framework | ✅ | DSL + relógio de pé (close-up, tentativa/erro) |
| 13 | Event system | ✅ | bus tipado + story director declarativo |
| 14 | World state | ✅ | store único serializável |
| 15 | Save local | ✅ | IndexedDB, 3 slots, autosave por evento/intervalo |
| 16 | Supabase Auth | ✅ | email/senha + Google (precisa habilitar o provider no painel) |
| 17 | Cloud save | ✅ | CAS por `rev`, fila offline, resolução de conflito na UI; migration aplicada |
| 18 | Áudio | ✅ (procedural) | aguardando samples (ASSET_MANIFEST §11–16) |
| 19 | Iluminação | ✅ (1ª passada) | precisa de ajuste fino em hardware real |
| 20 | Vertical slice completo | 🟡 | jogável; falta playtest humano + assets gerados |

## Próximos passos (ordem sugerida)
1. **Playtest** em hardware real (sensibilidade, escala, brilho, tempo total 10–20 min). Ajustar intensidades nos JSON de área.
2. **Assets Higgsfield** (ASSET_MANIFEST): retratos, foto da Sociedade, jornal, DOC08, fita de Arthur, efeitos. Integrar = salvar arquivo.
3. ~~Decisões de canon D-1/D-2/D-3~~ ✅ tomadas (GAME_DESIGN §11). Próximo: sistema de finais por nível de descoberta (avaliar as revelações da matriz LORE §5) e gatilho da meia-noite do 7º dia.
4. Auth: habilitar Google OAuth no painel Supabase (Authentication → Providers) e configurar Site URL/Redirect URLs para o domínio Netlify.
5. Deploy: Netlify (base `frontend`) e Render (`render.yaml`); definir `VITE_API_URL` se quiser saves via backend.
6. Ato II: Gallery, Grand Staircase superior, quartos da ala leste; puzzle do retrato de Margaret (já no catálogo).
7. Engine: materiais com textura em arquivo (KTX2/WebP), `React.lazy` por área. ~~LOD da floresta~~ ✅ (blocos espaciais de 48 m, frustum culling + visibilidade por distância em `EstateView`); ~~configurações gráficas (qualidade de sombra, dpr)~~ ✅ (`graphicsQuality` em Settings).
8. Acessibilidade: remapeamento de teclas. ~~Tamanho de legenda~~ ✅, ~~opção de reduzir head-bob~~ ✅ (Settings).
