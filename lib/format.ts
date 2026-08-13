import type { Currency } from "./types"

// Amounts are stored in their own currency (USD or ARS). No conversion happens
// at display time; the active currency only selects which records are shown.
export const CURRENCY_META: Record<
  Currency,
  { label: string; symbol: string; code: string; locale: string; flag: string }
> = {
  USD: { label: "Dólares", symbol: "US$", code: "USD", locale: "en-US", flag: "🇺🇸" },
  ARS: { label: "Pesos", symbol: "$", code: "ARS", locale: "es-AR", flag: "🇦🇷" },
}

export function formatCurrency(
  amount: number,
  currency: Currency,
  options: { compact?: boolean; showSign?: boolean } = {},
): string {
  const meta = CURRENCY_META[currency]

  const formatter = new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: options.compact ? 1 : 0,
    notation: options.compact ? "compact" : "standard",
  })

  const formatted = formatter.format(Math.abs(amount))
  if (options.showSign) {
    return `${amount >= 0 ? "+" : "-"}${formatted}`
  }
  return amount < 0 ? `-${formatted}` : formatted
}

export function formatDate(iso: string, style: "short" | "long" = "short"): string {
  const date = new Date(iso)
  if (style === "long") {
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
  }
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
}

export function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { month: "short" }).replace(".", "")
}

export function validateDate(iso: string): Date | null {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  if (d.getFullYear() < 1900 || d.getFullYear() > 2100) return null
  return d
}
