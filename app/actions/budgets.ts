"use server"

import { requireSession } from "@/app/lib/session"
import * as service from "@/app/service/budget.service"
import { logger } from "@/app/imports/dev"
import type { Budget } from "@/lib/types"

function mapBudget(b: {
  id: number
  name: string
  startDate: Date
  endDate: Date
  amountLimit: number
  categoryId: number | null
}): Budget {
  return {
    id: b.id,
    name: b.name,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    amountLimit: b.amountLimit,
    categoryId: b.categoryId,
  }
}

export async function getBudgetsAction(): Promise<Budget[]> {
  try {
    const session = await requireSession()
    const budgets = await service.getBudgets(session.userId)
    return budgets.map(mapBudget)
  } catch (error) {
    logger.error("getBudgetsAction failed:", error)
    throw new Error("Error al obtener los presupuestos")
  }
}

export async function createBudgetAction(data: Omit<Budget, "id">): Promise<Budget> {
  try {
    const session = await requireSession()

    if (!data.name?.trim()) throw new Error("El nombre es obligatorio")
    if (!Number.isFinite(data.amountLimit) || data.amountLimit <= 0) {
      throw new Error("El monto límite debe ser mayor a 0")
    }
    if (!data.startDate) throw new Error("La fecha de inicio es requerida")
    if (!data.endDate) throw new Error("La fecha de fin es requerida")

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error("Fechas inválidas")
    }
    if (startDate > endDate) {
      throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin")
    }

    const created = await service.createBudget({
      name: data.name.trim(),
      startDate,
      endDate,
      amountLimit: data.amountLimit,
      categoryId: data.categoryId ?? null,
      userId: session.userId,
    })

    return mapBudget(created)
  } catch (error) {
    logger.error("createBudgetAction failed:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error al crear el presupuesto")
  }
}

export async function updateBudgetAction(
  id: number,
  data: Partial<Omit<Budget, "id">>
): Promise<Budget> {
  try {
    const session = await requireSession()

    if (!id || typeof id !== "number") throw new Error("ID inválido")

    const payload: Partial<{
      name: string
      startDate: Date
      endDate: Date
      amountLimit: number
      categoryId: number | null
    }> = {}

    if (data.name !== undefined) {
      if (!data.name.trim()) throw new Error("El nombre no puede estar vacío")
      payload.name = data.name.trim()
    }

    if (data.amountLimit !== undefined) {
      if (!Number.isFinite(data.amountLimit) || data.amountLimit <= 0) {
        throw new Error("El monto límite debe ser mayor a 0")
      }
      payload.amountLimit = data.amountLimit
    }

    if (data.categoryId !== undefined) {
      payload.categoryId = data.categoryId
    }

    if (data.startDate !== undefined) {
      const s = new Date(data.startDate)
      if (Number.isNaN(s.getTime())) throw new Error("Fecha de inicio inválida")
      payload.startDate = s
    }

    if (data.endDate !== undefined) {
      const e = new Date(data.endDate)
      if (Number.isNaN(e.getTime())) throw new Error("Fecha de fin inválida")
      payload.endDate = e
    }

    const updated = await service.updateBudget(id, session.userId, payload)
    return mapBudget(updated)
  } catch (error) {
    logger.error("updateBudgetAction failed:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error al actualizar el presupuesto")
  }
}

export async function deleteBudgetAction(id: number): Promise<{ success: boolean }> {
  try {
    const session = await requireSession()
    if (!id || typeof id !== "number") throw new Error("ID inválido")

    await service.deleteBudget(id, session.userId)
    return { success: true }
  } catch (error) {
    logger.error("deleteBudgetAction failed:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error al eliminar el presupuesto")
  }
}
