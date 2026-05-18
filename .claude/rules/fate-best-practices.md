# fate Best Practices

Authoritative sources:
- [fate.technology — Introducing fate 1.0](https://fate.technology/posts/fate-1.0)
- [fate.technology — Server Integration](https://fate.technology/guide/server-integration)
- [fate.technology — Views](https://fate.technology/guide/views)
- [nkzw-tech/fate](https://github.com/nkzw-tech/fate)

This document captures the rules we follow when using `react-fate` / `@nkzw/fate` in this monorepo. Treat it as the project-local complement to the official docs.

## Mental Model

fate is **not** a request cache. It is a **normalized object cache** with **data masking** and **co-located data requirements** (analogous to Relay fragments over GraphQL). Components declare which fields they need; fate fetches the minimum superset for a screen and resolves each component's view against shared, normalized objects keyed by `__typename:id`.

If you find yourself reasoning about "the request" or "this endpoint's response shape," step back. In fate you reason about **views** (what a component needs) and **roots** (what a screen wires up).

## Views

### Define one view per logical surface

```ts
import { view } from 'react-fate';

export const PostView = view<Post>()({
  content: true,
  id: true,
  title: true,
});
```

Name views `<Entity>View` for the canonical shape, `<Entity><Variant>View` for variants used in specific surfaces. Example: `PostView`, `PostListItemView`, `PostDetailView`, `UserStatsView`.

### Compose by spread and nesting

```ts
export const UserView = view<User>()({
  id: true,
  name: true,
  profilePicture: true,
});

export const PostView = view<Post>()({
  author: UserView,                     // nest: pass another view
  content: true,
  id: true,
  title: true,
});

export const PostDetailView = view<Post>()({
  ...PostView,                          // spread: extend
  comments: { args: { first: 10 }, items: { node: CommentView } },
});
```

**DO** factor shared selections into reusable views. **DON'T** inline field lists inside a component when the same fields appear elsewhere — that creates duplication and overfetching.

### Use `ViewRef<'Type'>` as the inter-component contract

```ts
type Props = { post: ViewRef<'Post'> };

export function PostCard({ post }: Props) {
  const data = useView(PostView, post);  // resolved here
  return <article>{data.title}</article>;
}
```

The parent screen requests `PostView` (or any view containing it) via `useRequest`, then passes the resulting ref. Children resolve their own view. This is fate's "fragment-as-prop" pattern.

A `ViewRef` only resolves against views that the screen actually asked for. Trying to resolve a view that wasn't in the request throws at runtime — the type system enforces it at compile time.

### Data masking is not optional

Unselected fields are `undefined` even if present in the underlying object. **Do not** widen the type by reading off the raw cache. If a component needs a new field, add it to the view that component uses (or a view it spreads).

## Data Fetching

### Place `useRequest` at the screen root

```ts
export function HomeScreen() {
  const { posts } = useRequest({ posts: { list: PostListItemView } });
  return posts.map((post) => <PostCard key={post.id} post={post} />);
}
```

One `useRequest` per screen. Children get refs and resolve their own views. Avoid scattering `useRequest` calls deep in the tree — it defeats fate's deduplication and creates waterfalls.

### Cache modes

| Mode | When to use |
|---|---|
| `cache-first` (default) | Normal navigation; data probably hasn't changed |
| `stale-while-revalidate` | Show fast, refresh quietly (lists that change often) |
| `network-only` | After a write that must reflect server truth |

```ts
const { posts } = useRequest(
  { posts: { list: PostListItemView } },
  { mode: 'stale-while-revalidate' },
);
```

### Use the right hook for the shape

- `useView(view, ref)` — resolve a single ref
- `useRequest(query, options)` — start a screen-level fetch
- `useListView(connection, list)` — paginate a connection
- `useLiveView(view, ref)` — subscribe to live updates via SSE
- `useLiveListView(connection, list)` — live paginated connection
- `useActionState(fate.actions.<entity>.<action>, null)` — run a mutation

### Wrap fate consumers in `<Suspense>` and an error boundary

fate uses async React. A screen without a Suspense boundary will throw. An error boundary is mandatory for graceful failure.

## Mutations

```ts
import { useActionState } from 'react';
import { useFateClient } from 'react-fate';

export function LikeButton({ post }: { post: { id: string; likes: number } }) {
  const fate = useFateClient();
  const [result, like] = useActionState(fate.actions.post.like, null);

  return (
    <button
      onClick={() =>
        like({
          input: { id: post.id },
          optimistic: { likes: post.likes + 1 },
        })
      }
    >
      {result?.error ? 'Oops!' : 'Like'}
    </button>
  );
}
```

**DO** pass `optimistic` for instant feedback. fate replaces with server truth on success and rolls back on failure — **don't** revert manually.

**DON'T** wrap mutation results in `better-result`. fate's action result carries its own `{ error, data }` shape; let the error boundary handle thrown errors and check `result?.error` for handled failures.

## Drizzle Integration

```ts
// @app/client/server/fate.ts (referenced by the Vite plugin)
import { createFateServer } from '@nkzw/fate/server';
import { createDrizzleFate } from '@nkzw/fate/server/drizzle';
import { db, schema } from '@app/db';
import { Root } from './roots';

const { procedure, sources, live } = createDrizzleFate({
  db,
  schema,
  views: Root,
});

export const fate = createFateServer({
  roots: Root,
  sources,
  procedure,
  live,
});
```

### View definitions are your authorization surface

`createDrizzleFate` walks the views you pass in to decide what to expose. **Whatever you don't put in a view is not reachable from the client.** That makes views the de-facto allowlist for column-level exposure. Treat them accordingly:

- Sensitive columns (password hashes, API tokens, internal flags) must not appear in any view
- Add a code review checklist item: "did this PR add a field to a view that should be private?"

### Tune `nestedPaginationConcurrency` deliberately

```ts
createDrizzleFate({
  db,
  schema,
  views: Root,
  nestedPaginationConcurrency: 5,   // tune for your DB
});
```

The default is fine for libSQL on Turso edge. If you see thundering-herd queries, drop the concurrency.

## HTTP Transport (Project-Specific)

The only first-party HTTP adapter shipped today is `createHonoFateHandler`. In this repo we host it on `Bun.serve`:

```ts
// @app/client/server/index.ts
import { Hono } from 'hono';
import { createHonoFateHandler } from '@nkzw/fate/server';
import { fate } from './fate';

const app = new Hono();
const handler = createHonoFateHandler(fate);
app.post('/fate', handler);
app.post('/fate/live', handler);   // SSE

Bun.serve({ port: 3001, fetch: app.fetch });
```

The Vite plugin handles client-side wiring:

```ts
// @app/client/vite.config.ts
import { fate } from 'react-fate/vite';

export default defineConfig({
  plugins: [
    fate({
      module: './server/fate.ts',
      transport: 'native',
    }),
  ],
});
```

The Vite dev server proxies `/fate` and `/fate/live` to `:3001`, so the browser uses same-origin URLs.

**DON'T** mount fate routes inside `@app/api` (Hono). The two stacks stay independent. If you need an admin endpoint that triggers a fate mutation server-side, call the action directly via the fate server export — don't HTTP-hop.

## Project Boundaries

| Concern | Use | Don't use |
|---|---|---|
| Field selection | fate views | valibot schemas |
| Form input validation | valibot | fate views |
| Client error handling at I/O boundaries | `better-result` | fate's action result |
| fate action error | `result?.error` + error boundary | `better-result` wrappers |
| Authorization at the data layer | view membership | runtime filters in components |

## When fate Is The Wrong Tool

fate excels at normalized entity graphs (posts, users, comments) where many components need overlapping slices. It's a poor fit for:

- One-off REST endpoints that don't fit the entity model (health checks, file uploads, OAuth callbacks) — use `@app/api` (Hono) instead and call from the client via `misina`
- Streaming binary data
- Webhooks (no UI — write a plain Hono route)

When you reach for fate for one of these, you're doing it wrong. Reach for `@app/api` instead.
