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
- Unidades físicas (three r170): spots de luar interiores 45–60, ambiente 0,2–0,35, lamparina 16 (atenuada a 35% em close-ups), abajur 16. Ajustar nos JSON de área.
- Poucas luzes dinâmicas: 1 spot com sombra por sala + lua direcional com sombra no exterior; lamparina sem sombra.
- Hemisphere/ambient fria baixa; point lights quentes com falloff curto.
- Exterior: fog azul-cinza, chuva (partículas), céu azul profundo.
- Luz rasante revela relevos (fotografias, rasuras).

## Materiais procedurais
Texturas geradas em canvas (ruído, madeira, papel, pedra) com seed; cache por tipo. Troca futura por KTX2.

## Áudio (conceitual)
Chuva (abafa ao entrar), vento, madeira rangendo, relógio distante, tubulações, água, passos por material. Silêncio como ferramenta. Eventos fora de campo sem origem confirmada. Implementação inicial: WebAudio procedural; amostras reais depois.

## Prompts para IA generativa (Higgsfield)
- Lista do que gerar, com caminhos exatos e prompts prontos: **`ASSET_MANIFEST.md`**.
- Rostos, roupas e composições fixas: **`CHARACTER_VISUAL_BIBLE.md`** (tokens de estilo por época).
- Imagens nunca contêm texto legível (manchetes/legendas são HTML no jogo).
- Integração: salvar em `frontend/public/media/...`; o jogo troca o placeholder automaticamente.
