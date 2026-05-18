# Hono Best Practices

Authoritative source:
- [hono.dev — Best Practices](https://hono.dev/docs/guides/best-practices)
- [hono.dev — RPC](https://hono.dev/docs/guides/rpc)
- [hono.dev — Bun setup](https://hono.dev/docs/getting-started/bun)

This file applies inside `packages/api/`. Hono is the HTTP framework that hosts Better Auth's wildcard + fate's transport handler. We adopt official guidance and add a few project-specific rules.

## Running on Bun: default-export `{ fetch, port }`

Bun auto-serves any module that `default export`s an object with a `fetch` handler. **Do not call `Bun.serve()` directly** — let Bun start the server from the export.

```ts
// ✅ Canonical Bun + Hono entry
import { Hono } from "hono";

const app = new Hono().get("/", (c) => c.text("Hello Bun!"));

export default {
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 3000),
};
```

```ts
// ❌ Don't — drops Hono's idiom and Bun's auto-restart hooks
Bun.serve({ fetch: app.fetch, port: 3000 });
```

This is the only place in the project where `export default` is allowed outside `src/routes/*` and `*.config.ts`.

Static assets, when needed, come from `hono/bun`'s `serveStatic` — not by `Bun.serve`'s static option.

## Don't make "Controllers"

Write handlers directly after the path definition. Extracting them into named `(c) => {...}` functions breaks type inference for path params and middleware-set context vars.

```ts
// ✅ Do
app.get("/books/:id", (c) => {
  const id = c.req.param("id");           // inferred as string
  return c.json(`get ${id}`);
});

// ❌ Don't
const bookPermalink = (c: Context) => {
  const id = c.req.param("id");           // path param cannot be inferred
  return c.json(`get ${id}`);
};
app.get("/books/:id", bookPermalink);
```

If you genuinely need a controller (e.g. to attach middleware + handler as a tuple, or to share logic across routes), use `factory.createHandlers()` from `hono/factory` — it preserves inference.

```ts
import { createFactory } from "hono/factory";
import { logger } from "hono/logger";

const factory = createFactory();
const middleware = factory.createMiddleware(async (c, next) => {
  c.set("foo", "bar");
  await next();
});
const handlers = factory.createHandlers(logger(), middleware, (c) => c.json(c.var.foo));

app.get("/api", ...handlers);
```

## Build larger apps with `app.route()`

Don't grow `index.ts`. Split features into route files and mount with `app.route()`.

```
packages/api/src/
├── api.ts                      # entry — composes feature routes
└── modules/
    └── auth/auth.ts            # exports a chained Hono instance
```

```ts
// modules/auth/auth.ts
import { auth } from "@app/auth";
import { Hono } from "hono";

export const authRoutes = new Hono().on(["GET", "POST"], "/*", (c) =>
  auth.handler(c.req.raw),
);
```

```ts
// api.ts
import { Hono } from "hono";
import { authRoutes } from "~/modules/auth/auth";
import { fate } from "~/modules/fate/fate";

const fateHandler = createHonoFateHandler(fate);

const app = new Hono()
  .use("*", cors({ credentials: true, origin: allowedOrigins }))
  .route("/api/auth", authRoutes)
  .all("/fate/*", (c) => fateHandler(c));

export default { fetch: app.fetch, port: 3002 };
```

## Hono RPC (`hc<AppType>`) — not used in this project

Hono's typed RPC client requires an explicit chained route shape on `new Hono()` and exports `AppType = typeof app`. **This project doesn't ship a Hono RPC client.** The reasons:

- fate owns the data layer end-to-end (`/fate/*`) — its own type-safe client (`.fate/client.generated.ts`) is the typed contract.
- Better Auth's `/api/auth/*` is a wildcard (`.on(["GET","POST"], "/*", auth.handler)`) — opaque to RPC anyway.
- No other `/api/*` routes exist.

If you add a typed `/api/*` route later, then re-introduce `AppType` and `hc<AppType>` on the client. Until then, the simple `new Hono().use(...).route(...).all("/fate/*", ...)` shape in `packages/api/src/api.ts` is sufficient.

## HEAD requests

Hono auto-converts `HEAD` to `GET` and strips the body before route matching. **Don't define `.head()` handlers** — they will never fire.

```ts
// ✅ HEAD inherits headers from the matching GET
app.get("/api/users", async (c) => {
  const users = await getUsers();
  c.header("X-Total-Count", users.length.toString());
  return c.json(users);
});

// ❌ Never invoked
app.head("/api/users", (c) => c.text("ignored"));
```

If HEAD needs different behavior, branch inside middleware on `c.req.method === "HEAD"`. To skip expensive body work for HEAD, set `c.res = new Response(null, c.res)` in middleware after `next()`.

## Server-side validation

This project doesn't currently expose typed JSON endpoints (only Better Auth's wildcard + fate's transport), so no Hono-level validator is installed. If you add a typed `/api/*` route later, install a Hono validator that consumes valibot (Standard Schema) and wire it into the new route.

fate validates mutation inputs via the `input?: SchemaLike` field on each `MutationDefinition`, fed by `@app/shared/post-schemas`. valibot 1.x is Standard Schema compatible, so the same schemas work on both ends without an adapter.

## Error handling

- Throw `HTTPException` from `hono/http-exception` for expected failures with status codes.
- Use `app.onError()` to translate unhandled errors into a uniform JSON envelope.
- Don't catch broadly inside handlers when you can let `onError` handle it.

```ts
import { HTTPException } from "hono/http-exception";

if (!user) throw new HTTPException(404, { message: "User not found" });
```

The server's job is to return clean HTTP semantics. The client (`@app/client`) doesn't call this Hono surface directly except via Better Auth's own client (handles its own error envelopes) and fate's transport (which returns `{ error, result }` for mutations).

## Testing

```ts
import { describe, it, expect } from "bun:test";
import app from "./index";

describe("health", () => {
  it("returns ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
```

`app.request()` runs the full Hono lifecycle in-process — no HTTP server needed. Equivalent to Hono's `app.handle(new Request(...))` if you've worked with that.

## Project Boundaries

| Concern | Use | Don't use |
|---|---|---|
| Form / mutation input validation | `valibot` (shared via `@app/shared/post-schemas`) | zod, manual checks |
| Server-side error handling | `throw new HTTPException(code, opts)` from `hono/http-exception` + `app.onError` | ad-hoc envelopes |
| Client-side error handling | fate's `{ error, result }`; let unhandled errors hit the error boundary | wrappers we don't have installed |
| DB access from `@app/api` | `@app/db` (Drizzle) | raw SQL strings, ad-hoc clients |
| fate routes (`/fate/*`) | `packages/api/src/modules/fate/` mounted via `app.all("/fate/*", createHonoFateHandler(fate))` in `api.ts` | a second Hono process |

## Project-Specific Pitfalls

- **One Hono app for the whole backend.** `packages/api/src/api.ts` mounts auth and fate. Adding a new feature = a new `modules/<feature>/` folder + `.route("/api/<feature>", feature)` line. No second process, no separate port.
- **`createHonoFateHandler` is composed with `.all("/fate/*", ...)`** per the official example (`nkzw-tech/fate`, `example/server-drizzle/src/index.tsx`). The wildcard catches both `POST /fate` and `POST /fate/live` — the handler dispatches internally by request body.
- **No controllers, even in `modules/`.** A module's single-file `<feature>.ts` is just a chained `new Hono()` instance — preserves type inference if you ever want to expose typed RPC later.
- **`@app/db`'s barrel uses relative `./` imports, not `~/`.** Cross-workspace loading via the fate Vite plugin SSR runner can't read nested tsconfig paths. The `~/*` alias is intentionally absent from `packages/db/tsconfig.json`.
