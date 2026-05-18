import { parseNumber } from "@app/shared/parse";
import { createHonoFateHandler } from "@nkzw/fate/server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { fate } from "~/fate";
import { authRoutes } from "~/features/auth/routes";

const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173").split(",");

const fateHandler = createHonoFateHandler(fate);

const app = new Hono()
  .use("*", cors({ credentials: true, origin: allowedOrigins }))
  .route("/api/auth", authRoutes)
  .all("/fate/*", (c) => fateHandler(c));

export default {
  fetch: app.fetch,
  port: parseNumber(process.env.PORT_API ?? "3002"),
};
