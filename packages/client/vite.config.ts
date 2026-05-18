import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { fate } from "react-fate/vite";
import { defineConfig } from "vite-plus";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  fmt: {
    ignorePatterns: ["dist/**", "**/dist/**", ".fate/**"],
    sortImports: { partitionByComment: true },
    sortPackageJson: { sortScripts: true },
    sortTailwindcss: { functions: ["cn"] },
  },
  lint: {
    categories: { correctness: "error" },
    env: { browser: true, node: true },
    ignorePatterns: ["dist/**", "**/dist/**", ".fate/**"],
    options: {
      denyWarnings: true,
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ["src/routes/**/*.tsx", "*.config.ts"],
        rules: { "no-default-export": "off" },
      },
    ],
    plugins: ["react", "react-perf", "import", "jsx-a11y", "promise"],
    rules: { "no-default-export": "error" },
  },
  staged: {
    "*.{js,jsx,ts,tsx,json,css}": "vp check --fix",
  },
  plugins: [
    //? Explicit list of workspace tsconfigs so `~/*` resolves correctly inside
    //? cross-workspace imports (e.g. @app/db's `db.ts` loaded from @app/client via
    //? the fate Vite plugin's SSR runner). vite-plus's built-in
    //? `resolve.tsconfigPaths` only sees the consumer's tsconfig — we need to
    //? enumerate the consumed packages too.
    tsconfigPaths({
      projects: [
        "./tsconfig.json",
        "../api/tsconfig.json",
        "../auth/tsconfig.json",
        "../db/tsconfig.json",
        "../shared/tsconfig.json",
      ],
    }),
    //? Reads the fate server module (now colocated with the API in @app/api) to
    //? generate typed client roots/mutations. Native transport hits /fate via the
    //? Vite proxy → :3002 (the single Hono process hosts auth, health, and fate).
    //? See .claude/rules/fate-best-practices.md (HTTP Transport).
    fate({ module: "../api/src/modules/fate/fate.ts", transport: "native" }),
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: { tsconfigPaths: true },
  server: {
    port: 5173,
    //? Single Hono backend on :3002 hosts /api/* and /fate/* — proxy both there.
    proxy: {
      "/api": "http://localhost:3002",
      "/fate": "http://localhost:3002",
    },
  },
});
