import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

/**
 * Configuração do NextAuth v5 (Auth.js) com Credentials Provider.
 * Autenticação simples com email/senha para login único de administrador.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          return null
        }

        const email = credentials.email as string
        const senha = credentials.senha as string

        const usuario = await prisma.usuario.findUnique({
          where: { email },
        })

        if (!usuario) {
          return null
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash)

        if (!senhaCorreta) {
          return null
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
