# Hono Best Practices

Authoritative source:
- [hono.dev — Best Practices](https://hono.dev/docs/guides/best-practices)
- [hono.dev — RPC](https://hono.dev/docs/guides/rpc)
- [hono.dev — Bun setup](https://hono.dev/docs/getting-started/bun)

This file applies inside `packages/api/` and `packages/client/server/` (the fate HTTP transport). Hono is intentionally flexible; we adopt the official guidance and add a few project-specific rules.

## Running on Bun: default-export `{ fetch, port }`

Bun auto-serves any module that `default export`s an object with a `fetch` handler. **Do not call `Bun.serve()` directly** — let Bun start the server from the export.

```ts
// ✅ Canonical Bun + Hono entry
import { Hono } from "hono";

const app = new Hono().get("/", (c) => c.text("Hello Bun!"));

export type AppType = typeof app;

export default {
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 3000),
};
```

```ts
// ❌ Don't — drops Hono's idiom and Bun's auto-restart hooks
Bun.serve({ fetch: app.fetch, port: 3000 });
```

This is the only place in the project where `export default` is allowed outside `src/routes/*` and `*.config.ts`. The lint override + PostToolUse hook are already configured for `packages/api/src/index.ts` and `packages/client/server/index.ts`.

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
├── index.ts                    # composes feature routes
└── modules/
    ├── auth.ts                 # exports a chained Hono instance
    └── health.ts
```

```ts
// modules/health.ts
import { Hono } from "hono";

const app = new Hono()
  .get("/", (c) => c.json({ ok: true, uptime: process.uptime() }));

export default app;
export type HealthApp = typeof app;       // exported for RPC client typing
```

```ts
// index.ts
import { Hono } from "hono";
import auth from "~/modules/auth";
import health from "~/modules/health";

const app = new Hono()
  .basePath("/api")
  .route("/health", health)
  .route("/auth", auth);

export type AppType = typeof app;          // single export for `hc<AppType>()`
```

## Use RPC by chaining

For `hc<AppType>()` client typing to work, **chain every route on `new Hono()`** rather than calling `.get()` separately on a saved reference. Hono's type returned from each chained call accumulates the route shape; breaking the chain drops type info.

```ts
// ✅ RPC-friendly
const app = new Hono()
  .get("/", (c) => c.json("list authors"))
  .post("/", (c) => c.json("create an author", 201))
  .get("/:id", (c) => c.json(`get ${c.req.param("id")}`));

// ❌ Type info lost — hc<AppType> won't see post / get('/:id')
const app = new Hono();
app.get("/", (c) => c.json("list authors"));
app.post("/", (c) => c.json("create an author", 201));
app.get("/:id", (c) => c.json(`get ${c.req.param("id")}`));
```

Export both the runtime app and its type:

```ts
export default app;
export type AppType = typeof app;
```

Client side:

```ts
import { hc } from "hono/client";
import type { AppType } from "@app/api";  // or relative path

const client = hc<AppType>("/api");
```

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

## Validation via `@hono/valibot-validator`

The client already uses `valibot` for forms (see `typescript/valibot-validation.md`). Reuse the schema language on the server:

```ts
import { vValidator } from "@hono/valibot-validator";
import * as v from "valibot";

const SignInBody = v.object({
  password: v.pipe(v.string(), v.minLength(8)),
  username: v.pipe(v.string(), v.minLength(1)),
});

const app = new Hono().post(
  "/sign-in",
  vValidator("json", SignInBody),
  async (c) => {
    const body = c.req.valid("json");    // typed as InferOutput<typeof SignInBody>
    return c.json(await Auth.signIn(body));
  },
);
```

`v.InferOutput<typeof SignInBody>` gives the runtime-aligned type; do not declare a parallel `type` or `interface`.

## Error handling

- Throw `HTTPException` from `hono/http-exception` for expected failures with status codes.
- Use `app.onError()` to translate unhandled errors into a uniform JSON envelope.
- Don't catch broadly inside handlers when you can let `onError` handle it.

```ts
import { HTTPException } from "hono/http-exception";

if (!user) throw new HTTPException(404, { message: "User not found" });
```

In the client (`@app/client`), wrap misina calls in `better-result` patterns at the I/O boundary — see `typescript/better-result.md`. The server's job is to return clean HTTP semantics; the client decides how to map those to Result variants.

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

`app.request()` runs the full Hono lifecycle in-process — no HTTP server needed. Equivalent to Elysia's `app.handle(new Request(...))` if you've worked with that.

## Project Boundaries

| Concern | Use | Don't use |
|---|---|---|
| Server-side request/response validation | `@hono/valibot-validator` + `valibot` | zod, manual checks |
| Client-side form validation | `valibot` (shares schemas where possible) | server-side schemas leak to client |
| Server-side error handling | `throw new HTTPException(code, opts)` + `app.onError` | `better-result` |
| Client-side I/O error handling | `better-result` | `throw` |
| DB access from `@app/api` | `@app/db` (Drizzle) | raw SQL strings, ad-hoc clients |
| fate routes (`/fate`, `/fate/live`) | `@app/client/server/` (Hono + `createHonoFateHandler`) | `@app/api` |

## Project-Specific Pitfalls

- **Two Hono apps in this monorepo.** `@app/api` exposes `/api/*` on `:3002`. `@app/client/server` exposes `/fate` and `/fate/live` on `:3001` and is dedicated to fate's transport. Don't mix routes across them.
- **`createHonoFateHandler` lives in `@app/client/server` only.** It is the official fate adapter and the *only* reason the fate server uses Hono. Treat it as the integration boundary.
- **No controllers, even in `modules/`.** A module's `index.ts` (or single-file `<feature>.ts`) is just a chained `new Hono()` instance. Resist the urge to extract a `Controller` class — it kills RPC inference.
- **One `AppType` export per Hono app.** `@app/api/src/index.ts` exports `AppType`. If we add an RPC client in `@app/client`, it imports that type and runs `hc<AppType>("/api")`. Don't break the chain or types fall apart silently.
