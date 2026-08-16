"use server"

import { requireSession } from "@/app/lib/session"
import { logger } from "@/app/imports/dev"

export interface DollarRate {
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

export interface ExchangeSnapshot {
  rates: DollarRate[]
  fetchedAt: string
}

const API_URL = "https://dolarapi.com/v1/dolares"
const CACHE_TTL_MS = 5 * 60 * 1000

let cache: { snapshot: ExchangeSnapshot; expiresAt: number } | null = null

function isDollarRate(value: unknown): value is DollarRate {
  if (typeof value !== "object" || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.casa === "string" &&
    typeof r.nombre === "string" &&
    typeof r.compra === "number" &&
    typeof r.venta === "number" &&
    typeof r.fechaActualizacion === "string"
  )
}

export async function getExchangeRatesAction(force = false): Promise<ExchangeSnapshot> {
  await requireSession()

  const now = Date.now()
  if (!force && cache && cache.expiresAt > now) {
    return cache.snapshot
  }

  try {
    const res = await fetch(API_URL, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) throw new Error(`DolarAPI respondió ${res.status}`)

    const data: unknown = await res.json()
    if (!Array.isArray(data)) throw new Error("Respuesta inesperada de DolarAPI")

    const rates = data.filter(isDollarRate)
    if (rates.length === 0) throw new Error("No se obtuvieron cotizaciones válidas")

    const snapshot: ExchangeSnapshot = {
      rates,
      fetchedAt: new Date().toISOString(),
    }
    cache = { snapshot, expiresAt: now + CACHE_TTL_MS }
    logger.info("Exchange rates actualizadas:", rates.length, "tipos")
    return snapshot
  } catch (error) {
    logger.error("getExchangeRatesAction failed:", error)
    if (cache) return cache.snapshot
    throw new Error("No se pudo obtener la cotización del dólar")
  }
}
