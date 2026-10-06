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
- Passagem: abre pela estante-porta giratória (abertura x -11.2…-8.8) na Library; corre para oeste até x=-20 (símbolo de 8 pontos, fim do slice).
- Valores canônicos: `frontend/src/content/areas/*.json`.

## Fluxo de profundidade (resumo)
Upper (1998/1911) → Main (1911) → West (1861–1936) → Basement (1866) → Foundation (1849) → Below (anterior).
