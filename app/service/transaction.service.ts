import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"

import type { Prisma } from "@prisma/client"

export async function getTransactions(userId: number, filters?: {
  kind?: string
  categoryId?: number
  currency?: string
  from?: Date
  to?: Date
}) {
  try {
    const where: Prisma.TransactionWhereInput = { userId }

    if (filters?.kind) where.kind = filters.kind
    if (filters?.categoryId) where.categoryId = filters.categoryId
    if (filters?.currency) where.currency = filters.currency
    if (filters?.from || filters?.to) {
      where.date = {}
      if (filters.from) where.date.gte = filters.from
      if (filters.to) where.date.lte = filters.to
    }

    return await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
    })
  } catch (error) {
    logger.error("getTransactions failed:", error)
    throw new Error("Error al obtener las transacciones")
  }
}

export async function getTransactionById(id: number, userId: number) {
  try {
    return await prisma.transaction.findUnique({ where: { id, userId } })
  } catch (error) {
    logger.error("getTransactionById failed:", error)
    throw new Error("Error al obtener la transacción")
  }
}

export async function createTransaction(data: {
  kind: string
  amount: number
  description: string
  categoryId: number
  currency: string
  date: Date
  userId: number
}) {
  try {
    return await prisma.transaction.create({ data })
  } catch (error) {
    logger.error("createTransaction failed:", error)
    throw new Error("Error al crear la transacción")
  }
}

export async function updateTransaction(
  id: number,
  userId: number,
  data: Partial<{
    kind: string
    amount: number
    description: string
    categoryId: number
    currency: string
    date: Date
  }>,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const previous = await tx.transaction.findUnique({ where: { id, userId } })
      if (!previous) throw new Error("Transacción no encontrada")

      const transaction = await tx.transaction.update({ where: { id, userId }, data })

      if (previous.savingGoalId && data.amount !== undefined) {
        const goal = await tx.savingGoal.findUnique({
          where: { id: previous.savingGoalId, userId },
        })
        if (goal) {
          const kind = data.kind ?? previous.kind
          const delta = data.amount - previous.amount
          const adjustment = kind === "expense" ? delta : -delta
          const newSaved = Math.max(0, goal.saved + adjustment)
          await tx.savingGoal.update({
            where: { id: goal.id },
            data: { saved: newSaved },
          })
        }
      }

      if (previous.investmentContributionId && data.amount !== undefined) {
        const contrib = await tx.investmentContribution.findUnique({
          where: { id: previous.investmentContributionId, userId },
        })
        if (contrib) {
          const kind = data.kind ?? previous.kind
          const delta = data.amount - previous.amount
          const adjustment = kind === "expense" ? delta : -delta
          const newInvested = Math.max(0, contrib.amount + adjustment)
          await tx.investmentContribution.update({
            where: { id: contrib.id },
            data: { amount: data.amount > 0 ? data.amount : -data.amount },
          })
          await tx.investment.update({
            where: { id: contrib.investmentId, userId },
            data: {
              invested: { increment: adjustment },
              currentValue: { increment: adjustment },
            },
          })
        }
      }

      return transaction
    })
  } catch (error) {
    logger.error("updateTransaction failed:", error)
    throw new Error("Error al actualizar la transacción")
  }
}

export async function deleteTransaction(id: number, userId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id, userId } })
      if (!transaction) throw new Error("Transacción no encontrada")

      if (transaction.savingGoalId) {
        const goal = await tx.savingGoal.findUnique({
          where: { id: transaction.savingGoalId, userId },
        })
        if (goal) {
          const adjustment = transaction.kind === "expense" ? -transaction.amount : transaction.amount
          const newSaved = Math.max(0, goal.saved + adjustment)
          await tx.savingGoal.update({
            where: { id: goal.id },
            data: { saved: newSaved },
          })
        }
      }

      if (transaction.investmentContributionId) {
        const contrib = await tx.investmentContribution.findUnique({
          where: { id: transaction.investmentContributionId, userId },
        })
        if (contrib) {
          const adjustment = transaction.kind === "expense" ? -transaction.amount : transaction.amount
          const newInvested = Math.max(0, contrib.amount + adjustment)
          await tx.investmentContribution.update({
            where: { id: contrib.id },
            data: { amount: newInvested },
          })
          await tx.investment.update({
            where: { id: contrib.investmentId, userId },
            data: {
              invested: { increment: adjustment },
              currentValue: { increment: adjustment },
            },
          })
        }
      }

      await tx.transaction.delete({ where: { id, userId } })
    })
  } catch (error) {
    logger.error("deleteTransaction failed:", error)
    throw new Error("Error al eliminar la transacción")
  }
}