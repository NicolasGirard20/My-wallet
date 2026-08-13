"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { loginAction, logoutAction, getSessionAction, changePasswordAction } from "@/app/actions/auth"

interface AuthContextValue {
  isAuthenticated: boolean
  hydrated: boolean
  username: string | null
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    getSessionAction().then((session) => {
      if (session?.username) setUsername(session.username)
      setHydrated(true)
    })
  }, [])

  const login = useCallback(async (user: string, pass: string) => {
    const result = await loginAction(user, pass)
    if (result.ok) {
      setUsername(user.trim())
      return { ok: true as const }
    }
    return { ok: false as const, error: result.error }
  }, [])

  const logout = useCallback(async () => {
    await logoutAction()
    setUsername(null)
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const result = await changePasswordAction(currentPassword, newPassword)
    if (result.ok) {
      // Force logout after a successful password change
      await logoutAction()
      setUsername(null)
      return { ok: true as const }
    }
    return { ok: false as const, error: result.error }
  }, [])

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: username !== null, hydrated, username, login, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}