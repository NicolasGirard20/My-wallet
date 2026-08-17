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
    return await prisma.transaction.update({ where: { id, userId }, data })
  } catch (error) {
    logger.error("updateTransaction failed:", error)
    throw new Error("Error al actualizar la transacción")
  }
}

export async function deleteTransaction(id: number, userId: number) {
  try {
    await prisma.transaction.delete({ where: { id, userId } })
  } catch (error) {
    logger.error("deleteTransaction failed:", error)
    throw new Error("Error al eliminar la transacción")
  }
}