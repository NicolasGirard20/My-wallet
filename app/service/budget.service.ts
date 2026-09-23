import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"

export async function getBudgets(userId: number) {
  try {
    return await prisma.budget.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
    })
  } catch (error) {
    logger.error("getBudgets failed:", error)
    throw new Error("Error al obtener los presupuestos")
  }
}

export async function createBudget(data: {
  name: string
  startDate: Date
  endDate: Date
  amountLimit: number
  categoryId: number | null
  userId: number
}) {
  try {
    return await prisma.budget.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        amountLimit: data.amountLimit,
        categoryId: data.categoryId,
        userId: data.userId,
      },
    })
  } catch (error) {
    logger.error("createBudget failed:", error)
    throw new Error("Error al crear el presupuesto")
  }
}

export async function updateBudget(
  id: number,
  userId: number,
  data: Partial<{
    name: string
    startDate: Date
    endDate: Date
    amountLimit: number
    categoryId: number | null
  }>
) {
  try {
    const existing = await prisma.budget.findFirst({ where: { id, userId } })
    if (!existing) {
      throw new Error("Presupuesto no encontrado")
    }

    return await prisma.budget.update({
      where: { id },
      data,
    })
  } catch (error) {
    logger.error("updateBudget failed:", error)
    throw new Error("Error al actualizar el presupuesto")
  }
}

export async function deleteBudget(id: number, userId: number) {
  try {
    const existing = await prisma.budget.findFirst({ where: { id, userId } })
    if (!existing) {
      throw new Error("Presupuesto no encontrado")
    }

    await prisma.budget.delete({ where: { id } })
  } catch (error) {
    logger.error("deleteBudget failed:", error)
    throw new Error("Error al eliminar el presupuesto")
  }
}
