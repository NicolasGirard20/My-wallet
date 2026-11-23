import { describe, expect, it } from "vitest"
import { CURRENCY_META, formatCurrency, formatDate, formatMonth, validateDate } from "@/lib/format"

describe("lib/format", () => {
  describe("CURRENCY_META", () => {
    it("define metadatos para ARS y USD", () => {
      expect(CURRENCY_META.ARS.code).toBe("ARS")
      expect(CURRENCY_META.ARS.locale).toBe("es-AR")
      expect(CURRENCY_META.USD.code).toBe("USD")
      expect(CURRENCY_META.USD.locale).toBe("en-US")
    })
  })

  describe("formatCurrency", () => {
    it("formatea montos positivos y negativos en USD", () => {
      expect(formatCurrency(1250, "USD")).toBe("$1,250")
      expect(formatCurrency(-1250, "USD")).toBe("-$1,250")
    })

    it("agrega signo explícito cuando showSign es true", () => {
      expect(formatCurrency(500, "USD", { showSign: true })).toBe("+$500")
      expect(formatCurrency(0, "USD", { showSign: true })).toBe("+$0")
      expect(formatCurrency(-500, "USD", { showSign: true })).toBe("-$500")
    })

    it("formatea en notación compacta cuando compact es true", () => {
      const compactUsd = formatCurrency(1500, "USD", { compact: true })
      expect(compactUsd).toMatch(/1\.5K/)
    })

    it("formatea montos en ARS sin romper ante negativos", () => {
      const ars = formatCurrency(2500, "ARS")
      const arsNeg = formatCurrency(-2500, "ARS")
      expect(ars).toContain("2.500")
      expect(arsNeg.startsWith("-")).toBe(true)
    })
  })

  describe("formatDate y formatMonth", () => {
    it("formatea fecha en estilo short y long en UTC", () => {
      const iso = "2026-03-15T12:00:00.000Z"
      const short = formatDate(iso, "short")
      const long = formatDate(iso, "long")
      expect(short).toContain("15")
      expect(long).toContain("2026")
      expect(long.length).toBeGreaterThan(short.length)
    })

    it("formatea el mes sin punto final", () => {
      const month = formatMonth("2026-03-15T00:00:00.000Z")
      expect(month.endsWith(".")).toBe(false)
      expect(month.length).toBeGreaterThan(0)
    })
  })

  describe("validateDate", () => {
    it("devuelve Date para fechas válidas entre 1900 y 2100", () => {
      const d = validateDate("2026-08-12T00:00:00.000Z")
      expect(d).toBeInstanceOf(Date)
      expect(d?.getUTCFullYear()).toBe(2026)
    })

    it("devuelve null para strings inválidos o años fuera de rango", () => {
      expect(validateDate("not-a-date")).toBeNull()
      expect(validateDate("1850-01-01")).toBeNull()
      expect(validateDate("2150-01-01")).toBeNull()
    })
  })
})
