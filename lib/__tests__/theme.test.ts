import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  DEFAULT_THEME_PALETTE,
  THEME_PALETTES,
  THEME_PALETTE_STORAGE_KEY,
  currencyThemeVars,
  getPaletteById,
  isValidThemePalette,
  type ThemePaletteId,
} from "../theme"

const EXPECTED_IDS: ThemePaletteId[] = [
  "classic",
  "warm-paper",
  "nordic-slate",
  "soft-lavender",
  "obsidian",
  "midnight",
  "espresso",
]

const EXPECTED_ACCENT_KEYS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
]

const FORBIDDEN_SURFACE_KEYS = [
  "--background",
  "--card",
  "--sidebar",
  "--foreground",
]

function parseOklchLightness(value: string): number {
  const match = /^oklch\(\s*([\d.]+)\s+/.exec(value)
  if (!match) {
    throw new Error(`Expected oklch() color, got: ${value}`)
  }
  return Number(match[1])
}

describe("theme palettes", () => {
  it("defines 7 palettes (4 light, 3 dark) with complete metadata and OKLCH previews", () => {
    expect(THEME_PALETTES).toHaveLength(7)
    expect(THEME_PALETTES.map((p) => p.id)).toEqual(EXPECTED_IDS)

    const light = THEME_PALETTES.filter((p) => p.mode === "light")
    const dark = THEME_PALETTES.filter((p) => p.mode === "dark")
    expect(light).toHaveLength(4)
    expect(dark).toHaveLength(3)

    for (const palette of THEME_PALETTES) {
      expect(palette.name.trim().length).toBeGreaterThan(0)
      expect(palette.description.trim().length).toBeGreaterThan(0)
      for (const token of Object.values(palette.preview)) {
        expect(token).toMatch(/^oklch\(/)
      }
    }

    expect(DEFAULT_THEME_PALETTE).toBe("classic")
    expect(THEME_PALETTE_STORAGE_KEY).toBe("mywallet.themePalette")
  })

  it("validates palette ids strictly with isValidThemePalette and falls back in getPaletteById", () => {
    for (const id of EXPECTED_IDS) {
      expect(isValidThemePalette(id)).toBe(true)
      expect(getPaletteById(id).id).toBe(id)
    }

    expect(isValidThemePalette("unknown")).toBe(false)
    expect(isValidThemePalette("")).toBe(false)
    expect(isValidThemePalette(null)).toBe(false)
    expect(isValidThemePalette(undefined)).toBe(false)
    expect(isValidThemePalette(123)).toBe(false)
    expect(isValidThemePalette({})).toBe(false)

    expect(getPaletteById(null).id).toBe("classic")
    expect(getPaletteById(undefined).id).toBe("classic")
    expect(getPaletteById("non-existent").id).toBe("classic")
  })

  it("keeps :root[data-palette] blocks in globals.css free of accent/chart tokens", () => {
    const cssPath = path.resolve(import.meta.dirname, "../../app/globals.css")
    const css = fs.readFileSync(cssPath, "utf8")

    for (const id of EXPECTED_IDS) {
      const pattern = new RegExp(`:root\\[data-palette="${id}"\\]\\s*\\{([^}]*)\\}`)
      const match = pattern.exec(css)
      expect(match, `Missing :root[data-palette="${id}"] block`).not.toBeNull()

      const block = match![1]
      expect(block).not.toMatch(/--primary(?:-foreground)?\s*:/)
      expect(block).not.toMatch(/--ring\s*:/)
      expect(block).not.toMatch(/--sidebar-primary(?:-foreground)?\s*:/)
      expect(block).not.toMatch(/--sidebar-ring\s*:/)
      expect(block).not.toMatch(/--chart-\d+\s*:/)
    }
  })
})

describe("currencyThemeVars", () => {
  it("returns only accent and chart tokens for USD and ARS in light and dark modes", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const currency of ["USD", "ARS"] as const) {
        const vars = currencyThemeVars(currency, mode) as Record<string, string>
        expect(Object.keys(vars).sort()).toEqual([...EXPECTED_ACCENT_KEYS].sort())

        for (const forbidden of FORBIDDEN_SURFACE_KEYS) {
          expect(vars).not.toHaveProperty(forbidden)
        }
      }
    }
  })

  it("preserves exact light mode values for USD and ARS", () => {
    const usdLight = currencyThemeVars("USD") as Record<string, string>
    const arsLight = currencyThemeVars("ARS", "light") as Record<string, string>

    expect(usdLight["--primary"]).toBe("oklch(0.62 0.14 159)")
    expect(arsLight["--primary"]).toBe("oklch(0.58 0.15 250)")
  })

  it("elevates dark mode primary and chart lightness (L=0.50-0.83) with distinct USD/ARS colors", () => {
    const usdDark = currencyThemeVars("USD", "dark") as Record<string, string>
    const arsDark = currencyThemeVars("ARS", "dark") as Record<string, string>

    expect(usdDark["--primary"]).toBe("oklch(0.64 0.145 159)")
    expect(arsDark["--primary"]).toBe("oklch(0.62 0.15 250)")
    expect(usdDark["--primary-foreground"]).toBe("oklch(0.985 0 0)")
    expect(arsDark["--primary-foreground"]).toBe("oklch(0.985 0 0)")

    for (const vars of [usdDark, arsDark]) {
      for (const idx of [1, 2, 3, 4, 5]) {
        const lightness = parseOklchLightness(vars[`--chart-${idx}`])
        expect(lightness).toBeGreaterThanOrEqual(0.5)
        expect(lightness).toBeLessThanOrEqual(0.83)
      }
    }

    const usdLight = currencyThemeVars("USD", "light") as Record<string, string>
    const arsLight = currencyThemeVars("ARS", "light") as Record<string, string>

    expect(usdLight["--primary"]).not.toBe(arsLight["--primary"])
    expect(usdDark["--primary"]).not.toBe(arsDark["--primary"])
    expect(usdDark["--chart-1"]).not.toBe(arsDark["--chart-1"])
  })
})
