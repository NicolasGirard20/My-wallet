"use server"

import { requireSession } from "@/app/lib/session"
import * as service from "@/app/service/checking-account.service"
import { logger } from "@/app/imports/dev"
import type { CheckingAccount, AccountTransfer, Currency } from "@/lib/types"

function isCurrency(value: unknown): value is Currency {
  return value === "USD" || value === "ARS"
}

function mapAccount(a: {
  id: number
  name: string
  bankName: string | null
  accountNumber: string | null
  cbuOrAlias: string | null
  currency: string
  initialBalance: number
  overdraftLimit: number
  color: string
  isDefault: boolean
  isActive: boolean
  currentBalance?: number
  createdAt: Date
}): CheckingAccount {
  return {
    id: a.id,
    name: a.name,
    bankName: a.bankName ?? undefined,
    accountNumber: a.accountNumber ?? undefined,
    cbuOrAlias: a.cbuOrAlias ?? undefined,
    currency: a.currency as Currency,
    initialBalance: a.initialBalance,
    overdraftLimit: a.overdraftLimit,
    color: a.color,
    isDefault: a.isDefault,
    isActive: a.isActive,
    currentBalance: a.currentBalance,
    createdAt: a.createdAt.toISOString(),
  }
}

function mapTransfer(t: {
  id: number
  sourceAccountId: number
  targetAccountId: number
  sourceAmount: number
  targetAmount: number
  exchangeRate: number | null
  date: Date
  description: string | null
}): AccountTransfer {
  return {
    id: t.id,
    sourceAccountId: t.sourceAccountId,
    targetAccountId: t.targetAccountId,
    sourceAmount: t.sourceAmount,
    targetAmount: t.targetAmount,
    exchangeRate: t.exchangeRate ?? undefined,
    date: t.date.toISOString(),
    description: t.description ?? undefined,
  }
}

export async function getCheckingAccountsAction(): Promise<CheckingAccount[]> {
  try {
    const session = await requireSession()
    const accounts = await service.getCheckingAccounts(session.userId)
    return accounts.map(mapAccount)
  } catch (error) {
    logger.error("getCheckingAccountsAction failed:", error)
    throw new Error("Error al obtener las cuentas corrientes")
  }
}

export async function createCheckingAccountAction(data: {
  name: string
  bankName?: string
  accountNumber?: string
  cbuOrAlias?: string
  currency: string
  initialBalance?: number
  overdraftLimit?: number
  color?: string
  isDefault?: boolean
}): Promise<CheckingAccount> {
  try {
    const session = await requireSession()

    if (!data.name?.trim()) throw new Error("El nombre de la cuenta es obligatorio")
    if (!isCurrency(data.currency)) throw new Error("Moneda inválida")
    if (data.initialBalance !== undefined && !Number.isFinite(data.initialBalance)) {
      throw new Error("Saldo inicial inválido")
    }
    if (data.overdraftLimit !== undefined && (!Number.isFinite(data.overdraftLimit) || data.overdraftLimit < 0)) {
      throw new Error("El límite de descubierto debe ser mayor o igual a 0")
    }

    const created = await service.createCheckingAccount(session.userId, {
      name: data.name.trim(),
      bankName: data.bankName?.trim() || undefined,
      accountNumber: data.accountNumber?.trim() || undefined,
      cbuOrAlias: data.cbuOrAlias?.trim() || undefined,
      currency: data.currency,
      initialBalance: data.initialBalance ?? 0,
      overdraftLimit: data.overdraftLimit ?? 0,
      color: data.color?.trim() || "--chart-1",
      isDefault: Boolean(data.isDefault),
    })

    return mapAccount({ ...created, currentBalance: created.initialBalance })
  } catch (error) {
    logger.error("createCheckingAccountAction failed:", error)
    throw new Error("Error al crear la cuenta corriente")
  }
}

export async function updateCheckingAccountAction(
  id: number,
  data: Partial<{
    name: string
    bankName?: string
    accountNumber?: string
    cbuOrAlias?: string
    currency?: string
    initialBalance?: number
    overdraftLimit?: number
    color?: string
    isDefault?: boolean
    isActive?: boolean
  }>,
): Promise<CheckingAccount> {
  try {
    const session = await requireSession()
    if (!Number.isInteger(id)) throw new Error("ID inválido")

    const payload: Parameters<typeof service.updateCheckingAccount>[2] = {}
    if (data.name !== undefined) {
      if (!data.name.trim()) throw new Error("El nombre no puede estar vacío")
      payload.name = data.name.trim()
    }
    if (data.bankName !== undefined) payload.bankName = data.bankName.trim() || undefined
    if (data.accountNumber !== undefined) payload.accountNumber = data.accountNumber.trim() || undefined
    if (data.cbuOrAlias !== undefined) payload.cbuOrAlias = data.cbuOrAlias.trim() || undefined
    if (data.currency !== undefined) {
      if (!isCurrency(data.currency)) throw new Error("Moneda inválida")
      payload.currency = data.currency
    }
    if (data.initialBalance !== undefined) {
      if (!Number.isFinite(data.initialBalance)) throw new Error("Saldo inválido")
      payload.initialBalance = data.initialBalance
    }
    if (data.overdraftLimit !== undefined) {
      if (!Number.isFinite(data.overdraftLimit) || data.overdraftLimit < 0) {
        throw new Error("Límite de descubierto inválido")
      }
      payload.overdraftLimit = data.overdraftLimit
    }
    if (data.color !== undefined) payload.color = data.color
    if (data.isDefault !== undefined) payload.isDefault = data.isDefault
    if (data.isActive !== undefined) payload.isActive = data.isActive

    const updated = await service.updateCheckingAccount(id, session.userId, payload)
    return mapAccount(updated)
  } catch (error) {
    logger.error("updateCheckingAccountAction failed:", error)
    throw new Error("Error al actualizar la cuenta corriente")
  }
}

export async function deleteCheckingAccountAction(id: number): Promise<void> {
  try {
    const session = await requireSession()
    if (!Number.isInteger(id)) throw new Error("ID inválido")
    await service.deleteCheckingAccount(id, session.userId)
  } catch (error) {
    logger.error("deleteCheckingAccountAction failed:", error)
    throw new Error("Error al eliminar la cuenta corriente")
  }
}

export async function createAccountTransferAction(data: {
  sourceAccountId: number
  targetAccountId: number
  sourceAmount: number
  targetAmount: number
  exchangeRate?: number
  date?: string
  description?: string
}): Promise<AccountTransfer> {
  try {
    const session = await requireSession()

    if (!Number.isInteger(data.sourceAccountId) || !Number.isInteger(data.targetAccountId)) {
      throw new Error("Cuentas inválidas")
    }
    if (data.sourceAccountId === data.targetAccountId) {
      throw new Error("La cuenta de origen y destino no pueden ser la misma")
    }
    if (!Number.isFinite(data.sourceAmount) || data.sourceAmount <= 0) {
      throw new Error("El monto de origen debe ser mayor a 0")
    }
    if (!Number.isFinite(data.targetAmount) || data.targetAmount <= 0) {
      throw new Error("El monto de destino debe ser mayor a 0")
    }

    const parsedDate = data.date ? new Date(data.date) : new Date()

    const transfer = await service.createAccountTransfer(session.userId, {
      sourceAccountId: data.sourceAccountId,
      targetAccountId: data.targetAccountId,
      sourceAmount: data.sourceAmount,
      targetAmount: data.targetAmount,
      exchangeRate: data.exchangeRate,
      date: parsedDate,
      description: data.description?.trim(),
    })

    return mapTransfer(transfer)
  } catch (error) {
    logger.error("createAccountTransferAction failed:", error)
    throw new Error("Error al realizar la transferencia")
  }
}

export async function getAccountTransfersAction(): Promise<AccountTransfer[]> {
  try {
    const session = await requireSession()
    const transfers = await service.getAccountTransfers(session.userId)
    return transfers.map(mapTransfer)
  } catch (error) {
    logger.error("getAccountTransfersAction failed:", error)
    throw new Error("Error al obtener las transferencias")
  }
}
