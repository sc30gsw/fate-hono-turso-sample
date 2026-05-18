# No `index.ts` / `index.tsx`

> Also enforced by PostToolUse hook in `.claude/settings.json`.

## Rule

**Every source file in `packages/*/src/**`, `packages/*/server/**`, and `scripts/**` must have a named filename.** `index.ts` and `index.tsx` are banned.

```
// ✅ Do
packages/api/src/api.ts
packages/api/src/modules/auth/auth.ts
packages/api/src/modules/health/health.ts
packages/client/server/server.ts
packages/client/src/routes/home.tsx
packages/db/src/db.ts
packages/auth/src/auth.ts

// ❌ Don't
packages/api/src/index.ts
packages/api/src/modules/auth/index.ts
packages/client/server/index.ts
packages/db/src/index.ts
packages/client/src/routes/index.tsx
```

The Vite entry `packages/client/index.html` is exempt — that's an HTML file, not a TS module, and Vite requires the name.

## Why

- **Tab titles in editors stop being a row of "index, index, index"** — every open file announces what it contains.
- **`Goto File` searches return signal, not noise** — typing "auth" jumps to `auth.ts`, not to one of nine `index.ts` candidates.
- **Stack traces are self-explanatory** — `at @app/api/src/modules/auth/auth.ts:42` tells you the feature without inspecting the path.
- **Package `exports` map stays explicit** — `"./auth": "./src/auth.ts"` reads better than `"./auth": "./src/auth/index.ts"`.

## How exports work without `index.ts`

`package.json` `exports` map points to the named file directly:

```jsonc
// packages/auth/package.json
{
  "exports": {
    ".": "./src/auth.ts"          // import { auth } from "@app/auth";
  }
}

// packages/db/package.json
{
  "exports": {
    ".": "./src/db.ts",            // import { db, posts } from "@app/db";
    "./schema": "./src/schema.ts",
    "./auth-schema": "./src/auth-schema.ts",
    "./client": "./src/client.ts"
  }
}
```

Consumers see no difference; only the file on disk changes.

## Hono modules

Each Hono module is `modules/<feature>/<feature>.ts` exporting the chained `new Hono()` instance as the default export. Sibling files use named exports.

```
packages/api/src/modules/auth/
├── auth.ts        // export default new Hono()...
├── service.ts     // export abstract class Auth { ... }
└── model.ts       // export const AuthModel = { ... }
```

The vite-plus `no-default-export` rule has an override targeting `src/modules/**/!(service|model).ts` so only the entry file (matching the feature name) may default-export.

## Routes

TanStack Router file-based routing would normally produce `index.tsx` for the `/` route. We use code-based routing instead so the file can be named `home.tsx` (mapped to `path: "/"` in `router.tsx`). If we adopt file-based routing later, configure the router plugin so the "/" route resolves from a named file, not `index.tsx`.

## What to do when migrating an `index.ts`

1. Rename `path/to/index.ts` → `path/to/<feature>.ts` (where `<feature>` matches the parent folder name).
2. Update the package's `exports` map (or any import that ended in `/`).
3. Run `bun --filter @app/<pkg> check` to surface stale relative imports.

## Related rules

- [`hono-best-practices.md`](../hono-best-practices.md) — module folder layout and default-export rules.
- [`project-structure.md`](./project-structure.md) — feature folder conventions.
