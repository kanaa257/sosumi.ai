import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
      },
    },
    // Handle CommonJS modules properly
    deps: {
      optimizer: {
        ssr: {
          exclude: ["ajv", "@modelcontextprotocol/sdk"],
        },
      },
    },
  },
})
