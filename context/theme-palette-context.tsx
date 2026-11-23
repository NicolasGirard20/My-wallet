"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { updateThemePaletteAction } from "@/app/actions/auth"
import { useAuth } from "@/context/auth-context"
import {
  DEFAULT_THEME_PALETTE,
  THEME_PALETTE_STORAGE_KEY,
  getPaletteById,
  isValidThemePalette,
  type ThemeMode,
  type ThemePalette,
  type ThemePaletteId,
} from "@/lib/theme"

interface ThemePaletteContextValue {
  paletteId: ThemePaletteId
  palette: ThemePalette
  mode: ThemeMode
  saving: boolean
  setPalette: (nextId: ThemePaletteId) => Promise<void>
}

const ThemePaletteContext = createContext<ThemePaletteContextValue | null>(null)

function applyPaletteToDom(id: ThemePaletteId) {
  const root = document.documentElement
  root.setAttribute("data-palette", id)
  const nextMode = getPaletteById(id).mode
  root.classList.remove("light", "dark")
  root.classList.add(nextMode)
}

function writeStoredPalette(id: ThemePaletteId) {
  try {
    window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, id)
  } catch {
    // ignore storage errors
  }
}

export function ThemePaletteProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setUserThemePalette } = useAuth()
  const [paletteId, setPaletteId] = useState<ThemePaletteId>(DEFAULT_THEME_PALETTE)
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Hydrate initial palette from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_PALETTE_STORAGE_KEY)
      if (isValidThemePalette(stored)) {
        setPaletteId(stored)
      }
    } catch {
      // ignore storage errors
    } finally {
      setStorageLoaded(true)
    }
  }, [])

  // Sync palette when authenticated user profile is hydrated or changes
  const userPalette = user?.themePalette
  useEffect(() => {
    if (!userPalette || !isValidThemePalette(userPalette)) return
    setPaletteId(userPalette)
    writeStoredPalette(userPalette)
  }, [userPalette])

  // Apply data-palette and .light/.dark class to <html>
  useEffect(() => {
    if (!storageLoaded) return
    applyPaletteToDom(paletteId)
  }, [paletteId, storageLoaded])

  const setPalette = useCallback(
    async (nextId: ThemePaletteId) => {
      if (!isValidThemePalette(nextId) || nextId === paletteId) return

      const previousId = paletteId
      // Optimistic update for instant preview
      setPaletteId(nextId)
      applyPaletteToDom(nextId)
      writeStoredPalette(nextId)

      if (!isAuthenticated) return

      setSaving(true)
      try {
        const result = await updateThemePaletteAction(nextId)
        if (result.ok) {
          setUserThemePalette(nextId)
        } else {
          setPaletteId(previousId)
          applyPaletteToDom(previousId)
          writeStoredPalette(previousId)
          toast.error(result.error ?? "No se pudo guardar la paleta de tema")
        }
      } catch {
        setPaletteId(previousId)
        applyPaletteToDom(previousId)
        writeStoredPalette(previousId)
        toast.error("No se pudo guardar la paleta de tema")
      } finally {
        setSaving(false)
      }
    },
    [paletteId, isAuthenticated, setUserThemePalette],
  )

  const palette = useMemo(() => getPaletteById(paletteId), [paletteId])

  const value = useMemo<ThemePaletteContextValue>(
    () => ({
      paletteId,
      palette,
      mode: palette.mode,
      saving,
      setPalette,
    }),
    [paletteId, palette, saving, setPalette],
  )

  return (
    <ThemePaletteContext.Provider value={value}>
      {children}
    </ThemePaletteContext.Provider>
  )
}

export function useThemePalette() {
  const ctx = useContext(ThemePaletteContext)
  if (!ctx) throw new Error("useThemePalette must be used within ThemePaletteProvider")
  return ctx
}
