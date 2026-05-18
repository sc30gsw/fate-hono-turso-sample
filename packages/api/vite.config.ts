import { defineConfig } from "vite-plus";

//? Bun + Hono server. No Vite plugins; fmt + lint + test from vite-plus only.
//? Build uses `bun build`, not Vite, since the runtime is Bun (see package.json scripts).
export default defineConfig({
  fmt: {
    ignorePatterns: ["dist/**", "**/dist/**"],
    sortImports: { partitionByComment: true },
    sortPackageJson: { sortScripts: true },
  },
  lint: {
    categories: { correctness: "error" },
    env: { node: true },
    ignorePatterns: ["dist/**", "**/dist/**"],
    options: {
      denyWarnings: true,
      typeAware: true,
      typeCheck: true,
    },
    overrides: [{ files: ["*.config.ts"], rules: { "no-default-export": "off" } }],
    plugins: ["import", "promise"],
    rules: { "no-default-export": "error" },
  },
  staged: {
    "*.{js,ts,json}": "vp check --fix",
  },
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
