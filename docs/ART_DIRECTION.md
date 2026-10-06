# ART DIRECTION

## Estilo
Vitoriana/gótica estilizada, Pacific Northwest, **iluminação forte**, formas simples, texturas estilizadas (não fotorrealista). Referência de atmosfera: Blue Prince (sem copiar nada específico).

## Paleta
| Uso | Cor |
|---|---|
| Luar / ambiente frio | #1b2a41, #2e4a62, #3d5a6c, #0b1118 |
| Azul-esverdeado profundo | #1f3d3a, #274c4a |
| Madeira escura | #2b1d14, #3a281b |
| Pedra | #5b6068, #3b3f45 |
| Latão | #b08d57 |
| Papel envelhecido | #d9c9a3 |
| Luz humana (lamparina/lareira) | âmbar #ffb45e, laranja #ff8a3d |

Regra: **fria = mundo, quente = presença humana**. Escuridão deve ter forma (silhuetas legíveis), não esconder falta de detalhe.

## Iluminação
- Poucas luzes dinâmicas (máx. 4 simultâneas com sombra: lamparina + 1–2 fixas).
- Hemisphere/ambient fria baixa; point lights quentes com falloff curto.
- Exterior: fog azul-cinza, chuva (partículas), céu azul profundo.
- Luz rasante revela relevos (fotografias, rasuras).

## Materiais procedurais
Texturas geradas em canvas (ruído, madeira, papel, pedra) com seed; cache por tipo. Troca futura por KTX2.

## Áudio (conceitual)
Chuva (abafa ao entrar), vento, madeira rangendo, relógio distante, tubulações, água, passos por material. Silêncio como ferramenta. Eventos fora de campo sem origem confirmada. Implementação inicial: WebAudio procedural; amostras reais depois.

## Prompts para IA generativa (Higgsfield)
Manter `CHARACTER_VISUAL_BIBLE.md` quando houver retratos. Estilo-base: "1880s/1930s formal photograph, sepia, studio lighting, Pacific Northwest family, wet-plate texture, subtle damage". Cada prompt inclui: época, roupa, idade, iluminação, formato, nome de arquivo alvo, seed/consistência. Nenhuma geração foi feita ainda.
