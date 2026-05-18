import { parseNumber } from "@app/shared/parse";
import { Hono } from "hono";

//? Phase 2 splits routes into ./modules/<feature>.ts and mounts them via `app.route()`.
//? See .claude/rules/hono-best-practices.md for the module pattern.
const app = new Hono()
  .basePath("/api")
  .get("/", (c) => c.json({ message: "Phase 1 smoke. Modules land in Phase 2.", ok: true }));

//? Hono + Bun idiom: default-export `{ fetch, port }` so Bun's auto-server starts it.
//? Do not call `Bun.serve` directly — see .claude/rules/hono-best-practices.md.
export type AppType = typeof app;
export const API_SERVER = {
  fetch: app.fetch,
  port: parseNumber(process.env.PORT_API ?? "3002"),
} as const satisfies { fetch: typeof app.fetch; port: number };
