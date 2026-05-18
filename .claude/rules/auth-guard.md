# Auth Guard (Better Auth + TanStack Router)

Authoritative sources:
- [TanStack Router — Authenticated Routes](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)
- [Better Auth — React client](https://www.better-auth.com/docs/integrations/react)

This project gates the UI with a **pathless layout route** (`_authenticated`) whose `beforeLoad` consults Better Auth and either lets the request through or throws `redirect()`.

## Where the auth boundary lives

```
RootRoute
├─ _authenticated (pathless, beforeLoad guard)   ← every protected page is a child
│   ├─ HomeRoute     "/"
│   ├─ LiveRoute     "/live"
│   ├─ PostsRoute    "/posts/$id"
│   └─ NewRoute      "/new"
├─ SignInRoute       "/auth/sign-in"             ← public, captures ?redirect=
└─ SignUpRoute       "/auth/sign-up"             ← public, captures ?redirect=
```

Each new "should this require sign-in?" decision becomes "what parent does this route attach to?" — protected pages get `getParentRoute: () => AuthenticatedRoute`; public pages get `() => RootRoute`. No per-route boilerplate, no `useEffect` redirects, no flashing content.

## The auth guard route

```tsx
// packages/client/src/routes/authenticated.tsx
import { createRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";
import { Route as RootRoute } from "~/routes/root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  id: "_authenticated",                          // leading `_` = pathless layout
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession();
    if (!data?.session) {
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: location.href },     // round-trip target
      });
    }
  },
  component: () => <Outlet />,
});
```

`beforeLoad` is the canonical TanStack Router guard hook — it runs before any child route loads, and throwing `redirect()` short-circuits the whole subtree. Per the official guide: *"the `beforeLoad` function for a route is called before any of its child routes' `beforeLoad` functions"* and *"if you throw an error in `beforeLoad`, none of its children will attempt to load"*.

## Honoring `?redirect=` after sign-in

The search-param shape is shared between `/auth/sign-in` and `/auth/sign-up`, so it lives in one schema file:

```ts
// features/auth/schemas/search-params/auth-serarch-schema.ts
import * as v from "valibot";

export const defaultAuthSearchParams = {
  redirect: undefined,
} as const satisfies Record<string, undefined | string>;

export const authSearchSchema = v.object({
  redirect: v.optional(v.string()),
});
```

Both auth routes plug it in with `valibotValidator` (from `@tanstack/valibot-adapter`) and `stripSearchParams` (from `@tanstack/react-router`):

```tsx
// routes/sign-in.tsx
import { createRoute, Link, stripSearchParams } from "@tanstack/react-router";
import { valibotValidator } from "@tanstack/valibot-adapter";

import { SignInForm } from "~/features/auth/components/sign-in-form";
import {
  authSearchSchema,
  defaultAuthSearchParams,
} from "~/features/auth/schemas/search-params/auth-serarch-schema";
import { Route as RootRoute } from "~/routes/root";

function SignInPage() {
  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <SignInForm />
      {/* link to /auth/sign-up */}
    </section>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/auth/sign-in",
  component: SignInPage,
  validateSearch: valibotValidator(authSearchSchema),
  search: {
    //? Strip params whose value equals the default so the URL stays clean
    //? (no `?redirect=` when nothing was captured).
    middlewares: [stripSearchParams(defaultAuthSearchParams)],
  },
});
```

The form component reads `navigate` + `search` via the route's typed API instead of a global `useNavigate()`:

```tsx
// features/auth/components/sign-in-form.tsx
import { getRouteApi } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";

import { defaultSignInValues, signInSchema } from "~/features/auth/schemas/sign-in-schema";
import { signIn } from "~/lib/auth-client";

const routeApi = getRouteApi("/auth/sign-in");

export function SignInForm() {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();    // typed via validateSearch

  const form = useForm({
    defaultValues: defaultSignInValues,
    validators: { onChange: signInSchema },
    onSubmit: async ({ value, formApi }) => {
      // see form-pattern.md
      const result = await signIn.email(value);
      if (result.error) { /* formApi.setErrorMap(...) */ return; }
      await navigate({ to: search.redirect ?? "/" });
    },
  });

  return <form>...</form>;
}
```

Sign-up mirrors this — same schema, same adapter, same middleware.

## `createAuthClient` requires an absolute URL — source it from an env var

Better Auth's React client feeds `baseURL` to `new URL(...)` at module load. Relative strings throw `BetterAuthError: Invalid base URL`. We resolve the origin from a typed env var instead of `window.location.origin` so each environment is explicit and verified at boot.

```ts
// packages/client/src/lib/auth-client.ts
const appBaseUrl = import.meta.env.VITE_APP_BASE_URL;
if (!appBaseUrl) {
  throw new Error("VITE_APP_BASE_URL is required");
}

export const authClient = createAuthClient({ baseURL: `${appBaseUrl}/api/auth` });
```

```ts
// packages/client/src/vite-env.d.ts — augment ImportMetaEnv so the value is typed.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Set the value once per environment:

```bash
bun run env:set VITE_APP_BASE_URL "http://localhost:5173"
# production:
bun run env:set VITE_APP_BASE_URL "https://app.example.com" -f .env.production
```

The Vite proxy (see `packages/client/vite.config.ts`) maps `/api/*` → `:3002`, so cookies stay same-origin and `SameSite=Lax` works regardless of which origin you point at.

## Rules

### DO

- **Place `beforeLoad` on a pathless layout route, not on individual routes.** A single guard covers every child — no risk of forgetting one when adding a new page.
- **Use `throw redirect({ to, search })` to bounce unauthenticated visits.** Capture the original `location.href` in `?redirect=` so the user lands where they wanted after signing in.
- **Validate search params with `valibotValidator(schema)` from `@tanstack/valibot-adapter`.** Don't pass raw schemas or hand-rolled functions.
- **Strip default search-param values with `stripSearchParams(defaults)`** so the URL doesn't carry useless `?redirect=` cruft.
- **Read `navigate` / `search` from `getRouteApi("/path").useNavigate() / useSearch()`** inside form components instead of the global `useNavigate()`. The typed route API keeps the search shape inferred.
- **Share search-param schemas across related routes** (e.g. `auth-serarch-schema.ts` covers sign-in and sign-up).
- **Read session via `authClient.getSession()` inside `beforeLoad` — not `useSession()`.** Hooks can't run there. Better Auth caches sessions, so the call is cheap.
- **Keep sign-in and sign-up routes as direct children of `RootRoute`** so they remain reachable when unauthenticated.
- **Set `createAuthClient({ baseURL })` from `import.meta.env.VITE_APP_BASE_URL`** (typed in `vite-env.d.ts`). Throw at module load if it's missing — that matches the fail-fast env rule in `common/dotenvx.md`.

### DON'T

- **Don't write per-route `beforeLoad` guards** when you have more than one or two protected routes. The pathless layout pattern scales; one-off guards drift out of sync.
- **Don't gate the UI with `useEffect(() => { if (!session) navigate(...) })` in components.** That flashes the protected page for one frame and ships a worse UX. `beforeLoad` redirects before the component mounts.
- **Don't rely on the route guard alone for security.** Per the TanStack docs: *"A route guard does not protect a server function."* The fate server and `@app/api` must do their own session checks (see `fate-best-practices.md` and `hono-best-practices.md`).
- **Don't pass a relative URL to `createAuthClient`.** It throws at module load. Use the env var (`import.meta.env.VITE_APP_BASE_URL`), not `window.location.origin` — relying on origin sniffing means dev and prod silently agree to whatever browser the test runs in.
- **Don't navigate manually inside `beforeLoad`** (e.g. via `useNavigate` — which you can't anyway). Always `throw redirect(...)`.

## Future: server-side session in fate's `context`

When the fate server (`@app/client/server/fate.ts`) is implemented, the same Better Auth instance from `@app/auth` reads the cookie:

```ts
import { auth } from "@app/auth";

createFateServer({
  context: async ({ adapterContext }) => {
    const session = await auth.api.getSession({ headers: adapterContext.req.raw.headers });
    return { sessionUser: session?.user };
  },
  // ...
});
```

Cookies set at sign-in flow through to `/fate` because the Vite proxy keeps everything same-origin. fate views then filter rows by `ctx.sessionUser.id` (see `fate-best-practices.md`).

## Related rules

- [`form-pattern.md`](./typescript/form-pattern.md) — TanStack Form + valibot for the sign-in / sign-up UI.
- [`fate-best-practices.md`](./fate-best-practices.md) — view-level authorization via fate's `context`.
- [`hono-best-practices.md`](./hono-best-practices.md) — Better Auth handler mount + per-route `auth.api.getSession()`.
