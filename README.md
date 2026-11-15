# TerraFlame

Fire hotspot calendar for India (harmonized MODIS/VIIRS history + live map).

## Layout

```
TerraFlameV1/
├── terraflame-frontend/   Vite + React (Vercel: set root directory here)
├── terraflame-backend/    FastAPI, jobs, Postgres schema, Docker compose
├── .venv/                 Python virtualenv (repo root)
└── CURSOR_BRIEF.md
```

## Local development

**Database** (from `terraflame-backend/`):

```bash
docker compose up -d
docker compose exec -T db psql -U fire -d firedb < db/schema.sql
```

**Backend** (from `terraflame-backend/`, with `.env` from `.env.example`):

```bash
cd terraflame-backend
source ../.venv/bin/activate && set -a; source .env; set +a
uvicorn api.main:app --reload
```

**Frontend**:

```bash
cd terraflame-frontend
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` in `terraflame-frontend/.env`.

- **`terraflame-backend/reference/`** — small reference files (in git): calibration, proof, `h3_state`, etc.
- **`terraflame-backend/handover/`** — large `daily_h_*.csv` for DB import only (not in git). See each folder’s README.