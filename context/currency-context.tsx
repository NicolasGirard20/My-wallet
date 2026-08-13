"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { formatCurrency as fmt } from "@/lib/format"
import type { Currency } from "@/lib/types"

const STORAGE_KEY = "mywallet.currency"

interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  toggleCurrency: () => void
  format: (amount: number, options?: { compact?: boolean; showSign?: boolean }) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD")

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Currency | null
      if (stored === "USD" || stored === "ARS") setCurrencyState(stored)
    } catch {
      // ignore
    }
  }, [])

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c)
    try {
      window.localStorage.setItem(STORAGE_KEY, c)
    } catch {
      // ignore
    }
  }, [])

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === "USD" ? "ARS" : "USD")
  }, [currency, setCurrency])

  const format = useCallback(
    (amount: number, options?: { compact?: boolean; showSign?: boolean }) =>
      fmt(amount, currency, options),
    [currency],
  )

  const value = useMemo(
    () => ({ currency, setCurrency, toggleCurrency, format }),
    [currency, setCurrency, toggleCurrency, format],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx
}
