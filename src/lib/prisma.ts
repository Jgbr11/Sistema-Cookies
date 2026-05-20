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
 *
 * IMPORTANTE: O cliente é criado de forma lazy (somente quando usado pela
 * primeira vez) para que o Next.js consiga fazer o build sem precisar de
 * DATABASE_URL disponível em build time — a variável só é necessária em
 * runtime, nas Vercel Serverless Functions.
 */

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não está definida. Configure a variável de ambiente no Vercel (Settings → Environment Variables) ou no arquivo .env.local para desenvolvimento local."
    )
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

/**
 * Proxy lazy: o PrismaClient real só é criado na primeira chamada de método.
 * Isso evita que o import do Prisma cause erro durante o build do Next.js
 * quando DATABASE_URL ainda não está disponível.
 */
function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    // Em produção, cria uma nova instância por invocação de função serverless
    // (sem singleton global, pois cada função tem seu próprio contexto)
    return createPrismaClient()
  }

  // Em desenvolvimento, usa singleton global para evitar múltiplas conexões
  // com hot-reload do Next.js
  if (!global._prisma) {
    global._prisma = createPrismaClient()
  }
  return global._prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrisma()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})
