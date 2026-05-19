"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Cookie, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Página de login com branding de cookies artesanais.
 * Fundo azul marinho (#0a0a50) com card centralizado em creme.
 */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setCarregando(true)

    try {
      const result = await signIn("credentials", {
        email,
        senha,
        redirect: false,
      })

      if (result?.error) {
        setErro("Email ou senha incorretos")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setErro("Erro ao fazer login. Tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a50] p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#644536]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#eff7cf]/10 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-[#eff7cf] border-[#644536]/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Logo / Brand */}
          <div className="mx-auto w-16 h-16 rounded-full bg-[#0a0a50] flex items-center justify-center shadow-lg">
            <Cookie className="w-9 h-9 text-[#eff7cf]" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-[#0a0a50]">
              Sistema Cookies
            </CardTitle>
            <CardDescription className="text-[#644536] mt-1">
              Gerenciamento de Cookies Artesanais
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#0a0a50] font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cookies.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/80 border-[#644536]/30 focus:border-[#0a0a50] focus:ring-[#0a0a50] text-[#1a1a2e] placeholder:text-[#644536]/50"
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-[#0a0a50] font-medium">
                Senha
              </Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="bg-white/80 border-[#644536]/30 focus:border-[#0a0a50] focus:ring-[#0a0a50] text-[#1a1a2e]"
              />
            </div>

            {/* Erro */}
            {erro && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{erro}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#0a0a50] hover:bg-[#0a0a50]/90 text-[#eff7cf] font-semibold py-5 transition-all duration-200 hover:shadow-lg cursor-pointer"
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-[#644536]/60 mt-6">
            © 2026 Sistema Cookies — Todos os direitos reservados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
