# CHANGES — Quality-Hardening Pass

Branch: `quality-hardening`. Companion to [`AUDIT.md`](AUDIT.md), which documents
what was wrong with execution evidence. This file summarizes what changed and why.

Every change was verified by real execution: the API installs on Python 3.11,
boots, and passes both test scripts; the web app installs, lints clean (0
errors), typechecks, builds all 17 routes, and serves every route (HTTP 200).

---

## 1. Correctness

### Build was impossible on any machine but the author's — fixed
`equa-response-web/next.config.ts` hardcoded a Turbopack `root` pointing at
`/Users/s.a.pawanprabhashana/...`, which broke `next build`/`next dev` everywhere
else (`Invalid distDirRoot`). Removed the setting — Turbopack auto-detects the
root from the lockfile. **Result:** build and dev now work; all 17 routes build.

### `python main.py` did nothing — fixed
`main.py` had no entrypoint, so the documented run command exited silently. Added
an `if __name__ == "__main__"` block that runs uvicorn on port 8000.

### Broken API test — fixed
`test_api.py`'s `/optimize` test omitted the required `resources` field (→ HTTP
422) and then read response keys that don't exist (`fairness_score`,
`optimized_incidents`). Sent a valid request and asserted the real response
(`total_distance_km`, `ordered_incidents`). The whole suite now passes.

### Pydantic v2 correctness
Replaced the deprecated `.dict()` with `.model_dump()` in `main.py` (the pinned
`pydantic==2.9.2` warns on `.dict()`).

### Latent shelter bug — fixed
`updateShelterPredictions` (`src/data/mock_hazards.ts`) read `shelter.lat` /
`shelter.lon`, which don't exist on the `Shelter` type (it uses a `location`
tuple) — so its "high-impact area" check was always false. Typed the parameter as
`Shelter[]` and read `shelter.location`.

## 2. Dependency integrity

- **`requests` was used but undeclared** by both test scripts. Added
  `requirements-dev.txt` (`-r requirements.txt` + `requests`) and documented it.
- **Removed unused deps** `clsx` and `tailwind-merge` from `package.json` (0
  references in `src/`) and synced `package-lock.json`.
- **Pinned the interpreter**: added `.python-version` (3.11). The pinned deps have
  no wheels for Python 3.14, which is the only interpreter on some machines; this
  makes the supported version explicit.

## 3. Cross-file consistency / dead code

- **Deleted the dead duplicate API client** `equa-response-web/lib/api.ts` (a
  stale 165-line copy; everything imports the canonical `src/lib/api.ts` via the
  `@/*` alias).
- **Deleted `equa-response-api/models.py`** — a parallel, unused set of Pydantic
  models; `main.py` defines its own inline.
- **Deleted empty stray files**: `equa-response-api/data/main.py`,
  `equa-response-web/next`, `equa-response-web/equa-response-web@0.1.0`.
- **Removed a dead function** (`calculatePolygonArea`) and a dead constant
  (`SEVERITY_MEDIUM`).

## 4. Lint: 30 errors → 0 (and 81 warnings → 6)

`npm run lint` previously failed with 30 errors. All resolved:

- **13 `no-explicit-any`** → replaced with real types (`FloodPolygon`,
  `GhostRoad[]`, `AreaRisk[]`, a new `ShelterPrediction` interface, store enum
  types, and language unions). No behavior change; `tsc` stays clean.
- **13 `no-unescaped-entities`** → curly quotes / `&apos;` in JSX copy.
- **`prefer-const`, TDZ ordering** (`page.tsx` `loadScenario` wrapped in
  `useCallback` and defined before its effect), and 2 intentional client-only
  `set-state-in-effect` cases (WebGL detection, random mock seeding) suppressed
  with a one-line justification each — moving them to state initializers would
  reintroduce SSR/hydration mismatches.
- **~70 unused imports / vars / params** removed across `lib/`, `store/`,
  `components/`, and pages. A few trailing "intent" params that were never used
  (`alpha`, `assets`, `seed`) were dropped along with their call-site arguments.

The remaining **6 warnings are all `react-hooks/exhaustive-deps`** that predate
this pass. They are intentional (effects that deliberately run once, and Three.js
cleanup) — changing them risks re-render loops or behavior changes, so they were
left as-is rather than papered over.

## 5. Error handling / cleanup

- **Removed 29 debug `console.log` calls** (state dumps, emoji traces, and one
  that fired at build time) from shipping paths — stores, engines, and pages.
  Legitimate `console.warn`/`console.error` on real error paths were kept.
- **Completed the plan-approval audit trail**: `approvePlan` (`operationsStore`)
  accepted `rationale` and `reviewerRole` but silently dropped them and recorded
  nothing. It now stores an `approvalReview` (a `PlanReview` with
  `decision: "APPROVED"`), symmetric with the existing `rejectPlan` behavior.

## 6. Docs aligned to reality

- **API README `/optimize`** described a nonexistent response
  (`fairness_score` / `placeholder_reverse_v1`, "returns reversed list as
  placeholder"). Rewrote it to the true contract (greedy dynamic-scoring route,
  required `resources`, real `path`/`ordered_incidents`/`total_distance_km`).
  Also corrected the CORS note (only `localhost:3000`) and the testing section.
- **Web README** was untouched create-next-app boilerplate (wrong paths, claimed
  the Geist font while the app uses Inter + JetBrains Mono, no mention of the
  backend). Replaced with an accurate README (prerequisites, `NEXT_PUBLIC_API_URL`,
  real scripts and structure).
- **Docs pruned**: removed 44 ephemeral phase/status/fix/ready-to-test reports
  from `docs/` (70 → 26), keeping the durable reference guides, quick-starts, and
  test how-tos. Rewrote `docs/README.md` to index only what remains. Root README
  links were verified intact.

## 7. Repository integrity (git)

- **Absorbed the frontend into the parent repo.** `equa-response-web` was
  committed as an orphan **gitlink** (mode 160000, no `.gitmodules`), so a clone
  got an empty frontend directory. Removed the nested `.git`, unstaged the
  gitlink, and staged the actual 73 source/config/public files (respecting
  `.gitignore`; `node_modules`/`.next` excluded).
- **Untracked a committed virtualenv.** `equa-response-api/.venv/bin` (16 files,
  including broken interpreter symlinks) was checked in because the API
  `.gitignore` listed `venv/` but not `.venv/`. Added `.venv/` there, added a
  **root `.gitignore`** (`.DS_Store`, `.venv/`, `node_modules/`, `.next/`, …),
  and untracked the venv.
- **Fixed the env-example ignore.** The web `.gitignore` pattern `.env*` was
  hiding `.env.local.example` (the template meant to be shared). Added
  `!.env*.example`, so the real `.env.local` stays ignored while the example is
  tracked.

> These git changes are **staged but not committed** — commit when you're ready.

## What was intentionally left alone

- **6 `react-hooks/exhaustive-deps` warnings** — intentional patterns (see §4).
- **`test_frontend_backend.html`** (root) — a working manual tester for
  `/optimize`; harmless, left in place.
- **Two `.mp4` deletions** shown by `git status` are a pre-existing Git-LFS state
  (git-lfs isn't installed here); not touched.
- **`docs/` content that remains** is accurate reference material and was kept
  per the "make docs true, don't delete useful docs" rule.
