# WORLD MAP — Vale Manor

Princípio: PROFUNDIDADE FÍSICA = PROFUNDIDADE HISTÓRICA. Unidades em metros. Y = vertical. +z = sul (fachada/entrada), −z = norte.
**A geometria é a propriedade procedural do Claude Design** ("Vale Manor 3D Environment/vm2"), portada para `frontend/src/game/world/estate/`. A casa foi alinhada ao norte verdadeiro (no original girava 0,1 rad): coordenadas da planta = coordenadas do mundo = coordenadas do conteúdo JSON.
Valores canônicos: `estate/*.js` (geometria) e `src/content/areas/*.json` (áreas lógicas, objetos de jogo). Este documento resume.

## Prédios e cômodos
| Prédio (época) | Térreo | Andares | Subsolo |
|---|---|---|---|
| **Ala oeste — a casa de pedra (1874)** x −31,3…−12,7 · z −6,3…6,3 · piso 0,5 | Old hall (salão antigo, lareira-falsa), Estate office, Old morning room | 4,3: upper hall, Widow's bedroom (Margaret), Founder's study (Elias, cofre), West bedroom · sótão 8,2 · torre NW 10,6 | Old cellar −2,4 (poço antigo em (−22, 2)) |
| **O vão ("the seam")** x −12…−10,5 · z −4,6…4,6 | piso 0,5; degraus até a porta da biblioteca (1,0) | 4,3 / 5,6 (escada interna) | poço do contrapeso atrás do fundo falso (z 3,8…4,6) |
| **Salão central (1911)** x −10…10 · z −8,5…7,5 (+ vestíbulo até 10) · piso 1,0 | Entrance hall (pé-direito até 14,2), Arthur's study (antiga drawing room), West Library (pé-direito duplo, mezanino 5,6, escada espiral), Garden hall, Back stair, Cloakroom, Washroom | 5,6: gallery, master bedroom, sitting room, passage, master bath · 10,0: nursery, governess, guest, top bath · sótão 14,5 | −2,6: cellar corridor, wine, boiler, archive, coal; passagem antiga para a adega oeste (grade de ferro em x −10,25, z 0) |
| **Ala leste (1926)** x 10,5…28,7 · z −5,7…5,7 · piso 1,0 | Dining room (jantar de 1936 posto), Garden room, torre (escada espiral), cozinha/copa/despensa (x 18,4…27,6, z −17,6…−6) | 5,0: Beatrice's room, guest, bath, landing · 12,6: **Turret room** (a janela acesa) | — |
| **Observatório (1911)** centro (11,5, −25) · piso 1,0 / 5,0 | sala de instrumentos | piso de observação, luneta no meridiano | — |
| Galeria do observatório | corredor envidraçado de (7,6, −9) a (11,5, −22) | | |
| Cocheira/garagem | centro (72, 2); carros de 1934 (Edmund), 1957, 1966; perua de 1988 (Arthur) fora, em (86,6, 17,4) | sótão de feno | fosso de inspeção (decorativo) |
| Estufa vitoriana | centro (−76, −6); portas sul (vestíbulo) e norte (serviço, x local 2,6) | | — |
| Chalé do jardineiro | centro (−102, 16), girado 0,4 rad; depósito de ferramentas (martelo) | sótão | — |
| Cemitério da família | centro (11,5, −152), **no meridiano**; mausoléu visitável (porta em z −154,55) | | grade da cripta (decorativa) |
| Portão | fim da alameda, (−42, 214): saída bloqueada (o testamento pede 7 dias) | | |

## O subterrâneo (Atos VI–VII) — `estate/underground.js`
```
 adega oeste (−2,4) ── poço (−22, 2) ── desce por teleporte ──▶ fundo do poço (−10,4)
                                                               │  túnel de Elias, 1849 (x −22,7…−21,3; z 0,3 → −9,5)
                                                               ▼
                                           antecâmara "Room 14" (x −24…−20, z −10…−14): 8 nichos de lamparina
                                                               │  porta de pedra (desce no piso)
                                                               ▼
                         CÂMARA DO MERIDIANO — centro (−22, −10,4, −20), r 5, cúpula; gravura: círculo, linha N–S, 8 pontos
                         7 púlpitos com livros (r 3,9) · nicho norte com o Witness Ledger · gnômon no centro
                         escada de 1936 sobe a leste até uma porta de pedra sem puxador (o caminho pelo vão)
```

## Planta real × planta conhecida (coerência espacial)
- **O vão de 1,5 m** entre a ala de 1874 e o salão de 1911 não aparece em nenhuma planta: é o "Room measurements don't match the exterior wall" do relatório de 1936 e a cavidade onde batem as "batidas" (o contrapeso). A parede externa da ala velha continua virada para dentro, com o símbolo de 8 pontos.
- **Lareira gigante do salão antigo** nunca foi acesa: cano limpo acima de um braço de altura (chaminé falsa do original).
- **A linha (meridiano)**: pedra sob a ala oeste → observatório → relógio de sol (11,5, −39) → lajes a cada 5,5 m até z −82 → trilha → mausoléu (11,5, −156). Todas na mesma longitude x = 11,5 (a pedra fica sob a ala oeste: a linha é a referência, não a posição).
- Escada do observatório "aponta" para o piso do Meridiano; luneta configurada para olhar **para baixo** da linha.
- "Room 14" da planta de 1936 = a antecâmara do subsolo.

## Áreas lógicas (streaming, rótulo, ambiência)
| Área (id) | Limites x / y / z | Observação |
|---|---|---|
| exterior | −240…240 / −3…60 / −240…240 | terreno inteiro; cerca invisível em r = 232 |
| cemetery · vale_vault | ver JSON | jazigo; interior do mausoléu |
| entrance_hall | −3…10,1 / 0,5…5,5 / −8,6…10,4 | hall, garden hall, back stair, cloak |
| arthur_study | −10,1…−3 / 0,5…5,5 / 1…7,6 | |
| library | −10,1…−3 / 0,5…9,8 / −8,6…1 | inclui o mezanino |
| the_seam | −12,1…−10,4 / 0,3…13 / −4,8…4,8 | |
| west_wing | −33,4…−12,4 / 0,4…15 / −9,4…9,6 | |
| upper_floors | −10,1…10,1 / 5,5…23 / −8,6…10,4 | |
| east_wing | 10,3…31,6 / 0,5…17 / −18…8,6 | inclui torre e cozinha |
| cellars · west_cellar | ver JSON | porões |
| observatory · garage · greenhouse · cottage | ver JSON | |
| below · meridian_chamber | ver JSON | subsolo profundo (luz ambiente 0) |
Área atual = a de menor volume que contém o jogador.

## Correções sobre o ambiente original (pedidas na revisão)
1. Terreno recortado sob a mansão (antes um disco em y = 0 atravessava os porões e prendia o jogador na escada do porão).
2. Estufa: portas reais (sul e norte) — vidraça, caixilhos, canos e colisor invisível não fecham mais os vãos.
3. Biblioteca: estante leste encurtada (não encosta na porta do hall); a passagem oeste fica atrás da estante giratória.
4. Observatório: sem pisos automáticos sobrepostos; vão da escada espiral ampliado (o piso batia na cabeça antes de chegar ao topo). Mesmo ajuste na torre.
5. Alçapão externo da adega oeste: elemento decorativo, trancado por baixo (tem colisor e mensagem).
6. Caminhos: a trilha do chalé termina na varanda do chalé; a trilha dos criados começa nos degraus da copa e termina na porta norte da estufa.
7. Movimento: colisão com a cápsula + KinematicCharacterController do Rapier contra trimesh das paredes/pisos (antes três raios horizontais). Folhas de porta decorativas agora colidem e abrem quase rentes à parede; portas de gameplay são corpos cinemáticos do jogo; vidros de janela colidem.
