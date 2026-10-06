# The House of Vale

Jogo web 3D de mistério em primeira pessoa (Vite + React + TypeScript + React Three Fiber + Rapier), com saves locais e na nuvem (Supabase) e um backend FastAPI opcional.
Estado: **vertical slice jogável** (~10–20 min): portão → Entrance Hall → Arthur's Study → West Library → relógio de 2:17 → passagem secreta.

## Rodar

### Frontend (o jogo)
```bash
cd frontend
npm install
cp .env.example .env      # preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (sem isso: modo offline)
npm run dev               # http://localhost:5173
```
| Script | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | Vitest: conteúdo, regras, saves e walkthrough completo do slice |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict |
| `npm run build` | typecheck + build de produção em `dist/` |

**Atalho de desenvolvimento** (só em `npm run dev`): `http://localhost:5173/?dev&area=library&lamp=1`
Parâmetros: `area=<id>` · `yaw=<radianos>` · `lamp=1` (lamparina acesa) · `items=a,b` · `open=porta1,porta2` · `inspect=<documento|item>` · `puzzle=<id>` · `pos=x,y,z` · `shot` (oculta o aviso de pointer lock, para capturas).
Captura headless: `chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1280,720 --virtual-time-budget=20000 --screenshot=out.png "http://localhost:5173/?dev&shot&area=arthur_study&lamp=1"`.

### Backend (opcional)
A partir de `backend/` (não de `backend/app/`):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1            # Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env                  # SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, CORS_ORIGINS
python run.py                           # ou: uvicorn app.main:app --reload  → http://localhost:8000/docs
pytest
```
Para o jogo salvar via backend, defina `VITE_API_URL=http://localhost:8000` no `.env` do frontend. Sem isso, o jogo fala direto com o Supabase (sob RLS).

### Banco (Supabase)
Migrations em `supabase/migrations/`. A inicial já está aplicada no projeto `houseofvale`. Para outro projeto: `supabase db push` (CLI) ou cole o SQL no editor do painel.
Google OAuth: habilite o provider em Authentication → Providers e adicione a URL do site em Redirect URLs.

## Controles
WASD andar · mouse olhar · Shift apressar · **E** interagir · **F** lamparina · **Tab** pertences / journal / quadro · **Esc** menu.
Inspeção: arrastar inclina, roda dá zoom, F vira, T transcrição. Relógio: A/D horas, W/S minutos, E "Let it strike".

## Estrutura
```
frontend/src/game/     engine (sistemas)        frontend/src/content/  conteúdo (JSON)
frontend/src/ui/       interface React          frontend/public/media/ arte/áudio gerados
backend/app/           FastAPI                  supabase/migrations/   SQL + RLS
docs/                  design, lore, arquitetura
```
Adicionar uma sala, documento ou puzzle = adicionar JSON. Detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentação
| Doc | Conteúdo |
|---|---|
| [ARCHITECTURE](docs/ARCHITECTURE.md) | sistemas, DSL, save/sync, backend, decisões técnicas |
| [GAME_DESIGN](docs/GAME_DESIGN.md) | pilares, loop, controles, **decisões pendentes** (§11) |
| [LORE_BIBLE](docs/LORE_BIBLE.md) | canon ([CORE] imutável, [DECISÃO] revisável) |
| [TIMELINE](docs/TIMELINE.md) · [CHARACTERS](docs/CHARACTERS.md) | 1791–1998, pessoas |
| [WORLD_MAP](docs/WORLD_MAP.md) | planta real × conhecida, coordenadas do slice |
| [PUZZLES](docs/PUZZLES.md) | cadeia do slice e catálogo |
| [ART_DIRECTION](docs/ART_DIRECTION.md) · [CHARACTER_VISUAL_BIBLE](docs/CHARACTER_VISUAL_BIBLE.md) | estilo, luz, rostos |
| [ASSET_MANIFEST](docs/ASSET_MANIFEST.md) | o que gerar no Higgsfield, com caminhos e prompts |
| [ROADMAP](docs/ROADMAP.md) · [CHANGELOG](docs/CHANGELOG.md) | fases e histórico |

## Deploy
- **Netlify**: base directory `frontend` (usa `frontend/netlify.toml`); variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e, opcionalmente, `VITE_API_URL`.
- **Render**: blueprint `render.yaml` (serviço `backend`); variáveis `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `CORS_ORIGINS`.
- Nenhum secret/service_role é necessário em nenhum dos dois.
