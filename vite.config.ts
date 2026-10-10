/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/component/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
    ],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        "src/core/**": {
          statements: 85,
          branches: 75,
          functions: 85,
          lines: 85,
        },
        "src/features/**": {
          statements: 80,
          branches: 75,
          functions: 75,
          lines: 80,
        },
        "src/shared/**": {
          statements: 80,
          branches: 75,
          functions: 75,
          lines: 80,
        },
        "src/store/**": {
          statements: 85,
          branches: 75,
          functions: 85,
          lines: 85,
        },
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});