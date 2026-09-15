import { prisma } from "@/app/service/db"
import { getOrCreateSavingsCategory } from "@/app/service/category.service"
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
  checkingAccountId?: number | null
  userId: number
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const goal = await tx.savingGoal.create({ data })

      if (goal.saved > 0) {
        const cat = await getOrCreateSavingsCategory(data.userId, "expense", tx)
        await tx.transaction.create({
          data: {
            kind: "expense",
            amount: goal.saved,
            description: `Depósito a ${goal.name}`,
            categoryId: cat.id,
            currency: goal.currency,
            checkingAccountId: goal.checkingAccountId ?? null,
            date: new Date(),
            userId: data.userId,
            savingGoalId: goal.id,
          },
        })
      }

      return goal
    })
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
    checkingAccountId: number | null
  }>,
  explicitCheckingAccountId?: number | null,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const previous = await tx.savingGoal.findUnique({ where: { id, userId } })
      if (!previous) throw new Error("Meta de ahorro no encontrada")

      const goal = await tx.savingGoal.update({ where: { id, userId }, data })

      if (data.saved !== undefined) {
        const delta = goal.saved - previous.saved
        if (delta !== 0) {
          const kind = delta > 0 ? "expense" : "income"
          const cat = await getOrCreateSavingsCategory(userId, kind, tx)
          const targetAccountId = explicitCheckingAccountId !== undefined ? explicitCheckingAccountId : goal.checkingAccountId
          await tx.transaction.create({
            data: {
              kind,
              amount: Math.abs(delta),
              description: delta > 0 ? `Depósito a ${goal.name}` : `Extracción de ${goal.name}`,
              categoryId: cat.id,
              currency: goal.currency,
              checkingAccountId: targetAccountId ?? null,
              date: new Date(),
              userId,
              savingGoalId: goal.id,
            },
          })
        }
      }

      return goal
    })
  } catch (error) {
    logger.error("updateSavingGoal failed:", error)
    if (error instanceof Error) {
      logger.error("updateSavingGoal cause:", error.message, error.stack)
    }
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