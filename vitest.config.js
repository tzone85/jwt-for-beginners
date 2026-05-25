import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.js"],
    exclude: ["node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
      reporter: ["text", "html"],
      thresholds: { lines: 85, branches: 80, functions: 85, statements: 85 },
    },
  },
});
