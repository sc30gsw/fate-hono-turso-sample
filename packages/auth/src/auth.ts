import { authSchema, db } from "@app/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is required");
}

const trustedOriginsRaw = process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? process.env.VITE_APP_BASE_URL;
const trustedOrigins =
  trustedOriginsRaw
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

if (trustedOrigins.length === 0) {
  throw new Error("BETTER_AUTH_TRUSTED_ORIGINS (or VITE_APP_BASE_URL as fallback) is required");
}

//? Single shared Better Auth instance.
//? @app/api mounts `auth.handler` at /api/auth/*.
//? @app/client/server reads `auth.api.getSession({ headers })` from the fate context.
//? Both processes hit the same `db` so session validation works cross-process.
export const auth = betterAuth({
  secret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 15 * 24 * 60 * 60,
    },
  },
  telemetry: { enabled: false },
  trustedOrigins,
});

export type Auth = typeof auth;
