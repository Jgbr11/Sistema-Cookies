import { PrismaClient } from "@prisma/client"

/**
 * Singleton do Prisma Client para Next.js com Prisma 7.
 *
 * No Prisma 7, quando o schema não define a URL diretamente no datasource
 * (porque usamos prisma.config.ts), é necessário passar a URL via construtor.
 *
 * Para Supabase + Vercel:
 *  - DATABASE_URL: connection pooling (Transaction mode, porta 6543)
 *  - DIRECT_URL: conexão direta (para migrations, porta 5432)
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error(
      "DATABASE_URL não está definida no arquivo .env. " +
      "Configure a variável com a connection string do Supabase."
    )
  }

  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === "development"
      ? ["warn", "error"]
      : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
