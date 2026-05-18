# fate-hono-turso-sample

A sample monorepo exploring [`react-fate`](https://fate.technology/) (normalized React data client) combined with [Hono](https://hono.dev/), [Drizzle ORM](https://orm.drizzle.team/), [Turso](https://turso.tech/) (libSQL), and [Better Auth](https://www.better-auth.com/) on the Bun runtime.

## Architecture

Five workspaces. **One Hono backend** hosts auth, REST, and fate together.

```
packages/
  db/      # @app/db      Drizzle schema + libSQL client
  auth/    # @app/auth    Better Auth instance (shared by api + scripts)
  shared/  # @app/shared  Tiny utility helpers (parseNumber etc.)
  api/     # @app/api     Hono backend: /api/auth/*, /api/health, /fate/*
  client/  # @app/client  React 19 + Vite + react-fate (consumes /fate via the Vite proxy)
```

| Process | Package | Port |
|---|---|---|
| Vite dev server | `@app/client` | `5173` |
| Hono backend (auth + health + fate) | `@app/api` | `3002` |

The client uses Vite's proxy to forward both `/api/*` and `/fate/*` to `:3002`, so the browser sees one origin and Better Auth cookies flow through to fate's context without CORS gymnastics.

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

