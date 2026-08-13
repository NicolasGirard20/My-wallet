"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { navItems } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { CurrencyToggle } from "@/components/layout/currency-toggle"
import { AccountMenu } from "@/components/layout/account-menu"

export function Sidebar() {
  const pathname = usePathname()
  const { username } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar p-4 lg:flex">
      <Link href="/inicio" className="flex items-center gap-2 px-2 py-1.5 text-lg font-semibold">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="size-5" />
        </span>
        My Wallet
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="px-1 text-xs font-medium text-muted-foreground">Moneda</span>
          <CurrencyToggle className="w-full justify-between" />
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <AccountMenu align="start" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{username ?? "Usuario"}</span>
            <span className="truncate text-xs text-muted-foreground">Cuenta personal</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
