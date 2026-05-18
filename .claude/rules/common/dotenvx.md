# Environment Variables (dotenvx)

All env vars in this repo are loaded by [`dotenvx`](https://dotenvx.com/), wrapped around the runtime invocation of each workspace's `dev` / `start` / `build` / `db:*` scripts.

Authoritative source: `package.json` (root + each workspace).

## Single root `.env`

There is **one** `.env` at the repository root. Every workspace script references it via `dotenvx run -f ../../.env -- <cmd>`. Do not create per-workspace `.env` files — duplication causes drift.

```
fate-hono-turso-sample/
├── .env                 # gitignored — local plaintext
├── .env.example         # committed — variable schema with safe defaults
├── .env.keys            # gitignored — encryption private keys
└── .env.production      # committed when encrypted (`encrypted:...` values only)
```

## Setup

1. Copy: `cp .env.example .env`
2. Fill in real values (e.g. `TURSO_AUTH_TOKEN`)
3. Start dev: `bun run dev` — dotenvx loads `.env` and forwards env to each child process

## Adding a new variable

Always use `bun run env:set` (never hand-write encrypted values, never edit `.env.keys`):

```bash
bun run env:set NEW_VAR "value"                     # plaintext .env
bun run env:set NEW_VAR "value" -f .env.production  # encrypted into .env.production
```

After adding to `.env`, also append the variable to `.env.example` with a placeholder so other developers know it exists.

## Encryption workflow

To commit production secrets safely:

```bash
bun run env:keypair          # writes .env.keys (gitignored) + .env.keys.public
bun run env:encrypt -f .env.production
git add .env.production       # encrypted values are safe to commit
```

In CI/prod, expose the matching `DOTENV_PRIVATE_KEY_PRODUCTION` env var so dotenvx can decrypt at runtime.

## Naming convention

| Prefix | Where it lives | Consumer |
|---|---|---|
| `VITE_*` | `.env` (root) | Inlined into the browser bundle by Vite. Access via `import.meta.env.VITE_NAME`. **Anyone can read these in DevTools.** Never put secrets here. |
| (no prefix) | `.env` (root) | Server-side only — `@app/api`, `@app/client/server`, `@app/db`, `@app/auth`. Access via `process.env.NAME`. Safe to hold secrets. |

A `TURSO_AUTH_TOKEN` or `BETTER_AUTH_SECRET` is server-only — never expose them via `VITE_*`. A `VITE_APP_BASE_URL` is a public origin — fine to ship in the browser bundle.

### Typing `VITE_*` env vars

Augment `ImportMetaEnv` so every `import.meta.env.VITE_NAME` reference is typed (not `string | boolean | undefined`):

```ts
// packages/client/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Every new `VITE_*` variable should be added here when it's introduced.

## Fail fast on missing required vars

Throw at module load if a required var is absent:

```ts
// ✅ Do
const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("TURSO_DATABASE_URL is required");
```

Don't silently default secrets to an empty string and let the request fail later.

For numeric vars, use `@app/shared/parse`:

```ts
import { parseNumber } from "@app/shared/parse";
const port = parseNumber(process.env.PORT_API ?? "3002");
```

## Root scripts

```bash
bun run env:set NAME value   # set a value (auto-encrypts if -f points at encrypted file)
bun run env:get NAME         # read a value
bun run env:ls               # list keys
bun run env:keypair          # generate .env.keys (one-time per env)
bun run env:encrypt -f FILE  # encrypt all plaintext values in a file
bun run env:decrypt -f FILE  # round-trip back to plaintext (locally only)
```

## Common pitfalls

- **Don't `import "@dotenvx/dotenvx/config"` from app code.** The CLI wrapper (`dotenvx run -f ...`) already injected `process.env` before your process started. Importing at runtime is redundant and obscures the load order.
- **Don't commit `.env` or `.env.keys`.** `.gitignore` blocks both — keep it that way.
- **Don't read `.env*` from a Claude tool call.** `.claude/settings.json` denies all `Read(.env*)` / `Edit(.env*)` / `Bash(cat .env*)` patterns. Edit env files yourself.
- **Don't put secrets behind `VITE_*`.** Anything with that prefix lands in the browser bundle. The `VITE_*` namespace is for public config (app name, public API URLs).
