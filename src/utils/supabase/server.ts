import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

/**
 * Cria o cliente Supabase para uso em Server Components e Route Handlers.
 * Nota: o sistema usa Prisma como ORM principal. Este cliente é mantido
 * como utilitário auxiliar (ex: storage, realtime, funções edge).
 */
export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Chamado de um Server Component — pode ser ignorado
          // se houver middleware/proxy renovando a sessão.
        }
      },
    },
  })
}
