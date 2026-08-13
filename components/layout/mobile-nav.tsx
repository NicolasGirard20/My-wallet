"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Wallet } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { navItems } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CurrencyToggle } from "@/components/layout/currency-toggle"
import { AccountMenu } from "@/components/layout/account-menu"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { username } = useAuth()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú" />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col p-4">
        <SheetHeader className="p-0">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </span>
            My Wallet
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <SheetClose
                key={item.href}
                nativeButton={false}
                render={
                  <Link
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
                }
              />
            )
          })}
        </nav>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="px-1 text-xs font-medium text-muted-foreground">Moneda</span>
            <CurrencyToggle className="w-full justify-between" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="truncate text-sm font-medium">{username ?? "Usuario"}</span>
            <AccountMenu align="end" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
