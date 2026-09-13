"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { CheckingAccountSelector } from "@/components/layout/checking-account-selector"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, hydrated } = useAuth()

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/login")
  }, [hydrated, isAuthenticated, router])

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="size-6 animate-pulse" />
        </span>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top panel header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="lg:hidden">
              <MobileNav />
            </div>
            <span className="flex items-center gap-2 font-semibold lg:hidden">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wallet className="size-4" />
              </span>
              <span className="hidden sm:inline">My Wallet</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckingAccountSelector />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
