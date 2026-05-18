import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

const here = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(here, "../..");

function resolveDbUrl(raw: `libsql://${string}.aws-ap-northeast-1.turso.io` | undefined) {
  const fallback = `file:${resolve(monorepoRoot, "dev.db")}`;

  if (!raw) {
    return fallback;
  }

  if (raw.startsWith("file:./") || raw.startsWith("file:../")) {
    return `file:${resolve(monorepoRoot, raw.slice("file:".length))}`;
  }

  return raw;
}

export default defineConfig({
  dialect: "turso",
  schema: ["./src/schema.ts", "./src/auth-schema.ts"],
  out: "./drizzle",
  dbCredentials: {
    url: resolveDbUrl(process.env.TURSO_DATABASE_URL as Parameters<typeof resolveDbUrl>[0]),
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
