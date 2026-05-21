import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"

/**
 * Layout do grupo (dashboard) — envolve todas as páginas autenticadas.
 * - Desktop: sidebar fixa à esquerda + conteúdo com margem
 * - Mobile: header + conteúdo + bottom nav
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — visível apenas em desktop (lg+) */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px] transition-all duration-300">
        <Header />
        <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8">
          {children}
        </main>
        {/* Bottom nav — visível apenas em mobile */}
        <MobileNav />
      </div>
    </div>
  )
}
