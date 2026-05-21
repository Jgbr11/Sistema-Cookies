"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cookie, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItems } from "./nav-items"
import { useState } from "react"

/**
 * Sidebar principal do sistema.
 * - Desktop: fixa à esquerda (260px expandida, 80px colapsada)
 * - Navy (#0a0a50) com texto creme (#eff7cf)
 * - Active state com marrom terroso (#644536)
 * - Design arredondado e artesanal
 */
export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-gradient-to-b from-[#0a0a50] to-[#08083e] text-[#eff7cf] transition-all duration-300 ease-in-out fixed left-0 top-0 z-40",
        collapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-white/10">
        <div className="w-11 h-11 rounded-2xl bg-[#644536] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#644536]/30">
          <Cookie className="w-6 h-6 text-[#eff7cf]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-extrabold whitespace-nowrap tracking-tight">
              Cookies
            </h1>
            <p className="text-[11px] text-[#eff7cf]/50 whitespace-nowrap font-medium">
              Gestão Artesanal
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-[#644536] text-[#eff7cf] shadow-lg shadow-[#644536]/40"
                  : "text-[#eff7cf]/60 hover:bg-white/8 hover:text-[#eff7cf]"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  isActive
                    ? "text-[#eff7cf]"
                    : "text-[#eff7cf]/40 group-hover:text-[#eff7cf] group-hover:scale-110"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-semibold whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[#eff7cf]/40 hover:bg-white/8 hover:text-[#eff7cf] transition-all duration-200 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
