# EQUA-RESPONSE — Web (Next.js frontend)

The frontend for EQUA-RESPONSE: the operational dashboard (map, incidents,
shelters, assets) plus **Playbook Studio** (doctrine builder, Battle Mode,
Monte Carlo robustness, hotspots, Commander Brief).

Built with Next.js (App Router) + React + TypeScript, Tailwind CSS v4, Zustand
stores, Leaflet / React-Leaflet, Three.js, and Framer Motion.

For the full product overview see the [repository README](../README.md).

## Prerequisites

This app reads scenario data from the FastAPI backend in
[`../equa-response-api`](../equa-response-api). Start that first (it serves on
`http://localhost:8000`). The UI degrades gracefully if the API is down — pages
still render, but no scenarios load.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy the example env file and adjust if your API runs elsewhere:

```bash
cp .env.local.example .env.local
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |

## Project structure

```
src/
├── app/          # App Router pages (dashboard + one route per module)
├── components/   # UI: map, HUD, globe intro, dock/layout, panels
├── lib/          # Engines + API client (playbook, battle, monteCarlo, api.ts, …)
├── store/        # Zustand stores (operations, optimization, settings)
├── data/         # Static geodata + mock hazards
└── hooks/        # Scenario hydration
```
