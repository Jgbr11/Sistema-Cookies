"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navItems } from "./nav-items"

/**
 * Bottom navigation bar para mobile.
 * Exibe os 5 itens com showMobile=true.
 * Fica fixo na parte inferior da tela.
 * Design arredondado com pills ativas.
 */
export function MobileNav() {
  const pathname = usePathname()
  const mobileItems = navItems.filter((item) => item.showMobile)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#0a0a50] to-[#0e0e5a] border-t border-white/10 rounded-t-2xl safe-area-inset-bottom shadow-[0_-4px_20px_-4px_rgba(10,10,80,0.3)]">
      <div className="flex items-center justify-around h-[68px] px-2">
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
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[56px] relative",
                isActive
                  ? "text-[#eff7cf] bg-[#644536]/30"
                  : "text-[#eff7cf]/40 active:scale-95"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(
                "text-[10px] font-semibold leading-tight text-center",
                isActive && "text-[#eff7cf]"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 w-6 h-1 bg-[#644536] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
