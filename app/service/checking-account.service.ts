import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"

export async function getCheckingAccounts(userId: number) {
  try {
    const accounts = await prisma.checkingAccount.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    })

    if (accounts.length === 0) {
      return []
    }

    const accountIds = accounts.map((a) => a.id)

    // Calculate income and expense sums per account
    const txs = await prisma.transaction.findMany({
      where: {
        userId,
        checkingAccountId: { in: accountIds },
      },
      select: {
        checkingAccountId: true,
        kind: true,
        amount: true,
      },
    })

    // Calculate transfers from and to per account
    const transfers = await prisma.accountTransfer.findMany({
      where: {
        userId,
        OR: [
          { sourceAccountId: { in: accountIds } },
          { targetAccountId: { in: accountIds } },
        ],
      },
      select: {
        sourceAccountId: true,
        targetAccountId: true,
        sourceAmount: true,
        targetAmount: true,
      },
    })

    const balanceMap = new Map<number, number>()
    for (const a of accounts) {
      balanceMap.set(a.id, a.initialBalance)
    }

    for (const t of txs) {
      if (!t.checkingAccountId) continue
      const current = balanceMap.get(t.checkingAccountId) ?? 0
      if (t.kind === "income") {
        balanceMap.set(t.checkingAccountId, current + t.amount)
      } else {
        balanceMap.set(t.checkingAccountId, current - t.amount)
      }
    }

    for (const tr of transfers) {
      const srcBal = balanceMap.get(tr.sourceAccountId)
      if (srcBal !== undefined) {
        balanceMap.set(tr.sourceAccountId, srcBal - tr.sourceAmount)
      }
      const tgtBal = balanceMap.get(tr.targetAccountId)
      if (tgtBal !== undefined) {
        balanceMap.set(tr.targetAccountId, tgtBal + tr.targetAmount)
      }
    }

    return accounts.map((a) => ({
      ...a,
      currentBalance: balanceMap.get(a.id) ?? a.initialBalance,
    }))
  } catch (error) {
    logger.error("getCheckingAccounts failed:", error)
    throw new Error("Error al obtener las cuentas corrientes")
  }
}

export async function getCheckingAccountById(id: number, userId: number) {
  try {
    return await prisma.checkingAccount.findFirst({
      where: { id, userId, isActive: true },
    })
  } catch (error) {
    logger.error("getCheckingAccountById failed:", error)
    throw new Error("Error al obtener la cuenta corriente")
  }
}

export async function createCheckingAccount(
  userId: number,
  data: {
    name: string
    bankName?: string
    accountNumber?: string
    cbuOrAlias?: string
    currency: string
    initialBalance?: number
    overdraftLimit?: number
    color?: string
    isDefault?: boolean
  },
) {
  try {
    return await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.checkingAccount.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        })
      }

      return await tx.checkingAccount.create({
        data: {
          name: data.name,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          cbuOrAlias: data.cbuOrAlias,
          currency: data.currency,
          initialBalance: data.initialBalance ?? 0,
          overdraftLimit: data.overdraftLimit ?? 0,
          color: data.color ?? "--chart-1",
          isDefault: data.isDefault ?? false,
          isActive: true,
          userId,
        },
      })
    })
  } catch (error) {
    logger.error("createCheckingAccount failed:", error)
    throw new Error("Error al crear la cuenta corriente")
  }
}

export async function updateCheckingAccount(
  id: number,
  userId: number,
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
) {
  try {
    return await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.checkingAccount.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        })
      }

      return await tx.checkingAccount.update({
        where: { id, userId },
        data,
      })
    })
  } catch (error) {
    logger.error("updateCheckingAccount failed:", error)
    throw new Error("Error al actualizar la cuenta corriente")
  }
}

export async function deleteCheckingAccount(id: number, userId: number) {
  try {
    // Soft delete to maintain transactions history
    return await prisma.checkingAccount.update({
      where: { id, userId },
      data: { isActive: false, isDefault: false },
    })
  } catch (error) {
    logger.error("deleteCheckingAccount failed:", error)
    throw new Error("Error al eliminar la cuenta corriente")
  }
}

export async function createAccountTransfer(
  userId: number,
  data: {
    sourceAccountId: number
    targetAccountId: number
    sourceAmount: number
    targetAmount: number
    exchangeRate?: number
    date?: Date
    description?: string
  },
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const source = await tx.checkingAccount.findFirst({
        where: { id: data.sourceAccountId, userId, isActive: true },
      })
      const target = await tx.checkingAccount.findFirst({
        where: { id: data.targetAccountId, userId, isActive: true },
      })

      if (!source || !target) {
        throw new Error("Cuenta de origen o destino no encontrada")
      }

      return await tx.accountTransfer.create({
        data: {
          sourceAccountId: data.sourceAccountId,
          targetAccountId: data.targetAccountId,
          sourceAmount: data.sourceAmount,
          targetAmount: data.targetAmount,
          exchangeRate: data.exchangeRate,
          date: data.date ?? new Date(),
          description: data.description,
          userId,
        },
      })
    })
  } catch (error) {
    logger.error("createAccountTransfer failed:", error)
    throw new Error("Error al registrar la transferencia entre cuentas")
  }
}

export async function getAccountTransfers(userId: number) {
  try {
    return await prisma.accountTransfer.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    })
  } catch (error) {
    logger.error("getAccountTransfers failed:", error)
    throw new Error("Error al obtener las transferencias")
  }
}
