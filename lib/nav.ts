import { ArrowLeftRight, Home, PiggyBank, Target, TrendingUp, type LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  match: (pathname: string) => boolean
}

export const navItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/inicio",
    icon: Home,
    match: (p) => p === "/inicio",
  },
  {
    label: "Transferencias",
    href: "/transferencias/ingresos",
    icon: ArrowLeftRight,
    match: (p) => p.startsWith("/transferencias"),
  },
  {
    label: "Presupuestos",
    href: "/presupuestos",
    icon: Target,
    match: (p) => p.startsWith("/presupuestos"),
  },
  {
    label: "Ahorros",
    href: "/ahorros",
    icon: PiggyBank,
    match: (p) => p.startsWith("/ahorros"),
  },
  {
    label: "Inversiones",
    href: "/inversiones",
    icon: TrendingUp,
    match: (p) => p.startsWith("/inversiones"),
  },
]
