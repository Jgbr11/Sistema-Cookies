"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Cookie, LogOut, Bell } from "lucide-react"
import { navItems } from "./nav-items"
import { Button } from "@/components/ui/button"

/**
 * Header superior do dashboard.
 * - Mostra o título da página atual
 * - Botão de notificações e logout
 * - Visível em todas as resoluções
 */
export function Header() {
  const pathname = usePathname()

  const currentItem = navItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  )

  const pageTitle = currentItem?.label ?? "Dashboard"

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border h-16 flex items-center px-4 lg:px-6 gap-4">
      {/* Logo mobile */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#0a0a50] flex items-center justify-center">
          <Cookie className="w-4 h-4 text-[#eff7cf]" />
        </div>
      </div>

      {/* Título da página */}
      <div className="flex-1">
        <h2 className="text-base font-semibold text-foreground lg:text-lg">
          {pageTitle}
        </h2>
      </div>

      {/* Ações do header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
          aria-label="Notificações"
          id="header-notifications-btn"
        >
          <Bell className="w-5 h-5" />
          {/* Badge de notificações — remover quando implementar */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          aria-label="Sair"
          id="header-logout-btn"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
