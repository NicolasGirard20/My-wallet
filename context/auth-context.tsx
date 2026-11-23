"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import {
  loginAction,
  logoutAction,
  getCurrentUserAction,
  changePasswordAction,
} from "@/app/actions/auth"
import type { ThemePaletteId } from "@/lib/theme"
import type { User } from "@/lib/types"

interface AuthContextValue {
  isAuthenticated: boolean
  hydrated: boolean
  user: User | null
  username: string | null
  isAdmin: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  setUserThemePalette: (palette: ThemePaletteId) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem("mywallet_active_session")) {
      logoutAction().then(() => {
        setUser(null)
        setHydrated(true)
      })
      return
    }
    getCurrentUserAction().then((currentUser) => {
      setUser(currentUser ?? null)
      setHydrated(true)
    })
  }, [])

  const login = useCallback(async (usernameInput: string, password: string) => {
    const result = await loginAction(usernameInput, password)
    if (result.ok && result.user) {
      sessionStorage.setItem("mywallet_active_session", "1")
      setUser(result.user)
      return { ok: true as const }
    }
    return { ok: false as const, error: result.error }
  }, [])

  const logout = useCallback(async () => {
    sessionStorage.removeItem("mywallet_active_session")
    await logoutAction()
    setUser(null)
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const result = await changePasswordAction(currentPassword, newPassword)
    if (result.ok) {
      // Force logout after a successful password change
      sessionStorage.removeItem("mywallet_active_session")
      await logoutAction()
      setUser(null)
      return { ok: true as const }
    }
    return { ok: false as const, error: result.error }
  }, [])

  const setUserThemePalette = useCallback((palette: ThemePaletteId) => {
    setUser((prev) => (prev ? { ...prev, themePalette: palette } : prev))
  }, [])

  const username = user?.username ?? null
  const isAdmin = user?.role === "admin"

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        hydrated,
        user,
        username,
        isAdmin,
        login,
        logout,
        changePassword,
        setUserThemePalette,
      }}
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