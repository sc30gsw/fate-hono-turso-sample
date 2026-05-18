/// <reference types="vite/client" />

//? Typed extension for our project-specific `VITE_*` env vars.
//? Vite inlines `import.meta.env.VITE_*` into the browser bundle at build time —
//? these values are public, never put secrets here. See .claude/rules/common/dotenvx.md.

interface ImportMetaEnv {
  /**
   * Absolute origin of this client app. Used to build absolute URLs for libraries
   * that don't accept relative ones (Better Auth's `createAuthClient.baseURL`).
   * In dev: `http://localhost:5173`. In prod: the deployed origin.
   */
  readonly VITE_APP_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
