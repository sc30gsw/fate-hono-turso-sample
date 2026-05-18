import { resolve } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as authSchema from "./auth-schema";
import * as domainSchema from "./schema";

const monorepoRoot = resolve(import.meta.dirname, "../../..");

function resolveDbUrl(raw: `libsql://${string}.aws-ap-northeast-1.turso.io` | undefined): string {
  if (!raw) {
    throw new Error("TURSO_DATABASE_URL is required");
  }

  if (raw.startsWith("file:./") || raw.startsWith("file:../")) {
    return `file:${resolve(monorepoRoot, raw.slice("file:".length))}`;
  }

  return raw;
}

const url = resolveDbUrl(process.env.TURSO_DATABASE_URL as Parameters<typeof resolveDbUrl>[0]);

//? Combine schemas so Better Auth's adapter and our domain queries share the same instance.
//? Splitting them across two `drizzle()` calls would break Better Auth's `drizzleAdapter`
//? schema-lookup-by-name.
const schema = { ...authSchema, ...domainSchema };

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
