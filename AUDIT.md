# Quality-Hardening Audit — EQUA-RESPONSE

Date: 2026-08-02
Branch: `quality-hardening`
Scope: `equa-response-api/` (FastAPI backend) and `equa-response-web/` (Next.js frontend).
Excluded from scoring/edits: `node_modules/`, `.venv/`, `.next/`, `package-lock.json`, `docs/*` phase-report prose (noted, not "fixed"), media folders.

## How this was verified (not just read)

- **API**: pinned deps install cleanly into a fresh **Python 3.11** venv; server boots; `/`, `/health`, `/scenarios`, `/scenarios/{id}`, `/optimize` all exercised with `curl` and the two test scripts.
- **Web**: `npm ci` (clean install), `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run dev` with `curl` against 6 routes.

Verification results are cited inline below.

---

## Executive summary

The project genuinely works and is substantial (17 routed pages, seeded Monte-Carlo / battle-mode / hotspot engines, a real greedy route optimizer). But it does **not build or run out-of-the-box** on any machine other than the original author's, and it carries several integrity problems that a clone would trip over immediately.

Top blockers, in priority order:

| # | Severity | Issue | Evidence |
|---|----------|-------|----------|
| 1 | **Critical** | Hardcoded absolute path in `next.config.ts` breaks every build/dev run | `equa-response-web/next.config.ts:6` |
| 2 | **High** | Frontend is committed as an orphan git **gitlink**, not tracked by the parent repo | parent `git ls-files equa-response-web` → 1 entry, mode `160000`, no `.gitmodules` |
| 3 | **High** | `npm run lint` fails: **30 errors** / 81 warnings | `npm run lint` |
| 4 | **Medium** | `test_api.py` `/optimize` test is broken (always fails) | `equa-response-api/test_api.py:83,87` |
| 5 | **Medium** | `requests` used by both test scripts but not declared | `test_api.py:5`, `test_optimization.py:5` vs `requirements.txt` |
| 6 | **Medium** | Duplicate/stale API client + unused Pydantic model file | `equa-response-web/lib/api.ts`, `equa-response-api/models.py` |
| 7 | **Medium** | API README documents a `/optimize` contract that no longer exists | `equa-response-api/README.md` |

---

## 1. Functional correctness

### 1.1 [CRITICAL] Hardcoded machine-specific Turbopack root — build/dev impossible on any other machine
`equa-response-web/next.config.ts:6`
```ts
turbopack: { root: "/Users/s.a.pawanprabhashana/equa-response/equa-response-web" }
```
That directory belongs to the original author (`s.a.pawanprabhashana`). On this machine both `next build` and `next dev` fail:
```
TurbopackInternalError: Invalid distDirRoot: ".next". distDirRoot should not navigate out of the projectPath.
```
**Verified fix**: removing the `turbopack.root` line makes `npm run dev` serve `/` (HTTP 200) and `npm run build` complete all 17 routes. Turbopack auto-detects the root from the single `package-lock.json`, so the setting is not just wrong — it is unnecessary.

### 1.2 [MEDIUM] `test_api.py` optimize test always fails
`equa-response-api/test_api.py:83` sends `json={"incidents": incidents}` with **no `resources`**, but `OptimizationRequest.resources` is required (`main.py:43`) → server returns **422** (verified). The test then reads `data['fairness_score']` (`:87`) and `data['optimized_incidents']` (`:89`), which the endpoint never returns. Running it yields `❌ ERROR: 'fairness_score'`. (`test_optimization.py`, by contrast, sends a complete request and passes — verified.)

### 1.3 [LOW] Python version reality is undocumented
Pinned deps (`pydantic==2.9.2` / `pydantic-core==2.23.4`) have **no wheels for Python 3.14** and fail to build from source there (verified: `failed-wheel-build-for-install`). They install fine on 3.11/3.12. Nothing in the README or a `.python-version` states the supported interpreter.

### 1.4 No leftover "add your logic here" placeholders in real code paths
Grep for `TODO|FIXME|placeholder|coming soon|not implemented` found only legitimate HTML `placeholder=` input attributes and one `@ts-expect-error` in `src/components/map/MainMap.tsx:34`. Good.

---

## 2. Dependency integrity

### 2.1 [MEDIUM] Used-but-undeclared: `requests`
`equa-response-api/test_api.py:5` and `test_optimization.py:5` `import requests`, which is **not** in `requirements.txt`. Verified: `ModuleNotFoundError: No module named 'requests'` in a clean install.

### 2.2 [LOW] Declared-but-unused web deps: `clsx`, `tailwind-merge`
Both are in `equa-response-web/package.json` dependencies but referenced in **0** source files (verified by grep for `clsx`, `tailwind-merge`, `twMerge`, `cn(`). Classic leftover `cn()` helper deps that were never wired up.

### 2.3 No phantom / non-existent-registry packages
All backend and frontend packages resolve on their registries (PyPI / npm). Nothing fabricated.

### 2.4 [LOW] Depot default drift
`main.py:46` defaults `depot=[7.87, 80.77]`; the unused `models.py:54` uses `[7.8731, 80.7718]`; `api.ts` and tests use `[7.8731, 80.7718]`. Harmless (models.py is dead — see 4.1) but inconsistent.

---

## 3. Cross-file consistency

### 3.1 [MEDIUM] Two divergent API clients
- `equa-response-web/src/lib/api.ts` (440 lines) — the **canonical** one; every import uses `@/lib/api`, and `tsconfig.json` maps `@/* → ./src/*`.
- `equa-response-web/lib/api.ts` (165 lines) — an **older, dead** copy. Nothing imports it (verified). It even disagrees on behavior: its `getSeverityLevel` uses `>=4 MEDIUM (#06b6d4)` / `LOW (#22c55e)`, while the live one uses `>=5 MEDIUM (#eab308)` / `LOW (#10b981)`.

### 3.2 [LOW] Backend model duplication
`main.py:24-46` re-defines `Incident`, `Resource`, `OptimizationRequest` inline instead of importing the richer versions in `models.py`. The two `Incident`/`Resource` definitions are identical; the request/response models differ slightly. See 4.1.

Otherwise error-handling and HTTP style are consistent within each codebase (single `apiFetch` wrapper on the web; a single `load_data`/`HTTPException` pattern on the API).

---

## 4. Dead / orphan code

### 4.1 [MEDIUM] `equa-response-api/models.py` is entirely unused
`main.py` never imports from `models.py`; it redefines its models inline. `Location`, `OptimizationResponse`, `ScenarioMetadata`, `HealthResponse` are defined nowhere-used. The file is a parallel, drifting source of truth.

### 4.2 [LOW] Dead duplicate client
`equa-response-web/lib/api.ts` (see 3.1).

### 4.3 [LOW] Empty / stray files
- `equa-response-api/data/main.py` — 0 bytes.
- `equa-response-web/next` — 0 bytes (looks like a shell redirect accident).
- `equa-response-web/equa-response-web@0.1.0` — 0 bytes (accidental `npm`/`echo` artifact).
- Committed/loose `.DS_Store` files at repo root and inside `equa-response-api/`, `equa-response-web/`.

### 4.4 [LOW] Unused imports / vars — 74 lint warnings
e.g. `src/store/optimizationStore.ts:7` (`DigitalTwinFrame`), `src/lib/playbooks.ts:6` (`Incident`, `Shelter`, `Asset`), `src/lib/truthEngine.ts:96` (`SEVERITY_MEDIUM`), `src/store/operationsStore.ts:8` (`Resource`). Full list in `npm run lint`.

---

## 5. Over-engineering

The engines (`monteCarloEngine`, `battleMode`, `playbookEngine`, `hotspotDetection`, `truthEngine`, `seededRng`) are justified by real features and are reasonably flat — **no gratuitous DI/factory scaffolding**. One note, not a defect:

- **Documentation sprawl**: `docs/` holds **70** markdown files, most of them ephemeral phase reports (`*_COMPLETE.md`, `*_STATUS.md`, `*_READY_TO_TEST.md`, `*_FIX.md`). This is journal noise rather than reference docs. Consolidation is worth doing but is a **large structural change — flagged for approval, not done unilaterally**, and none of it should be deleted if it's still accurate.

---

## 6. Error handling

### 6.1 [LOW] Broad `except Exception` masks the real failure in the test runner
`equa-response-api/test_api.py:130` catches `Exception` last and prints `str(e)`, which is why the broken optimize test surfaces as the cryptic `❌ ERROR: 'fairness_score'` instead of the real 422.

### 6.2 [LOW] Debug logging left in shipping paths — 51 `console.*` in `src/`
Heaviest: `src/app/mission-control/page.tsx` (14), `src/store/optimizationStore.ts` (8), `src/store/operationsStore.ts` (3). One fires at **build/prerender time**: `📋 INCIDENT GROUPING: {...}` appears in `npm run build` output.

### 6.3 [LOW] Silently dropped parameters
`src/store/operationsStore.ts:480` `approvePlan(planId, rationale, reviewerRole)` ignores `rationale` and `reviewerRole` entirely and records no review; `rejectPlan` (`:492`) also ignores them but at least builds a `PlanReview`. Either wire them in or drop them from the signature.

The web `apiFetch` wrapper (`src/lib/api.ts`) and the API's `load_data` (`main.py:52`) both handle errors specifically and sensibly — good.

---

## 7. Docs vs reality

### 7.1 [MEDIUM] API README documents a `/optimize` contract that no longer exists
`equa-response-api/README.md` describes the response as `optimized_incidents` + `fairness_score` + `"algorithm": "placeholder_reverse_v1"` and states *"Currently returns reversed list as placeholder."* The actual endpoint (`main.py:178`) returns `path`, `ordered_incidents`, `total_distance_km`, `algorithm: "DynamicScore..."`, `alpha_used` from a **real greedy optimizer**. The documented request body also omits the required `resources` field. Fix by updating the README to the true contract (the algorithm is better than the docs claim).

### 7.2 [LOW] Web README is untouched create-next-app boilerplate
`equa-response-web/README.md` tells you to edit `app/page.tsx` (it's `src/app/page.tsx`), claims the **Geist** font (`layout.tsx:2` actually loads `Inter` + `JetBrains_Mono`), and never mentions that the app needs the FastAPI backend or the `NEXT_PUBLIC_API_URL` env var. The **root** `README.md`, by contrast, is accurate and thorough.

### 7.3 [LOW] CORS doc mismatch
`equa-response-api/README.md` says CORS is enabled for `localhost:3000` **and** `localhost:3001`; `main.py:14` allows only `http://localhost:3000`.

---

## 8. Config & secrets

- **No secrets in source.** Grep found no API keys/tokens/passwords. `.env.local` (gitignored) contains only `NEXT_PUBLIC_API_URL`.
- **`.env.example` exists** for the web app (`.env.local.example`) and is accurate. Good. The API reads no env vars, so it needs none.
- **The one real config defect is 1.1** — a machine-specific absolute path baked into `next.config.ts`.

---

## Appendix — commands run

```bash
# API
python3.11 -m venv v311 && v311/bin/pip install -r requirements.txt   # clean on 3.11; fails on 3.14
v311/bin/python -m uvicorn main:app --port 8000                       # boots
curl /health /scenarios /scenarios/{id}; curl -X POST /optimize       # 422 on resource-less body
v311/bin/python test_optimization.py   # passes
v311/bin/python test_api.py            # optimize sub-test fails (fairness_score)

# Web
npm ci                 # clean install; committed node_modules was missing native binaries
npm run lint           # 30 errors, 81 warnings
npx tsc --noEmit       # clean
npm run build          # FAILS with stock config; PASSES (17 routes) with turbopack.root removed
npm run dev            # /, /playbook-studio, /mission-control, /shelters, /digital-twin, /travel-guard → 200 (root removed)
```
