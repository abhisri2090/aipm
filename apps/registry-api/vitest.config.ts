import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ensureSchema migrations deadlock when multiple DB test files run in parallel
    fileParallelism: false,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
