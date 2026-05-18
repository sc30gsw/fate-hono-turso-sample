import { parseNumber } from "@app/shared/parse";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { authRoutes } from "./modules/auth/auth";
import { health } from "./modules/health/health";

const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173").split(",");

const app = new Hono()
  .use(
    "*",
    cors({
      credentials: true,
      origin: allowedOrigins,
    }),
  )
  .basePath("/api")
  .route("/auth", authRoutes)
  .route("/health", health);

export type AppType = typeof app;

export default {
  fetch: app.fetch,
  port: parseNumber(process.env.PORT_API ?? "3002"),
};
