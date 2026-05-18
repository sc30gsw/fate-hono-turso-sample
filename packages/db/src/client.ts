import { resolve } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as authSchema from "./auth-schema";
import { resolveDbUrl } from "./resolve-db-url";
import * as domainSchema from "./schema";

const monorepoRoot = resolve(import.meta.dirname, "../../..");
const url = resolveDbUrl(process.env.TURSO_DATABASE_URL, monorepoRoot);

const schema = { ...authSchema, ...domainSchema };

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
