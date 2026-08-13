import { defineConfig } from "prisma/config"
import "dotenv/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "pnpm prisma:seed",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})