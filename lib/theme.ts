import type { CSSProperties } from "react"
import type { Currency } from "./types"

// Dynamic accent palette driven by the active currency.
// USD -> emerald green, ARS -> celeste/blue (Argentine palette).
interface CurrencyTheme {
  primary: string
  primaryForeground: string
  ring: string
  charts: [string, string, string, string, string]
}

const THEMES: Record<Currency, CurrencyTheme> = {
  USD: {
    primary: "oklch(0.62 0.14 159)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.62 0.14 159)",
    charts: [
      "oklch(0.62 0.14 159)",
      "oklch(0.72 0.13 162)",
      "oklch(0.52 0.12 158)",
      "oklch(0.8 0.1 165)",
      "oklch(0.42 0.09 157)",
    ],
  },
  ARS: {
    primary: "oklch(0.58 0.15 250)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.58 0.15 250)",
    charts: [
      "oklch(0.58 0.15 250)",
      "oklch(0.68 0.13 245)",
      "oklch(0.48 0.14 254)",
      "oklch(0.78 0.1 240)",
      "oklch(0.4 0.12 258)",
    ],
  },
}

export function currencyThemeVars(currency: Currency): CSSProperties {
  const t = THEMES[currency]
  return {
    "--primary": t.primary,
    "--primary-foreground": t.primaryForeground,
    "--ring": t.ring,
    "--sidebar-primary": t.primary,
    "--sidebar-primary-foreground": t.primaryForeground,
    "--sidebar-ring": t.ring,
    "--chart-1": t.charts[0],
    "--chart-2": t.charts[1],
    "--chart-3": t.charts[2],
    "--chart-4": t.charts[3],
    "--chart-5": t.charts[4],
  } as CSSProperties
}
