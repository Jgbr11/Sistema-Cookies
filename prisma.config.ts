// Configuração do Prisma 7 com suporte a Supabase.
// DATABASE_URL = pooled connection (PgBouncer) — porta 6543
// DIRECT_URL   = direct connection — porta 5432 (para migrations)
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
})
