# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

WorkshopHub is an internal training-registration system: employees browse and register for
internal training sessions. It is the baseline codebase for a multi-day AI-assisted delivery
training, so features are added incrementally as "workshops" (WH-1, WH-2, …) and the repo
deliberately contains unfinished work and intentional defects.

- **pnpm-workspaces monorepo** (`pnpm-workspace.yaml`): `app/` and `api/`. Node 24, pnpm 9.
- **`api/`** — Express + TypeScript, Prisma ORM over SQLite. Data flows thin route → service →
  Prisma:
  - `src/routes/*.ts` — HTTP only: parse/validate the request, map the result to a response.
  - `src/services/*.ts` — the business layer; the **only** place Prisma is allowed to be called.
  - `src/lib/prisma.ts` — the single `PrismaClient` singleton; every service imports this, never
    constructs its own client.
  - `prisma/schema.prisma` — the source of truth for the data model; `prisma/seed.ts` seeds it.
- **`app/`** — React 18 + TypeScript + Vite 5. Pages (`src/pages/`) `fetch` the API at
  `VITE_API_URL` (defaults to same origin) and render components (`src/components/`). API response
  shapes are mirrored by hand in `app/src/types/index.ts` — keep it in sync when the Prisma schema
  changes.
- In production the API process also serves the built frontend (`app/dist`, see `src/app.ts`), so
  prod is a single process on **8080**; dev runs frontend **5173** + API **3001**.

## Common commands

The stable command interface is the `Makefile` (run from the repo root). Prefer these over
hand-built package scripts:

- `make setup` — install deps, `prisma generate`, push schema to SQLite, seed. Run once after cloning.
- `make dev` — start frontend (5173) and API (3001) together.
- `make test` — all Jest tests (unit + integration; needs the seeded SQLite DB).
- `make lint` / `make format-check` — ESLint / Prettier across both packages.
- `make build` — build `app` then `api`.
- `make seed` / `make reset-db` — seed, or force-reset and re-seed, the SQLite DB.
- `make smoke-test` — curl a running API (default `:3001`) for health / list / single / 404.

Targeting less than everything:

- `make test-unit` — only `tests/unit` (no DB needed).
- Single test or suite: `cd api && npx jest <path-or-regex>` (e.g. `npx jest trainingSessionService`);
  `jest --testPathPattern=tests/integration` filters by folder.
- One package only: `pnpm --filter @workshophub/api lint` (or `@workshophub/app`).

Tests live in `api/tests/{unit,integration}/*.test.ts` (ts-jest, node env); `tests/setup.ts` sets
the test `DATABASE_URL` and `NODE_ENV`. **`DATABASE_URL` is relative to `api/prisma/schema.prisma`**,
so `file:../database/workshophub.sqlite` resolves to `api/database/workshophub.sqlite` — a common
source of "DB not found" errors.

The quality gate is `make test`, `make lint`, and `make format-check`, all of which run in CI
(`pr-check` on PRs to `main`) and via the pre-push hook. A pre-commit hook also enforces branch
naming (`wh-<thing>-<thing>`, e.g. `wh-fix-123`) and a REASONS lint over `spdd/prompt/*.md`.

## Team norms

1. **No `any`.** Never use TypeScript `any`, including `as any` — use explicit types, `unknown`
   with narrowing, or generics. Note that `@typescript-eslint/no-explicit-any` is only a _warning_
   in `api/.eslintrc.cjs` and is unset in `app`, so a stray `any` keeps `make lint` green. Treat
   the norm as a hard rule; it is enforced by review, not by the lint gate.
2. **No direct Prisma in routes.** Route handlers must not import or call Prisma — put all DB
   access in `src/services/` and keep routes to validation, auth, and HTTP mapping. `admin.ts` and
   the `GET /api/training-sessions/search` handler are pre-existing exceptions (see below); do not
   "fix" them as a side effect of unrelated work.
3. **All code must pass `make test` and `make lint`** before a PR or push. Fix failures rather than
   disabling rules or skipping tests to go green.

**Intentional training seeds — do not auto-correct:** some code deliberately breaks the norms
above as exercise material and is guarded by tests:

- `api/src/routes/training-sessions.ts` `GET /search` uses `prisma.$queryRawUnsafe` with string
  interpolation (an SQL-injection seed for Workshop 8).
- `api/src/routes/admin.ts` constructs its own `PrismaClient` and has an auth TODO.
  Leave these in place unless the task is specifically about remediating them.

Don't "simplify" away the capacity logic in `services/trainingSessionService.ts`: the conditional
`updateMany` (`registered < capacity`) is a deliberate concurrency-safe capacity gate — its
affected-row count is the capacity decision, so the counter can't exceed capacity under races.

## MCP permissions

Source of truth: `.mcp.json` (declared servers) and `.claude/settings.local.json` (enabled
servers + allow-list). There is no `.claude/settings.json`, so these two files are the entire
configured surface.

**Declared & enabled**

- `trello` is the only declared server: HTTP transport at `https://mcp.trello.com/v1`
  (`.mcp.json`), turned on by `enabledMcpjsonServers: ["trello"]`. A server listed in
  `.mcp.json` but absent from `enabledMcpjsonServers` stays off.

**Per-tool scopes** — the local settings define allow/ask entries for `mcp__trello__*`,
so every Trello tool the server exposes is currently available, writes included, although behind asking. The surface
splits by risk:

- Read-only, no external mutation: `trelloReadBoard`, `trelloReadCard`, `trelloReadChecklist`,
  `trelloReadInbox`, `trelloReadList`, `trelloReadMember`, `trelloReadPlanner`,
  `trelloReadWorkspace`, `trelloSearch`.
- Writes — mutate shared Trello data the whole team sees: `trelloWriteBoard`, `trelloWriteCard`,
  `trelloWriteChecklist`, `trelloWriteInbox`, `trelloWriteList`, `trelloWritePlanner`.

## AGENT_BOUNDARY

### ALLOWED:

- Read files in the repo (except .env)
- Read and write source code files as part of coding work

### ASK FIRST:

- git pushes and git commit
- Editing docker-compose files

### DENY:

- Read .env files
- Read or editing files outside the project tree
- Read or write to .opencode directory: Those are lab examples and not to be read or modified
