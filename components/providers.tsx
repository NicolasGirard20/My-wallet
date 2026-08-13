"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/auth-context"
import { CurrencyProvider, useCurrency } from "@/context/currency-context"
import { DataProvider } from "@/context/data-context"
import { currencyThemeVars } from "@/lib/theme"

function ThemedShell({ children }: { children: React.ReactNode }) {
  const { currency } = useCurrency()
  return (
    <div style={currencyThemeVars(currency)} className="contents">
      {children}
    </div>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <DataProvider>
          <TooltipProvider>
            <ThemedShell>{children}</ThemedShell>
            <Toaster position="top-center" />
          </TooltipProvider>
        </DataProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}
