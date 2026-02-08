# EQUA-RESPONSE — Disaster Response Command Center + Doctrine Laboratory

EQUA-RESPONSE is a Sri Lanka–focused disaster response web platform that combines a **live operational dashboard** (map + incidents + shelters + assets) with a flagship module called **Playbook Studio**—a **doctrine laboratory** where teams design response strategies, compare them side‑by‑side, stress‑test them under uncertainty, and export an operational brief for execution.

## Why this matters (and what’s creative about it)

Most systems stop at “visualize the situation.” EQUA-RESPONSE goes further: **it helps commanders choose the best doctrine** by turning planning into an evaluatable workflow:

- **Battle Mode** compares 2–4 playbooks on equity, efficiency, safety, overload avoidance, and feasibility.
- **Robustness Testing (Monte Carlo)** runs 30 seeded simulations with variable floods/roads/shelters/sensor confidence to quantify reliability (success rate + confidence grade).
- **Sub-district Hotspots (P1/P2/P3)** converts district-level awareness into tactical priorities.
- **Commander Brief** outputs a military‑style operational order + comms timeline and supports **JSON export** for downstream systems.

## Quick links

- **Demo video**: see `demo video/README.md` (on GitHub open the `.mp4` and click **“View raw”** to download/stream)
- **Screenshots**: `Screenshots of the Solution/README.md`
- **Documentation index**: `docs/README.md`
- **Playbook Studio docs**: `docs/PLAYBOOK_STUDIO_COMPLETE.md` and `docs/PLAYBOOK_STUDIO_UI_GUIDE.md`

## What you can do in the app

### Core command center (operational dashboard)

- View hazards (flood polygons, cyclone cone, blocked roads), incidents, shelters, and assets on an interactive map.
- Run scenario playback via the Digital Twin view.
- Coordinate missions (Mission Control), communications (Comms Console), logistics, and assets/readiness.
- Use a deterministic Ops Copilot for recommendations and quick actions.

### Playbook Studio (flagship)

Playbook Studio is intentionally **guided** (not a data shower). It’s built around an operator workflow:

1. **Doctrine Builder**: choose affected districts, objectives, triggers, constraints, comms presets, and alpha strategy.
2. **Battle Mode**: select 2–4 playbooks and compare scoreboards + failure points + resource utilization; promote the winner to active doctrine.
3. **Robustness Test**: run 30 uncertainty simulations (seeded) to measure stability and confidence grade (A–F) with distribution charts.
4. **Hotspots**: compute top sub-district priorities (P1/P2/P3) per impacted district with reasons (hazard + incidents + shelter overload + access loss).
5. **Commander Brief**: generate an operational order (situation, intent, execution, resources, comms timeline, risk) and export JSON.

## Tech stack (concepts & technologies used)

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **State**: Zustand stores for operational state, optimization, settings
- **Mapping**: Leaflet / React-Leaflet for the 2D operational map
- **3D intro (where used)**: Three.js (cinematic globe intro module)
- **UI motion**: Framer Motion micro-interactions and transitions
- **Backend**: FastAPI (Python) mock API for scenarios (`/scenarios`, `/scenarios/:id`) and health endpoints
- **Algorithms / concepts**:
  - **Multi-criteria scoring** (equity, efficiency, overload avoidance, travel safety, feasibility)
  - **Seeded Monte Carlo simulation** for robustness testing (deterministic per seed)
  - **Geospatial utilities** (haversine distance, polygon proximity, district/hotspot reasoning)
  - **Rule-based doctrine generation** (missions + comms drafts + constraints)
  - **Lifecycle/versioning** for playbooks (Draft → Reviewed → Approved → Active)

## Repo structure

- `equa-response-web/`: Next.js frontend (all UI + Playbook Studio)
- `equa-response-api/`: FastAPI backend (scenario endpoints)
- `docs/`: implementation notes, testing guides, phase reports (moved here to keep repo root clean)
- `demo video/`: demo `.mp4` + README with “View raw” instructions
- `Screenshots of the Solution/`: screenshots + README gallery/index

## Run locally

### 1) Backend (FastAPI)

```bash
cd equa-response-api
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API docs: `http://127.0.0.1:8000/docs`

### 2) Frontend (Next.js)

```bash
cd equa-response-web
npm install
npm run dev
```

Open: `http://127.0.0.1:3000`

### API base URL (optional)

If your API runs on a different port, set:

```bash
# equa-response-web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8001
```

Then restart the dev server.

## Documentation

All prior `.md` files that were cluttering the repo root were moved into `docs/`—start here:

- `docs/README.md`
