import { defineConfig } from "vite-plus";

//? Drizzle schema package. No Vite plugins; fmt + lint + test from vite-plus only.
//? drizzle-kit scripts (db:push / db:generate / db:studio) run outside vp.
export default defineConfig({
  fmt: {
    ignorePatterns: ["dist/**", "**/dist/**", "drizzle/**"],
    sortImports: { partitionByComment: true },
    sortPackageJson: { sortScripts: true },
  },
  lint: {
    categories: { correctness: "error" },
    env: { node: true },
    ignorePatterns: ["dist/**", "**/dist/**", "drizzle/**"],
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
