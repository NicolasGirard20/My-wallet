"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet } from "lucide-react"

import { useAuth } from "@/context/auth-context"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, hydrated } = useAuth()

  useEffect(() => {
    if (!hydrated) return
    router.replace(isAuthenticated ? "/inicio" : "/login")
  }, [hydrated, isAuthenticated, router])

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="size-6" />
        </span>
        <p className="text-sm">Cargando My Wallet…</p>
      </div>
    </div>
  )
}
