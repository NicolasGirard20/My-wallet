"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { formatCurrency as fmt } from "@/lib/format"
import type { Currency } from "@/lib/types"
import { getExchangeRatesAction, type DollarRate } from "@/app/actions/exchange"
import { logger } from "@/app/imports/dev"

const STORAGE_KEY = "mywallet.currency"
const RATE_KEY = "mywallet.dollarType"

export const DEFAULT_DOLLAR_TYPE = "blue"

interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  toggleCurrency: () => void
  format: (amount: number, options?: { compact?: boolean; showSign?: boolean }) => string
  rates: DollarRate[]
  dollarType: string
  setDollarType: (casa: string) => void
  rate: DollarRate | null
  convert: (amount: number, from: Currency) => number
  convertToActive: (amount: number, from: Currency) => number
  ratesLoading: boolean
  ratesUpdatedAt: string | null
  refreshRates: (force?: boolean) => Promise<void>
  ratesError: string | null
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD")
  const [dollarType, setDollarTypeState] = useState<string>(DEFAULT_DOLLAR_TYPE)
  const [rates, setRates] = useState<DollarRate[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null)
  const [ratesError, setRatesError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Currency | null
      if (stored === "USD" || stored === "ARS") setCurrencyState(stored)
      const storedType = window.localStorage.getItem(RATE_KEY)
      if (storedType) setDollarTypeState(storedType)
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

  const setDollarType = useCallback((casa: string) => {
    setDollarTypeState(casa)
    try {
      window.localStorage.setItem(RATE_KEY, casa)
    } catch {
      // ignore
    }
  }, [])

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === "USD" ? "ARS" : "USD")
  }, [currency, setCurrency])

  const refreshRates = useCallback(async (force = false) => {
    setRatesLoading(true)
    setRatesError(null)
    try {
      const snapshot = await getExchangeRatesAction(force)
      setRates(snapshot.rates)
      setRatesUpdatedAt(snapshot.fetchedAt)
    } catch (error) {
      logger.error("refreshRates failed:", error)
      setRatesError("No se pudo actualizar la cotización")
    } finally {
      setRatesLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshRates()
  }, [refreshRates])

  const rate = useMemo(
    () => rates.find((r) => r.casa === dollarType) ?? null,
    [rates, dollarType],
  )

  const convert = useCallback(
    (amount: number, from: Currency): number => {
      if (from === currency) return amount
      if (!rate) return amount
      const tasa = (rate.compra + rate.venta) / 2
      if (!Number.isFinite(tasa) || tasa <= 0) return amount
      if (from === "USD" && currency === "ARS") return amount * tasa
      if (from === "ARS" && currency === "USD") return amount / tasa
      return amount
    },
    [currency, rate],
  )

  const convertToActive = useCallback(
    (amount: number, from: Currency): number => convert(amount, from),
    [convert],
  )

  const format = useCallback(
    (amount: number, options?: { compact?: boolean; showSign?: boolean }) =>
      fmt(amount, currency, options),
    [currency],
  )

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      toggleCurrency,
      format,
      rates,
      dollarType,
      setDollarType,
      rate,
      convert,
      convertToActive,
      ratesLoading,
      ratesUpdatedAt,
      refreshRates,
      ratesError,
    }),
    [
      currency,
      setCurrency,
      toggleCurrency,
      format,
      rates,
      dollarType,
      setDollarType,
      rate,
      convert,
      convertToActive,
      ratesLoading,
      ratesUpdatedAt,
      refreshRates,
      ratesError,
    ],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx
}
