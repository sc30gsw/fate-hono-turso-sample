import { parseNumber } from "@app/shared/parse";
import { Hono } from "hono";

//? Phase 1 placeholder.
//? Phase 2 replaces this with:
//?   import { createHonoFateHandler } from "@nkzw/fate/server";
//?   import { fate } from "./fate";
//?   const handler = createHonoFateHandler(fate);
//?   app.post("/fate", handler);
//?   app.post("/fate/live", handler);
//?
//? Until then, return 501 so the Vite proxy /fate target is reachable
//? (avoids ECONNREFUSED) and the `dev` concurrently chain stays alive.
const app = new Hono().post("/fate", (c) =>
  c.text("fate server: Phase 1 placeholder. Implement in @app/client/server/fate.ts.", 501),
);

//? Hono + Bun idiom: default-export `{ fetch, port }` so Bun's auto-server starts it.
//? Do not call `Bun.serve` directly — see .claude/rules/hono-best-practices.md.
export const FATE_SERVER = {
  fetch: app.fetch,
  port: parseNumber(process.env.PORT_FATE ?? "3001"),
} as const satisfies { fetch: typeof app.fetch; port: number };
