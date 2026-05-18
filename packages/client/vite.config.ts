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
    tsconfigPaths({
      projects: [
        "./tsconfig.json",
        "../api/tsconfig.json",
        "../auth/tsconfig.json",
        "../db/tsconfig.json",
        "../shared/tsconfig.json",
      ],
    }),
    fate({ module: "../api/src/fate.ts", transport: "native" }),
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: { tsconfigPaths: true },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3002",
      "/fate": "http://localhost:3002",
    },
  },
});
