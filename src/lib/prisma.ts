import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

/**
 * Singleton do Prisma Client para Next.js com Prisma 7.
 *
 * O Prisma 7 removeu o engine Rust nativo e exige um Driver Adapter.
 * Usamos @prisma/adapter-pg com o Pool do node-postgres (pg).
 *
 * Para Supabase com PgBouncer (Transaction mode), configure:
 *   DATABASE_URL = postgresql://...?pgbouncer=true&connection_limit=1
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não está definida. Configure no arquivo .env.local com a connection string do Supabase."
    )
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
