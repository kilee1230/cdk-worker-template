import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "cdk.out/",
        "lib/",
        "src/",
        "scripts/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/infra/app.ts",
      ],
    },
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "cdk.out", "lib"],
  },
});
