# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Behavioral Guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Architecture

Bun workspaces monorepo with three packages — see `README.md` for the table and ports.

**Strict boundary:** the fate HTTP transport (in `@app/client/server/`) and the application API (in `@app/api`) are independent Bun processes, both running Hono. They share **only** the Drizzle schema via `@app/db`. The Vite dev server proxies `/fate` → `:3001` and `/api` → `:3002`.

**Stack:** Bun 1.3.9 · React 19.2 (Compiler enabled via `babel-plugin-react-compiler` in `packages/client/vite.config.ts`) · Vite · TanStack Router · TanStack Form · fate · Hono (everywhere on the server side, including the fate transport via `createHonoFateHandler` and the REST API) · Drizzle (libSQL/Turso) · valibot (client forms + `@hono/valibot-validator` server-side) · `better-result` (client I/O boundary) · misina · vite-plus / fallow / react-doctor.

## Conventions

All conventions live in `.claude/rules/`. Phase 1 highlights Claude should not violate:

- File naming: kebab-case (`user-card.tsx`). **No `index.ts` / `index.tsx`** in source dirs — use named files (`auth.ts`, `db.ts`, `home.tsx`). See `.claude/rules/typescript/no-index-files.md`. Hook-enforced.
- Forms: TanStack Form + valibot (no adapter). `form.state.isSubmitting` for pending state, `formApi.setErrorMap({ onSubmit: { form, fields } })` for server errors — no `useState`/`useTransition`/`useMutation`. See `.claude/rules/typescript/form-pattern.md`.
- Imports: `~/` alias inside `packages/client/src/` (configured in `tsconfig.base.json`); no relative paths
- Types: `type` only — `interface` is banned (hook-enforced)
- Exports: named only; `export default` allowed only in `src/routes/*` and `*.config.ts` (hook-enforced)
- Errors (client): `better-result`; no `try-catch` in `packages/client/` (hook-enforced)
- Errors (server): `throw new HTTPException(code, { message })` from `hono/http-exception` + `app.onError`; no `better-result` inside `@app/api` or `@app/client/server`
- React: function declarations for components/hooks; no manual `useMemo`/`useCallback` (Compiler handles it)
- Comments: explain *why*, never *what*

**`.claude/settings.json` runs PostToolUse hooks** on every Edit/Write: `vp fmt`, `vp check`, plus the bans above. Violations surface as warnings in tool output — fix on sight, don't ignore.

## Stack Rules

- **fate (`@app/client`)** — see `.claude/rules/fate-best-practices.md`.
  Project deviation: the fate HTTP transport lives in `@app/client/server/` (Hono on `Bun.serve` via `createHonoFateHandler`). Vite plugin entry — `module: './server/fate.ts'`.

- **Hono (`@app/api` + `@app/client/server`)** — see `.claude/rules/hono-best-practices.md`.
  Project deviation: two separate Hono apps. `@app/api` serves `/api/*` for non-fate concerns (auth, health, ...). `@app/client/server` is dedicated to fate's `/fate` and `/fate/live`. Never mix routes across them.

## Scripts

See `package.json` (root + per-package). Most-used: `bun run dev` (3-process concurrent), `bun run check`, `bun run test`, `bun run doctor` (react-doctor), `bun run fallow` (dead-code), `bun run db:push`. Env-management helpers: `bun run env:{set,get,ls,keypair,encrypt,decrypt}` — see `.claude/rules/common/dotenvx.md`.

## Environment

All `dev` / `start` / `build` / `db:*` scripts are wrapped with `dotenvx run -f ../../.env --`. There's one root `.env` (gitignored) loaded into every workspace; no per-workspace `.env` files. Required vars are listed in `.env.example`. Don't `import "@dotenvx/dotenvx/config"` from app code — the CLI wrapper already injected `process.env` before the process started.

## Common Pitfalls

- **Don't import `@app/db` directly from the browser bundle.** It pulls in `@libsql/client`. Import only from server-side files (`@app/client/server/*.ts` and `@app/api/src/**`).
- **Don't add fate routes to `@app/api`.** fate's HTTP transport lives in `@app/client/server/`. Two Hono apps, two roles.
- **Don't return `Result` from `@app/api` handlers.** Use `throw new HTTPException(code, { message })` and `app.onError`.
- **Don't extract Hono handlers into named `(c) => {...}` functions.** Path-param and validator inference relies on inline definitions. Use `factory.createHandlers()` from `hono/factory` if you must.
- **Don't mock the database in tests.** Use a `file:./test.db` libSQL instance for integration; pure-function tests don't need DB.
- **Don't run package managers directly inside workspaces.** Use `bun --filter @app/<name> <script>` or root scripts.
