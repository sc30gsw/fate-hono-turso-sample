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
    overrides: [
      {
        //? Hono modules export default (chained `new Hono()` instance) so `app.route()`
        //? can mount them. The Bun entry (src/api.ts) default-exports `{ fetch, port }`
        //? for Bun's auto-server. See .claude/rules/hono-best-practices.md and
        //? .claude/rules/typescript/no-index-files.md.
        files: ["src/api.ts", "src/modules/**/*.ts", "*.config.ts"],
        rules: { "no-default-export": "off" },
      },
    ],
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
