import { resolve } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as authSchema from "./auth-schema";
import * as domainSchema from "./schema";

function resolveDbUrl(raw: string | undefined, monorepoRoot: string, fallback?: string) {
  if (!raw) {
    if (fallback) {
      return fallback;
    }

    throw new Error("TURSO_DATABASE_URL is required");
  }

  if (raw.startsWith("file:./") || raw.startsWith("file:../")) {
    return `file:${resolve(monorepoRoot, raw.slice("file:".length))}`;
  }

  return raw;
}

const monorepoRoot = resolve(import.meta.dirname, "../../..");
const url = resolveDbUrl(process.env.TURSO_DATABASE_URL, monorepoRoot);

const schema = { ...authSchema, ...domainSchema };

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
