"use server"

import { requireSession } from "@/app/lib/session"
import * as service from "@/app/service/transaction.service"
import { logger } from "@/app/imports/dev"
import type { Currency, Transaction, TransactionKind } from "@/lib/types"

function mapTx(tx: {
  id: number
  kind: string
  amount: number
  description: string
  categoryId: number
  currency: string
  date: Date
  createdAt: Date
  updatedAt: Date
}): Transaction {
  return {
    id: tx.id,
    kind: tx.kind as TransactionKind,
    amount: tx.amount,
    description: tx.description,
    categoryId: tx.categoryId,
    currency: tx.currency as Currency,
    date: tx.date.toISOString(),
  }
}

function isCurrency(value: unknown): value is Currency {
  return value === "USD" || value === "ARS"
}

export async function getTransactionsAction() {
  try {
    const session = await requireSession()
    const transactions = await service.getTransactions(session.userId)
    return transactions.map(mapTx)
  } catch (error) {
    logger.error("getTransactionsAction failed:", error)
    throw new Error("Error al obtener las transacciones")
  }
}

export async function createTransactionAction(data: {
  kind: string
  amount: number
  description: string
  categoryId: number
  currency: string
  date: string
}) {
  try {
    const session = await requireSession()

    if (!["income", "expense"].includes(data.kind)) throw new Error("Tipo inválido")
    if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error("El monto debe ser mayor a 0")
    if (!data.description?.trim()) throw new Error("La descripción es obligatoria")
    if (!Number.isInteger(data.categoryId)) throw new Error("La categoría es obligatoria")
    if (!isCurrency(data.currency)) throw new Error("Moneda inválida")

    const parsedDate = new Date(data.date)
    if (isNaN(parsedDate.getTime())) throw new Error("Fecha inválida")

    const tx = await service.createTransaction({
      kind: data.kind,
      amount: data.amount,
      description: data.description.trim(),
      categoryId: data.categoryId,
      currency: data.currency,
      date: parsedDate,
      userId: session.userId,
    })

    return mapTx(tx)
  } catch (error) {
    logger.error("createTransactionAction failed:", error)
    throw error
  }
}

export async function importTransactionsAction(
  txs: Array<{
    kind: string
    amount: number
    description: string
    categoryId: number
    currency: string
    date: string
  }>,
) {
  try {
    const session = await requireSession()

    const results = []
    for (const tx of txs) {
      if (!Number.isFinite(tx.amount) || tx.amount <= 0) continue
      if (!tx.description?.trim()) continue
      if (!isCurrency(tx.currency)) continue

      const parsedDate = new Date(tx.date)
      if (isNaN(parsedDate.getTime())) continue

      const created = await service.createTransaction({
        kind: tx.kind,
        amount: tx.amount,
        description: tx.description.trim(),
        categoryId: tx.categoryId,
        currency: tx.currency,
        date: parsedDate,
        userId: session.userId,
      })

      results.push(mapTx(created))
    }

    return results
  } catch (error) {
    logger.error("importTransactionsAction failed:", error)
    throw error
  }
}

export async function updateTransactionAction(
  id: number,
  data: Partial<{
    kind: string
    amount: number
    description: string
    categoryId: number
    currency: string
    date: string
  }>,
) {
  try {
    const session = await requireSession()

    const updateData: Record<string, unknown> = {}

    if (data.kind !== undefined) {
      if (!["income", "expense"].includes(data.kind)) throw new Error("Tipo inválido")
      updateData.kind = data.kind
    }
    if (data.amount !== undefined) {
      if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error("El monto debe ser mayor a 0")
      updateData.amount = data.amount
    }
    if (data.description !== undefined) {
      if (!data.description.trim()) throw new Error("La descripción es obligatoria")
      updateData.description = data.description.trim()
    }
    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId
    }
    if (data.currency !== undefined) {
      if (!isCurrency(data.currency)) throw new Error("Moneda inválida")
      updateData.currency = data.currency
    }
    if (data.date !== undefined) {
      const parsedDate = new Date(data.date)
      if (isNaN(parsedDate.getTime())) throw new Error("Fecha inválida")
      updateData.date = parsedDate
    }

    const tx = await service.updateTransaction(id, session.userId, updateData)
    return mapTx(tx)
  } catch (error) {
    logger.error("updateTransactionAction failed:", error)
    throw error
  }
}

export async function deleteTransactionAction(id: number) {
  try {
    const session = await requireSession()
    await service.deleteTransaction(id, session.userId)
  } catch (error) {
    logger.error("deleteTransactionAction failed:", error)
    throw error
  }
}