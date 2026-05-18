import { resolve } from "node:path";

export function resolveDbUrl(raw: string | undefined, monorepoRoot: string, fallback?: string) {
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
