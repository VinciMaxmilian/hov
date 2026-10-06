# ASSET MANIFEST — geração via Higgsfield

Lista do que o **vertical slice** usa e ainda é placeholder. Cada item tem: caminho exato, formato, proporção, prompt e notas.

**Como integrar:** salve o arquivo em `frontend/public/media/<caminho>` com o nome exato abaixo. O jogo detecta sozinho; se o arquivo faltar, continua usando o placeholder procedural. Nenhuma mudança de código/JSON é necessária.

**Formato:** imagens em **WebP** (qualidade ~82), áudio em **MP3** (128–192 kbps, mono para efeitos espaciais). Prefira gerar em PNG e converter.
**Consistência:** rostos e roupas seguem `CHARACTER_VISUAL_BIBLE.md`; paleta e luz seguem `ART_DIRECTION.md`. Nunca gerar texto legível dentro das imagens (o jogo escreve legendas/manchetes em HTML).
**Proibido:** qualquer coisa de Blue Prince (personagens, ambientes, identidade visual).

Status: ⬜ pendente · ✅ gerado e integrado

---

## Imagens

### 1. ⬜ `media/concept/title_vale_manor.webp` — fundo do título
- 1920×1080 (16:9). Usado com escurecimento por gradiente embaixo à esquerda (deixe a área inferior-esquerda calma, para o título).
- **Prompt:** `Stylized Victorian manor in the Pacific Northwest at night, seen from the end of a long gravel drive through a wrought-iron gate, heavy rain, low fog between tall Douglas firs, mountains as dark silhouettes, deep blue night sky with a pale moon behind thin clouds, the house asymmetrical: a tall central gabled hall, a long lower west wing with a stone chimney, a shorter east wing; all windows dark except ONE small warm amber window on the upper floor of the east wing; cold palette of navy, slate grey and teal-black, the single window is the only warm light; elegant simplified shapes, strong lighting, painterly but clean, cinematic wide shot, lots of negative space in the lower left`
- **Negativo:** `people, cars, modern lights, text, logo, bright colors, daylight, fantasy castle`

### 2. ⬜ `media/portraits/margaret_vale_1870.webp` — retrato no Hall
- 1000×1350 (≈3:4 retrato). Quadro de 1,0×1,35 m.
- **Prompt:** `[token 1860–1880 óleo] three-quarter portrait of Margaret Vale, a 54-year-old woman, narrow oval face, high forehead, thin lips, brown hair with grey strands parted in the middle and pulled into a low bun, dark brown eyes looking directly at the viewer, steel-rimmed spectacles hanging on a ribbon at her chest, very dark green silk dress with a high plain white lace collar, oval onyx brooch, she holds a quill pen the way one would hold a key, a closed ledger on her lap with one finger marking a page, seated, restrained expression, not smiling`
- **Notas:** é a única figura que encara o observador. Nada de joias além do broche.

### 3. ⬜ `media/portraits/elias_vale_1868.webp` — retrato no Hall
- 1000×1350 (≈3:4).
- **Prompt:** `[token 1860–1880 óleo] three-quarter seated portrait of Elias Vale, a 56-year-old surveyor and builder, angular face, high cheekbones, nose slightly crooked from an old break, short trimmed grey beard, dark grey hair combed back with a deep receding hairline, pale grey deep-set eyes with heavy lids looking slightly away to the viewer's right, large knotted hands with dirt under the fingernails, a brass surveyor's Gunter's chain coiled on his lap under his right hand, heavy black wool frock coat, high collar, plain black cravat, dark brown waistcoat, no jewelry, severe, not smiling`

### 4. ⬜ `media/paintings/bellweather_1880.webp` — pintura no Hall
- 1500×950 (≈16:10 paisagem).
- **Prompt:** `[token 1880 paisagem] view of the small timber town of Bellweather, Oregon in 1880 from a hillside: a sawmill by a river, a railway spur, a white wooden church with a bell tower, a cluster of clapboard houses, and along the far ridge exactly seven large houses each with a smoking chimney, Douglas fir forest, misty mountains, dusk, no people`
- **Notas:** "sete chaminés fumegando no cume" é pista. Conferir a contagem (7).

### 5. ⬜ `media/paintings/vale_manor_1911.webp` — sobre a lareira do Study
- 1200×800 (3:2).
- **Prompt:** `[token 1911 pintura arquitetônica] Vale Manor in 1911 seen from the front lawn in overcast daylight: tall central gabled entrance hall with a covered porch and four slim columns, long two-storey west wing with a stone chimney, shorter east wing with clapboard siding, newly finished copper-roofed observatory dome on the roof ridge, firs behind, a few workmen's ladders against the east wing, muted palette, no visible people faces`

### 6. ⬜ `media/photos/meridian_society_1936.webp` — DOC06 (pista principal do Study)
- 1600×1200 (4:3 paisagem). Aparece em moldura sobre a mesa e na inspeção.
- **Prompt:** `[token 1936 fotografia] formal group photograph of the Meridian Society, October 1936, in a dark wood-panelled room: seven high-backed chairs arranged in a shallow arc facing the camera, seven seated people in 1930s formal dress, left to right: (1) a tall austere clergyman, about 61, long face, short grey hair, thick eyebrows, black cassock with clerical collar, small Bible; (2) a very old man about 81, bony weathered face, long untidy white beard, old-fashioned 1900s suit, ash cane with iron knob between his knees; (3) a heavy-set judge about 56, broad ruddy face, grey sideburns, balding, pince-nez, black double-breasted suit, dark bow tie; (4) a tall thin man about 37, slicked dark hair with side part, thin moustache, tired eyes, dark grey three-piece suit, pocket-watch chain, hands folded on his knee — centre chair; (5) a slim clean-shaven man about 46, short light-brown hair, round tortoiseshell glasses, brown tweed suit; (6) a short round-faced man about 66, thick white walrus moustache, pinstripe suit, white carnation in lapel; (7) a pale bald narrow-faced man about 52, thin metal glasses, ink-stained fingers, plain black suit, stiff collar, leather notebook on his lap; on the floorboards in front of the chairs a single row of EIGHT small brass floor markers — seven aligned with the chairs and an eighth to the right of the last chair with no chair above it; on the back wall a small brass emblem: a circle crossed by a vertical line with seven dots around it; nobody smiling`
- **Notas críticas:** a cadeira 5 (homem de óculos redondos) deve ficar centrada em ~62% da largura — o jogo cobre x 56,5–68,5% / y 26–88% com o "recorte". Se a composição sair diferente, ajuste `cutout` em `src/content/documents/doc_meridian_photo.json`. Os 8 marcadores no chão são pista (detalhe clicável).

### 7. ⬜ `media/documents/courier_1936_photo.webp` — foto do jornal (DOC04)
- 1400×700 (2:1). Ocupa o topo da página do jornal.
- **Prompt:** `[token 1936 imprensa] press photograph of a large Victorian manor at dusk in rain, seen from the gravel drive, several sheriff's deputies in long coats and hats holding lanterns, a 1930s police car parked by the porch, the front door open with light spilling out, grim mood`
- **Notas:** sem manchete/texto na imagem (a manchete é HTML).

### 8. ⬜ `media/documents/releve_1791.webp` — DOC08 (fim do slice)
- 1400×700 (2:1). Ilustração no topo da folha.
- **Prompt:** `18th-century surveyor's ink sketch on foxed rag paper, 1791: a circle crossed by a single vertical line with exactly eight small dots evenly spaced around the circle, compass bearings, a few distance lines with tiny tick marks, a small hand-drawn north arrow, faded brown iron-gall ink, stains, fold creases, scientific and sparse, illegible tiny annotations only`
- **Notas:** exatamente **8** pontos (o símbolo moderno tem 7). Sem texto legível.

### 9. ⬜ `media/documents/arthur_corkboard.webp` — quadro de cortiça no Study
- 1600×1000 (16:10).
- **Prompt:** `close view of an old cork investigation board on a wall, almost empty: dozens of pin holes, a few leftover brass pushpins, torn paper corners still under some pins, loose strands of red string hanging from pins, faint rectangles where papers used to be, warm dim lamplight from the side, 1990s`

### 10. (futuro) Texturas tileáveis
O slice usa texturas procedurais; trocar por imagem exige um passo de engine (materiais com `src`). Quando chegar a hora: papel de parede teal damasco, tábuas de carvalho escuro, pedra de fundação, reboco manchado — todas seamless 1024², sem iluminação direcional.

---

## Áudio

O jogo tem patches procedurais para tudo; estes arquivos os substituem automaticamente.

### 11. ⬜ `media/audio/arthur_tape_11.mp3` — DOC07, voz de Arthur (~23 s)
- **Voz:** homem de 69 anos, americano do Pacific Northwest, voz seca, cansada, ligeiramente rouca, frases curtas, autoirônico, nada teatral. **Processar como fita cassete**: chiado, leve wow/flutter, banda estreita, clique de gravação no início e no fim.
- **Roteiro e marcações (as legendas seguem estes tempos):**
  - 0:01.2 — "Tape eleven. The study. It's raining, which in this town means it's a day."
  - 0:06.0 — "I measured the north wall again. Same number. Wrong number."
  - 0:10.5 — "If you hear knocking from inside the walls, don't answer."
  - 0:15.0 — "I made that mistake once."
  - 0:18.5 — "...I checked. There is nothing in there that could knock."
  - termina em ~0:23 com clique de stop.
- Se os tempos mudarem, ajuste `audio.lines[].t` e `audio.duration` em `src/content/documents/doc_arthur_tape_01.json`.

### 12. ⬜ `media/audio/clock_chime_two.mp3` — relógio de pé batendo DUAS horas (~5 s)
`grandfather clock striking two o'clock, deep bronze bell, two strikes about 1.6 seconds apart, long natural decay, recorded in a large wooden library room, slight mechanical whir before the first strike`

### 13. ⬜ `media/audio/mechanism_click.mp3` — trava dentro da parede (~1,5 s)
`heavy old clockwork latch releasing inside a thick wall: a rapid series of four metallic ticks then a deep wooden thunk, muffled, close`

### 14. ⬜ `media/audio/bookcase_slide.mp3` — estante deslizando (~4 s)
`heavy oak bookcase sliding sideways on old iron rails, low grinding of stone and wood, books rattling slightly, uneven jerky motion, ends with a dull stop`

### 15. ⬜ `media/audio/door_creak.mp3` — porta antiga abrindo (~1,2 s)
`old heavy wooden door opening slowly, long dry hinge creak, quiet room tone`

### 16. ⬜ `media/audio/knock_in_wall.mp3` — batidas na parede (~2 s)
`three slow muffled knocks coming from inside a thick hollow wall, deep and dull, evenly spaced, no reverb tail, unsettling but ambiguous — could be wood, could be a hand`

---

## Checklist de integração (para quem gerar)
1. Gerar → converter para WebP/MP3 → salvar em `frontend/public/media/...` com o nome exato.
2. Rodar `npm run dev` e abrir `/?dev&area=<área>` para conferir (ex.: `?dev&area=arthur_study&inspect=doc_meridian_photo`).
3. Marcar ✅ aqui e registrar no `CHANGELOG.md`.
