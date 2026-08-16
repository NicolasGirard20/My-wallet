"use server"

import { requireSession } from "@/app/lib/session"
import * as service from "@/app/service/investment.service"
import { logger } from "@/app/imports/dev"
import type { Currency, Investment, InvestmentContribution } from "@/lib/types"

function isCurrency(value: unknown): value is Currency {
  return value === "USD" || value === "ARS"
}

function mapInv(inv: {
  id: number
  name: string
  description: string
  invested: number
  currentValue: number
  currency: string
  createdAt: Date
  updatedAt: Date
  contributions: Array<{
    id: number
    investmentId: number
    date: Date
    amount: number
    currency: string
    note: string | null
    createdAt: Date
  }>
}): Investment {
  return {
    id: inv.id,
    name: inv.name,
    description: inv.description,
    invested: inv.invested,
    currentValue: inv.currentValue,
    currency: inv.currency as Currency,
    createdAt: inv.createdAt.toISOString(),
    contributions: inv.contributions.map((c) => ({
      id: c.id,
      date: c.date.toISOString(),
      amount: c.amount,
      currency: c.currency as Currency,
      note: c.note ?? undefined,
    })),
  }
}

export async function getInvestmentsAction() {
  try {
    await requireSession()
    const investments = await service.getInvestments()
    return investments.map(mapInv)
  } catch (error) {
    logger.error("getInvestmentsAction failed:", error)
    throw new Error("Error al obtener las inversiones")
  }
}

export async function getInvestmentByIdAction(id: number) {
  try {
    await requireSession()
    const inv = await service.getInvestmentById(id)
    if (!inv) return null
    return mapInv(inv)
  } catch (error) {
    logger.error("getInvestmentByIdAction failed:", error)
    throw error
  }
}

export async function createInvestmentAction(data: {
  name: string
  description: string
  currentValue: number
  currency: string
}) {
  try {
    await requireSession()

    if (!data.name?.trim()) throw new Error("El nombre es obligatorio")
    if (!Number.isFinite(data.currentValue) || data.currentValue < 0) {
      throw new Error("El valor actual debe ser un número válido")
    }
    if (!isCurrency(data.currency)) throw new Error("Moneda inválida")

    const inv = await service.createInvestment({
      name: data.name.trim(),
      description: data.description?.trim() || "",
      invested: data.currentValue,
      currentValue: data.currentValue,
      currency: data.currency,
    })

    return mapInv({ ...inv, contributions: [] })
  } catch (error) {
    logger.error("createInvestmentAction failed:", error)
    throw error
  }
}

export async function updateInvestmentAction(
  id: number,
  data: Partial<{
    name: string
    description: string
    currentValue: number
    currency: string
  }>,
) {
  try {
    await requireSession()

    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) {
      if (!data.name.trim()) throw new Error("El nombre es obligatorio")
      updateData.name = data.name.trim()
    }
    if (data.description !== undefined) updateData.description = data.description
    if (data.currentValue !== undefined) {
      if (!Number.isFinite(data.currentValue) || data.currentValue < 0) {
        throw new Error("El valor actual debe ser un número válido")
      }
      updateData.currentValue = data.currentValue
    }
    if (data.currency !== undefined) {
      if (!isCurrency(data.currency)) throw new Error("Moneda inválida")
      updateData.currency = data.currency
    }

    const inv = await service.updateInvestment(id, updateData)
    const full = await service.getInvestmentById(id)
    if (!full) throw new Error("Inversión no encontrada")
    return mapInv(full)
  } catch (error) {
    logger.error("updateInvestmentAction failed:", error)
    throw error
  }
}

export async function deleteInvestmentAction(id: number) {
  try {
    await requireSession()
    await service.deleteInvestment(id)
  } catch (error) {
    logger.error("deleteInvestmentAction failed:", error)
    throw error
  }
}

export async function addContributionAction(
  investmentId: number,
  data: {
    date: string
    amount: number
    currency: string
    note?: string
  },
) {
  try {
    await requireSession()

    const investment = await service.getInvestmentById(investmentId)
    if (!investment) throw new Error("Inversión no encontrada")

    if (!Number.isFinite(data.amount) || data.amount === 0) throw new Error("El monto no puede ser 0")
    if (!isCurrency(data.currency)) throw new Error("Moneda inválida")
    const parsedDate = new Date(data.date)
    if (isNaN(parsedDate.getTime())) throw new Error("Fecha inválida")

    const contribution = await service.addContribution(investmentId, {
      date: parsedDate,
      amount: data.amount,
      currency: data.currency,
      note: data.note?.trim() || undefined,
    })

    return {
      ...contribution,
      date: contribution.date.toISOString(),
      createdAt: contribution.createdAt.toISOString(),
      currency: contribution.currency as Currency,
      note: contribution.note ?? undefined,
    }
  } catch (error) {
    logger.error("addContributionAction failed:", error)
    throw error
  }
}

export async function deleteContributionAction(contributionId: number) {
  try {
    await requireSession()
    await service.deleteContribution(contributionId)
  } catch (error) {
    logger.error("deleteContributionAction failed:", error)
    throw error
  }
}