import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["dist/**", "**/dist/**"],
    sortImports: { partitionByComment: true },
    sortPackageJson: { sortScripts: true },
    sortTailwindcss: { functions: ["cn"] },
  },
  lint: {
    categories: { correctness: "error" },
    env: { browser: true, node: true },
    ignorePatterns: ["dist/**", "**/dist/**"],
    options: {
      denyWarnings: true,
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        //? Bun's auto-server requires `export default { fetch, port }` (server/server.ts).
        //? `src/routes/*` is allowed because some users may want default-exported route
        //? components, although we now use named `Route` exports. `*.config.ts` is the
        //? conventional default-export site.
        files: ["src/routes/**/*.tsx", "server/server.ts", "*.config.ts"],
        rules: { "no-default-export": "off" },
      },
    ],
    plugins: ["react", "react-perf", "import", "jsx-a11y", "promise"],
    rules: { "no-default-export": "error" },
  },
  staged: {
    "*.{js,jsx,ts,tsx,json,css}": "vp check --fix",
  },
  plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: { tsconfigPaths: true },
  server: {
    port: 5173,
    proxy: {
      "/fate": "http://localhost:3001",
      "/api": "http://localhost:3002",
    },
  },
});
