import { authSchema, db } from "@app/db";
import { requireEnv } from "@app/shared/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const secret = requireEnv("BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET);

const trustedOriginsRaw = process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? process.env.VITE_APP_BASE_URL;
const trustedOrigins =
  trustedOriginsRaw
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

if (trustedOrigins.length === 0) {
  throw new Error("BETTER_AUTH_TRUSTED_ORIGINS (or VITE_APP_BASE_URL as fallback) is required");
}

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
