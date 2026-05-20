"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cookie, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItems } from "./nav-items"
import { useState } from "react"

/**
 * Sidebar principal do sistema.
 * - Desktop: fixa à esquerda (240px expandida, 72px colapsada)
 * - Navy (#0a0a50) com texto creme (#eff7cf)
 * - Active state com marrom terroso (#644536)
 */
export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-[#0a0a50] text-[#eff7cf] transition-all duration-300 ease-in-out fixed left-0 top-0 z-40",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1a1a6a]">
        <div className="w-10 h-10 rounded-full bg-[#644536] flex items-center justify-center flex-shrink-0">
          <Cookie className="w-5 h-5 text-[#eff7cf]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold whitespace-nowrap">
              Cookies
            </h1>
            <p className="text-xs text-[#eff7cf]/60 whitespace-nowrap">
              Gestão Artesanal
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-[#644536] text-[#eff7cf] shadow-md"
                  : "text-[#eff7cf]/70 hover:bg-[#1a1a6a] hover:text-[#eff7cf]"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive
                    ? "text-[#eff7cf]"
                    : "text-[#eff7cf]/50 group-hover:text-[#eff7cf]"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="px-2 py-3 border-t border-[#1a1a6a]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[#eff7cf]/50 hover:bg-[#1a1a6a] hover:text-[#eff7cf] transition-all duration-200 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
