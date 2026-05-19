import { PrismaClient } from "@prisma/client"

/**
 * Singleton do Prisma Client para Next.js.
 * Evita criar múltiplas instâncias em desenvolvimento (hot reload).
 * @see https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
