import { auth } from "@app/auth";
import { Hono } from "hono";

//? Better Auth ships its own router; we delegate every /api/auth/* call to it.
//? Pattern from https://www.better-auth.com/docs/integrations/hono
export const authRoutes = new Hono().on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw));
