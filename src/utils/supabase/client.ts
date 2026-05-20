import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

/**
 * Cria o cliente Supabase para uso em Client Components.
 * Nota: o sistema usa Prisma como ORM principal via API Routes.
 * Este cliente é mantido como utilitário auxiliar.
 */
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey)
