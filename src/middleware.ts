import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Middleware de proteção de rotas.
 * Redireciona para /login se não autenticado.
 * Permite acesso livre a /login e /api/auth/*.
 */
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/login"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  const isAuthApi = pathname.startsWith("/api/auth")

  // Se já está logado e tenta acessar login, redireciona para home
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Se não está logado e tenta acessar rota protegida
  if (!isLoggedIn && !isPublicRoute && !isAuthApi) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
