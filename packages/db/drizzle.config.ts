import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

import { resolveDbUrl } from "./src/resolve-db-url";

const here = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(here, "../..");

export default defineConfig({
  dialect: "turso",
  schema: ["./src/schema.ts", "./src/auth-schema.ts"],
  out: "./drizzle",
  dbCredentials: {
    url: resolveDbUrl(process.env.TURSO_DATABASE_URL, monorepoRoot),
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
