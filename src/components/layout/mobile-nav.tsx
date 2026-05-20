"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navItems } from "./nav-items"

/**
 * Bottom navigation bar para mobile.
 * Exibe os 5 itens com showMobile=true.
 * Fica fixo na parte inferior da tela.
 */
export function MobileNav() {
  const pathname = usePathname()
  const mobileItems = navItems.filter((item) => item.showMobile)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a50] border-t border-[#1a1a6a] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-[#eff7cf]"
                  : "text-[#eff7cf]/50"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className="text-[10px] font-medium leading-tight text-center">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-[#644536] rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
