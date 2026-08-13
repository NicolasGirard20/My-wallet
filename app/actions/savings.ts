"use server"

import { requireSession } from "@/app/lib/session"
import * as service from "@/app/service/saving-goal.service"
import { logger } from "@/app/imports/dev"
import type { Currency, SavingGoal } from "@/lib/types"

function isCurrency(value: unknown): value is Currency {
  return value === "USD" || value === "ARS"
}

function mapGoal(g: {
  id: number
  name: string
  target: number
  saved: number
  color: string
  currency: string
  deadline: Date | null
  createdAt: Date
  updatedAt: Date
}): SavingGoal {
  return {
    id: g.id,
    name: g.name,
    target: g.target,
    saved: g.saved,
    color: g.color,
    currency: g.currency as Currency,
    deadline: g.deadline?.toISOString() ?? undefined,
  }
}

export async function getSavingGoalsAction() {
  try {
    await requireSession()
    const goals = await service.getSavingGoals()
    return goals.map(mapGoal)
  } catch (error) {
    logger.error("getSavingGoalsAction failed:", error)
    throw new Error("Error al obtener las metas de ahorro")
  }
}

export async function createSavingGoalAction(data: {
  name: string
  target: number
  color: string
  currency: string
  deadline?: string
}) {
  try {
    await requireSession()

    if (!data.name?.trim()) throw new Error("El nombre es obligatorio")
    if (!Number.isFinite(data.target) || data.target <= 0) throw new Error("La meta debe ser mayor a 0")
    if (!isCurrency(data.currency)) throw new Error("Moneda inválida")

    const deadline = data.deadline ? new Date(data.deadline) : undefined
    if (data.deadline && isNaN(new Date(data.deadline).getTime())) {
      throw new Error("Fecha límite inválida")
    }

    const goal = await service.createSavingGoal({
      name: data.name.trim(),
      target: data.target,
      saved: 0,
      color: data.color,
      currency: data.currency,
      deadline,
    })

    return mapGoal(goal)
  } catch (error) {
    logger.error("createSavingGoalAction failed:", error)
    throw error
  }
}

export async function updateSavingGoalAction(
  id: number,
  data: Partial<{
    name: string
    target: number
    saved: number
    color: string
    currency: string
    deadline: string | null
  }>,
) {
  try {
    await requireSession()

    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) {
      if (!data.name.trim()) throw new Error("El nombre es obligatorio")
      updateData.name = data.name.trim()
    }
    if (data.target !== undefined) {
      if (!Number.isFinite(data.target) || data.target <= 0) throw new Error("La meta debe ser mayor a 0")
      updateData.target = data.target
    }
    if (data.saved !== undefined) {
      if (!Number.isFinite(data.saved) || data.saved < 0) throw new Error("El ahorro debe ser un número válido")
      updateData.saved = data.saved
    }
    if (data.color !== undefined) updateData.color = data.color
    if (data.currency !== undefined) {
      if (!isCurrency(data.currency)) throw new Error("Moneda inválida")
      updateData.currency = data.currency
    }
    if (data.deadline !== undefined) {
      if (data.deadline === null) {
        updateData.deadline = null
      } else {
        const parsed = new Date(data.deadline)
        if (isNaN(parsed.getTime())) throw new Error("Fecha límite inválida")
        updateData.deadline = parsed
      }
    }

    const goal = await service.updateSavingGoal(id, updateData)
    return mapGoal(goal)
  } catch (error) {
    logger.error("updateSavingGoalAction failed:", error)
    throw error
  }
}

export async function deleteSavingGoalAction(id: number) {
  try {
    await requireSession()
    await service.deleteSavingGoal(id)
  } catch (error) {
    logger.error("deleteSavingGoalAction failed:", error)
    throw error
  }
}