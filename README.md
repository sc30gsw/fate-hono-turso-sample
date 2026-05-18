# fate-hono-turso-sample

A sample monorepo exploring [`react-fate`](https://fate.technology/) (normalized React data client) combined with [Hono](https://hono.dev/), [Drizzle ORM](https://orm.drizzle.team/), and [Turso](https://turso.tech/) (libSQL) on the Bun runtime.

> Phase 1: environment scaffolding only. Domain code lands in Phase 2.
>
> Naming note: the directory is still called `fate-hono-turso-sample` for historical reasons. The runtime stack now uses Hono on both server packages instead of Hono.

## Architecture

Three workspaces, fully decoupled. The fate HTTP transport and the application API are two independent Bun + Hono processes; only the Drizzle schema is shared.

```
packages/
  db/      # @app/db     Drizzle schema + libSQL client (shared)
  client/  # @app/client React 19 + Vite + fate client + colocated fate server (Hono on Bun)
  api/     # @app/api    Hono REST/RPC for non-fate concerns (auth, health, ...)
```

| Process | Package | Port |
|---|---|---|
| Vite dev server | `@app/client` | `5173` |
| fate HTTP transport (Hono + Bun.serve) | `@app/client` | `3001` |
| Application API (Hono + Bun.serve) | `@app/api` | `3002` |

The client uses Vite's proxy to forward `/fate` → `:3001` and `/api` → `:3002`, so both look same-origin from the browser.

## Setup

```bash
bun install
cp .env.example .env
```

For local development, the default `TURSO_DATABASE_URL=file:./dev.db` works without Turso credentials.

## Scripts

```bash
bun run dev          # 3 processes in parallel: fate (3001), api (3002), vite (5173)
bun run check        # type-check + lint across all packages
bun run test         # all tests
bun run build        # build all packages
bun run doctor       # react-doctor on @app/client
bun run fallow       # dead-code analysis on @app/client
bun run db:push      # drizzle-kit push (Phase 2)
```

