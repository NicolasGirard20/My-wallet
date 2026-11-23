"use client"

import { useEffect, useMemo } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/auth-context"
import { CurrencyProvider, useCurrency } from "@/context/currency-context"
import { DataProvider } from "@/context/data-context"
import { ThemePaletteProvider, useThemePalette } from "@/context/theme-palette-context"
import { currencyThemeVars } from "@/lib/theme"

function ThemedShell({ children }: { children: React.ReactNode }) {
  const { currency } = useCurrency()
  const { mode } = useThemePalette()
  const vars = useMemo(() => currencyThemeVars(currency, mode), [currency, mode])

  // Sync currency CSS custom properties onto :root so @base-ui/react Portals inherit active accents
  useEffect(() => {
    const root = document.documentElement
    const entries = Object.entries(vars as Record<string, string>)
    for (const [key, value] of entries) {
      root.style.setProperty(key, value)
    }
    return () => {
      for (const [key] of entries) {
        root.style.removeProperty(key)
      }
    }
  }, [vars])

  return (
    <div style={vars} className="contents">
      {children}
    </div>
  )
}

function ThemedToaster() {
  const { mode } = useThemePalette()
  return <Toaster position="top-center" theme={mode} />
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <ThemePaletteProvider>
          <DataProvider>
            <TooltipProvider>
              <ThemedShell>{children}</ThemedShell>
              <ThemedToaster />
            </TooltipProvider>
          </DataProvider>
        </ThemePaletteProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}
