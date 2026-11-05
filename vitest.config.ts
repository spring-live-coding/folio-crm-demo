import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname } },
  test: {
    execArgv: ["--no-experimental-webstorage"],
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
