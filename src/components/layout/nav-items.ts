import {
  LayoutDashboard,
  Wheat,
  BookOpen,
  Package,
  Factory,
  ShoppingCart,
  DollarSign,
  FileText,
  Truck,
  ShoppingBag,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * Definição dos itens de navegação do sistema.
 * Usado pela Sidebar (desktop), MobileNav (mobile) e Header.
 */
export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Mostrar na bottom nav mobile (máximo 5) */
  showMobile: boolean
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    showMobile: true,
  },
  {
    label: "Ingredientes",
    href: "/ingredientes",
    icon: Wheat,
    showMobile: true,
  },
  {
    label: "Receitas",
    href: "/receitas",
    icon: BookOpen,
    showMobile: true,
  },
  {
    label: "Estoque",
    href: "/estoque",
    icon: Package,
    showMobile: false,
  },
  {
    label: "Produção",
    href: "/producao",
    icon: Factory,
    showMobile: false,
  },
  {
    label: "Vendas",
    href: "/vendas",
    icon: ShoppingCart,
    showMobile: true,
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    showMobile: true,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: FileText,
    showMobile: false,
  },
  {
    label: "Compras",
    href: "/ingredientes/compras",
    icon: ShoppingBag,
    showMobile: false,
  },
  {
    label: "Fornecedores",
    href: "/fornecedores",
    icon: Truck,
    showMobile: false,
  },
]
