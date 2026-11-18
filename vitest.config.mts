import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["test/unit-test/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    reporters: ["default"],
    clearMocks: true,
  },
})
