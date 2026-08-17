import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"

export async function getSavingGoals(userId: number, currency?: string) {
  try {
    return await prisma.savingGoal.findMany({
      where: { userId, ...(currency ? { currency } : {}) },
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    logger.error("getSavingGoals failed:", error)
    throw new Error("Error al obtener las metas de ahorro")
  }
}

export async function getSavingGoalById(id: number, userId: number) {
  try {
    return await prisma.savingGoal.findUnique({ where: { id, userId } })
  } catch (error) {
    logger.error("getSavingGoalById failed:", error)
    throw new Error("Error al obtener la meta de ahorro")
  }
}

export async function createSavingGoal(data: {
  name: string
  target: number
  saved: number
  color: string
  currency: string
  deadline?: Date
  userId: number
}) {
  try {
    return await prisma.savingGoal.create({ data })
  } catch (error) {
    logger.error("createSavingGoal failed:", error)
    throw new Error("Error al crear la meta de ahorro")
  }
}

export async function updateSavingGoal(
  id: number,
  userId: number,
  data: Partial<{
    name: string
    target: number
    saved: number
    color: string
    currency: string
    deadline: Date | null
  }>,
) {
  try {
    return await prisma.savingGoal.update({ where: { id, userId }, data })
  } catch (error) {
    logger.error("updateSavingGoal failed:", error)
    throw new Error("Error al actualizar la meta de ahorro")
  }
}

export async function deleteSavingGoal(id: number, userId: number) {
  try {
    await prisma.savingGoal.delete({ where: { id, userId } })
  } catch (error) {
    logger.error("deleteSavingGoal failed:", error)
    throw new Error("Error al eliminar la meta de ahorro")
  }
}