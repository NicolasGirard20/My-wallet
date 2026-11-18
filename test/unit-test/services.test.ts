import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    savingGoal: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    investment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    investmentContribution: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    checkingAccount: {
      findMany: vi.fn(),
    },
    accountTransfer: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/app/service/db", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/app/imports/dev", () => ({
  DEV: false,
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

import { getCheckingAccounts } from "@/app/service/checking-account.service"
import {
  addContribution,
  createInvestment,
  deleteContribution,
  updateContribution,
} from "@/app/service/investment.service"
import { createSavingGoal, updateSavingGoal } from "@/app/service/saving-goal.service"

describe("saving-goal.service — no genera transacciones de gasto", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("createSavingGoal crea la meta sin generar ninguna transacción", async () => {
    mockPrisma.savingGoal.create.mockResolvedValue({ id: 1, name: "Viaje", target: 5000, saved: 1000 })

    await createSavingGoal({
      name: "Viaje",
      target: 5000,
      saved: 1000,
      color: "--chart-1",
      currency: "ARS",
      checkingAccountId: 1,
      userId: 1,
    })

    expect(mockPrisma.savingGoal.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled()
  })

  it("updateSavingGoal actualiza el ahorro sin generar ninguna transacción", async () => {
    mockPrisma.savingGoal.findUnique.mockResolvedValue({ id: 1, saved: 1000 })
    mockPrisma.savingGoal.update.mockResolvedValue({ id: 1, saved: 2500 })

    await updateSavingGoal(1, 1, { saved: 2500 })

    expect(mockPrisma.savingGoal.update).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
      data: { saved: 2500 },
    })
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled()
  })
})

describe("investment.service — valor invertido inicial fijo y sin transacciones", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma))
  })

  it("createInvestment guarda invested y currentValue sin crear transacción", async () => {
    mockPrisma.investment.create.mockResolvedValue({ id: 1, invested: 3000, currentValue: 3000 })

    await createInvestment({
      name: "CEDEARs",
      description: "Cartera",
      invested: 3000,
      currentValue: 3000,
      currency: "ARS",
      checkingAccountId: 1,
      userId: 1,
    })

    expect(mockPrisma.investment.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled()
  })

  it("addContribution incrementa solo currentValue y deja invested intacto", async () => {
    mockPrisma.investment.findUnique.mockResolvedValue({ name: "CEDEARs", checkingAccountId: 1 })
    mockPrisma.investmentContribution.create.mockResolvedValue({ id: 10, amount: 1200 })
    mockPrisma.investment.update.mockResolvedValue({ id: 1, invested: 3000, currentValue: 4200 })

    await addContribution(1, 1, {
      date: new Date("2026-11-17T00:00:00.000Z"),
      amount: 1200,
      currency: "ARS",
      note: "Aporte",
      userId: 1,
    })

    expect(mockPrisma.investment.update).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
      data: {
        currentValue: { increment: 1200 },
      },
    })
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled()
  })

  it("deleteContribution decrementa solo currentValue y deja invested intacto", async () => {
    mockPrisma.investmentContribution.findUnique.mockResolvedValue({
      id: 10,
      investmentId: 1,
      amount: 1200,
    })

    await deleteContribution(10, 1)

    expect(mockPrisma.investment.update).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
      data: {
        currentValue: { decrement: 1200 },
      },
    })
  })

  it("updateContribution ajusta solo currentValue con el delta y deja invested intacto", async () => {
    mockPrisma.investmentContribution.findUnique.mockResolvedValue({
      id: 10,
      investmentId: 1,
      amount: 1200,
    })
    mockPrisma.investmentContribution.update.mockResolvedValue({
      id: 10,
      investmentId: 1,
      amount: 1500,
    })

    await updateContribution(10, 1, {
      amount: 1500,
      date: new Date("2026-11-17T00:00:00.000Z"),
      note: "Ajuste",
    })

    expect(mockPrisma.investment.update).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
      data: {
        currentValue: { increment: 300 },
      },
    })
  })
})

describe("checking-account.service — excluye movimientos históricos de ahorros e inversiones", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("consulta transacciones excluyendo savingGoalId, investmentContributionId y categorías Ahorros/Inversiones", async () => {
    mockPrisma.checkingAccount.findMany.mockResolvedValue([
      { id: 1, name: "Principal", initialBalance: 10000, currency: "ARS" },
    ])
    mockPrisma.transaction.findMany.mockResolvedValue([
      { checkingAccountId: 1, kind: "expense", amount: 1500 },
    ])
    mockPrisma.accountTransfer.findMany.mockResolvedValue([])

    const accounts = await getCheckingAccounts(1)

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          savingGoalId: null,
          investmentContributionId: null,
          category: {
            name: {
              notIn: ["Ahorros", "Inversiones"],
            },
          },
        }),
      }),
    )
    expect(accounts[0].currentBalance).toBe(8500)
  })
})
