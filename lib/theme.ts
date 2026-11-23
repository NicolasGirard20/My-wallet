import type { CSSProperties } from "react"
import type { Currency } from "./types"

export type ThemePaletteId =
  | "classic"
  | "warm-paper"
  | "nordic-slate"
  | "soft-lavender"
  | "obsidian"
  | "midnight"
  | "espresso"

export type ThemeMode = "light" | "dark"

export const DEFAULT_THEME_PALETTE: ThemePaletteId = "classic"
export const THEME_PALETTE_STORAGE_KEY = "mywallet.themePalette"

export interface ThemePalettePreview {
  background: string
  sidebar: string
  card: string
  border: string
  foreground: string
}

export interface ThemePalette {
  id: ThemePaletteId
  name: string
  description: string
  mode: ThemeMode
  preview: ThemePalettePreview
}

export const THEME_PALETTES: readonly ThemePalette[] = [
  {
    id: "classic",
    name: "Clásico",
    description: "Superficie blanca limpia y neutral de alto contraste.",
    mode: "light",
    preview: {
      background: "oklch(1 0 0)",
      sidebar: "oklch(0.985 0 0)",
      card: "oklch(1 0 0)",
      border: "oklch(0.922 0 0)",
      foreground: "oklch(0.145 0 0)",
    },
  },
  {
    id: "warm-paper",
    name: "Papel Arena",
    description: "Tonos crema cálidos inspirados en papel editorial.",
    mode: "light",
    preview: {
      background: "oklch(0.975 0.012 85)",
      sidebar: "oklch(0.958 0.015 84)",
      card: "oklch(0.992 0.008 85)",
      border: "oklch(0.89 0.018 82)",
      foreground: "oklch(0.22 0.02 65)",
    },
  },
  {
    id: "nordic-slate",
    name: "Pizarra Nórdica",
    description: "Matices fríos azulados con estética minimalista nórdica.",
    mode: "light",
    preview: {
      background: "oklch(0.968 0.01 240)",
      sidebar: "oklch(0.948 0.013 240)",
      card: "oklch(0.992 0.006 240)",
      border: "oklch(0.885 0.016 240)",
      foreground: "oklch(0.21 0.022 245)",
    },
  },
  {
    id: "soft-lavender",
    name: "Bruma Lavanda",
    description: "Fondo claro suave con un sutil velo lavanda.",
    mode: "light",
    preview: {
      background: "oklch(0.972 0.012 295)",
      sidebar: "oklch(0.954 0.016 295)",
      card: "oklch(0.993 0.007 295)",
      border: "oklch(0.892 0.018 295)",
      foreground: "oklch(0.215 0.025 290)",
    },
  },
  {
    id: "obsidian",
    name: "Obsidiana",
    description: "Oscuro neutro profundo con tarjetas definidas.",
    mode: "dark",
    preview: {
      background: "oklch(0.145 0 0)",
      sidebar: "oklch(0.175 0 0)",
      card: "oklch(0.195 0 0)",
      border: "oklch(0.285 0 0)",
      foreground: "oklch(0.985 0 0)",
    },
  },
  {
    id: "midnight",
    name: "Medianoche",
    description: "Azul nocturno profundo con contraste equilibrado.",
    mode: "dark",
    preview: {
      background: "oklch(0.155 0.024 255)",
      sidebar: "oklch(0.18 0.025 255)",
      card: "oklch(0.205 0.026 255)",
      border: "oklch(0.305 0.026 255)",
      foreground: "oklch(0.965 0.008 250)",
    },
  },
  {
    id: "espresso",
    name: "Espresso",
    description: "Oscuro cálido con matices tostados y tierra.",
    mode: "dark",
    preview: {
      background: "oklch(0.16 0.02 52)",
      sidebar: "oklch(0.185 0.021 52)",
      card: "oklch(0.21 0.022 52)",
      border: "oklch(0.31 0.022 52)",
      foreground: "oklch(0.96 0.01 75)",
    },
  },
] as const

const PALETTE_BY_ID = new Map<ThemePaletteId, ThemePalette>(
  THEME_PALETTES.map((palette) => [palette.id, palette]),
)

export function isValidThemePalette(value: unknown): value is ThemePaletteId {
  return typeof value === "string" && PALETTE_BY_ID.has(value as ThemePaletteId)
}

export function getPaletteById(id: string | null | undefined): ThemePalette {
  if (isValidThemePalette(id)) {
    return PALETTE_BY_ID.get(id)!
  }
  return PALETTE_BY_ID.get(DEFAULT_THEME_PALETTE)!
}

// Dynamic accent palette driven by the active currency.
// USD -> emerald green, ARS -> celeste/blue (Argentine palette).
interface CurrencyTheme {
  primary: string
  primaryForeground: string
  ring: string
  charts: [string, string, string, string, string]
}

const THEMES: Record<ThemeMode, Record<Currency, CurrencyTheme>> = {
  light: {
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
  },
  dark: {
    USD: {
      primary: "oklch(0.64 0.145 159)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.64 0.145 159)",
      charts: [
        "oklch(0.66 0.145 159)",
        "oklch(0.75 0.13 162)",
        "oklch(0.58 0.13 158)",
        "oklch(0.83 0.1 165)",
        "oklch(0.5 0.11 157)",
      ],
    },
    ARS: {
      primary: "oklch(0.62 0.15 250)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.62 0.15 250)",
      charts: [
        "oklch(0.64 0.15 250)",
        "oklch(0.74 0.13 245)",
        "oklch(0.58 0.14 254)",
        "oklch(0.82 0.1 240)",
        "oklch(0.5 0.12 258)",
      ],
    },
  },
}

export function currencyThemeVars(
  currency: Currency,
  mode: ThemeMode = "light",
): CSSProperties {
  const t = THEMES[mode][currency]
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
