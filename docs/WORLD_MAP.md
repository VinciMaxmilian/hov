# WORLD MAP — Vale Manor

Princípio: PROFUNDIDADE FÍSICA = PROFUNDIDADE HISTÓRICA. Unidades em metros. Y = vertical. Origem (0,0,0) = centro do Entrance Hall, nível do piso.

## Setores (streaming)
| Setor | Conteúdo | Época dominante |
|---|---|---|
| EXTERIOR | caminho, portão, fachada, floresta | 1998 |
| MAIN_HALL | Entrance, Grand Staircase, Gallery | 1911 |
| WEST_WING | Library, Study (Arthur), Archive, Secret Rooms | 1861–1936 |
| EAST_WING | Bedrooms, Music Room, Conservatory | 1891–1911 |
| UPPER | quartos, observatório | 1911 |
| BASEMENT | cozinha antiga, adegas | 1866 |
| UNDERGROUND | Crypt, Old Foundation, Meridian Chambers | 1849 / pré-1847 |

## Planta real × planta conhecida (coerência espacial)
- **Planta oficial (1911)**: parede entre Study e Library = 0.4 m. **Real**: 1.6 m (cavidade 1.2 m = Secret Passage 01).
- Escada do observatório "termina na parede": aponta para o piso do Meridiano abaixo (alinhamento).
- Planta de 1936 mostra "Room 14" na ala oeste que não existe no exterior (janela interior). É a **Meridian Antechamber**.
- Janela no Study "dá para" o interior da Library (janela falsa, Arthur 1985).

## Vertical slice — 5 áreas (coordenadas canônicas, metros; +z = sul/entrada)
```
 z=-13  +---------------------+
        |      LIBRARY        |  x[-14,-6.2] z[-13,-5]
 z=-5   +--[estante-passagem]--+   <- parede sul da Library (laje z -5…-4.8)
        ~~ cavidade 1.2 m ~~      <- SECRET PASSAGE 01 (x[-20,-8.4], z[-4.8,-3.6])
 z=-3.4 +---------------------+   (laje do Study z -3.6…-3.4)
        |   ARTHUR'S STUDY    |  x[-14,-6.2] z[-3.4,5]
 z= 5   +---------------------+
              |porta Study (x=-6,z=1)  |porta Library (x=-6,z=-8)
 z=-10  +-----+---------------+
        |   ENTRANCE HALL     |  x[-6,6] z[-10,7]
 z= 7   +----------[porta principal]---+
        EXTERIOR: caminho z[+8,+60], portão z=+60, fachada em z=+7
```
- Planta oficial (1911): parede Study/Library = 0.4 m. Real: 1.6 m (0.2 + cavidade 1.2 + 0.2; cavidade z -4.8…-3.6) — o "erro" planejado.
- Passagem: abre pela estante-porta **deslizante** (abertura x -11.2…-8.8, a estante corre 2,6 m para oeste) na Library; corre para oeste até x=-20 (símbolo de 8 pontos, fim do slice).
- **Descida**: de x=-14.2 a x=-16.6 uma rampa leva o piso de y=0 a y=-0.8 (teto continua em 2,4). Abaixo do nível do Hall = mais antigo.
- Valores canônicos: `frontend/src/content/areas/*.json` (este documento resume; o JSON manda).

### Volume da ala oeste e o poço de luz [DECISÃO]
- Por fora, a ala oeste vai de x=-21 a x=-6.1 (fachada em z=5.3, fundos em z=-14). Os cômodos conhecidos ocupam só x ≥ -14.2.
- Entre x≈-21 e -14.2 existe um **poço de luz** (pátio estreito aberto ao céu, sem acesso no slice). As janelas oeste do Study e da Library dão para ele — por isso entra luar "de cima", e por isso de dentro só se vê escuridão.
- A passagem secreta corre **por baixo** do poço (daí a descida). Explica as "janelas que não dão para fora" sem erro de modelagem.

### Áreas do slice (streaming)
| Área (id) | Limites x / y / z | Vizinhas montadas |
|---|---|---|
| exterior | -80…80 / -5…40 / -60…80 | entrance_hall |
| entrance_hall | -6…6 / -0.6…8 / -10…7.3 | exterior, arthur_study, library |
| arthur_study | -14…-6.1 / -0.6…4 / -3.4…5 | entrance_hall, secret_passage |
| library | -14…-6.1 / -0.6…5 / -13…-5 | entrance_hall, secret_passage, arthur_study |
| secret_passage | -20…-8.4 / -1.5…3 / -4.8…-3.6 | library, arthur_study |
Área atual = a de menor volume que contém o jogador. Exterior: chão em y=-0.5; varanda e casa em y=0 (degraus de 0,17 m).

## Fluxo de profundidade (resumo)
Upper (1998/1911) → Main (1911) → West (1861–1936) → Basement (1866) → Foundation (1849) → Below (anterior).
