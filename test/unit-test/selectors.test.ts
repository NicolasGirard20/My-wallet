import { describe, expect, it } from "vitest"
import {
  calculateBudgetConsumption,
  categoryBreakdownCrossCurrency,
  getEffectiveBudgetPeriod,
  isSavingsOrInvestmentTransaction,
  totals,
  totalsCrossCurrency,
} from "@/lib/selectors"
import type { Budget, Category, Transaction } from "@/lib/types"

const CATEGORIES: Category[] = [
  { id: 1, name: "Comida", kind: "expense", color: "--chart-1" },
  { id: 2, name: "Sueldo", kind: "income", color: "--chart-2" },
  { id: 3, name: "Ahorros", kind: "expense", color: "--chart-3" },
  { id: 4, name: "Inversiones", kind: "expense", color: "--chart-4" },
]

const identityConvert = (amount: number) => amount

describe("isSavingsOrInvestmentTransaction", () => {
  it("detecta transacciones vinculadas a metas de ahorro o aportes de inversión", () => {
    const savingTx: Transaction = {
      id: 1,
      kind: "expense",
      amount: 500,
      description: "Movimiento",
      categoryId: 1,
      currency: "ARS",
      date: "2026-11-10T10:00:00.000Z",
      savingGoalId: 7,
    }
    const investmentTx: Transaction = {
      id: 2,
      kind: "expense",
      amount: 1000,
      description: "Movimiento",
      categoryId: 1,
      currency: "ARS",
      date: "2026-11-10T10:00:00.000Z",
      investmentContributionId: 4,
    }

    expect(isSavingsOrInvestmentTransaction(savingTx, CATEGORIES)).toBe(true)
    expect(isSavingsOrInvestmentTransaction(investmentTx, CATEGORIES)).toBe(true)
  })

  it("detecta transacciones con categorías o descripciones históricas de Ahorros/Inversiones", () => {
    const byCategory: Transaction = {
      id: 3,
      kind: "expense",
      amount: 800,
      description: "Transferencia manual",
      categoryId: 3,
      currency: "ARS",
      date: "2026-11-10T10:00:00.000Z",
    }
    const byDescription: Transaction = {
      id: 4,
      kind: "expense",
      amount: 1200,
      description: "Inversión inicial en CEDEARs",
      categoryId: 1,
      currency: "ARS",
      date: "2026-11-10T10:00:00.000Z",
    }
    const normalExpense: Transaction = {
      id: 5,
      kind: "expense",
      amount: 450,
      description: "Supermercado",
      categoryId: 1,
      currency: "ARS",
      date: "2026-11-10T10:00:00.000Z",
    }

    expect(isSavingsOrInvestmentTransaction(byCategory, CATEGORIES)).toBe(true)
    expect(isSavingsOrInvestmentTransaction(byDescription, CATEGORIES)).toBe(true)
    expect(isSavingsOrInvestmentTransaction(normalExpense, CATEGORIES)).toBe(false)
  })
})

describe("exclusión de ahorros e inversiones en totales y desgloses", () => {
  const txs: Transaction[] = [
    {
      id: 1,
      kind: "income",
      amount: 5000,
      description: "Sueldo",
      categoryId: 2,
      currency: "ARS",
      date: "2026-11-05T12:00:00.000Z",
    },
    {
      id: 2,
      kind: "expense",
      amount: 1500,
      description: "Compra semanal",
      categoryId: 1,
      currency: "ARS",
      date: "2026-11-06T12:00:00.000Z",
    },
    {
      id: 3,
      kind: "expense",
      amount: 2000,
      description: "Depósito a Fondo",
      categoryId: 3,
      currency: "ARS",
      date: "2026-11-07T12:00:00.000Z",
      savingGoalId: 10,
    },
    {
      id: 4,
      kind: "expense",
      amount: 3000,
      description: "Aporte a Acciones",
      categoryId: 4,
      currency: "ARS",
      date: "2026-11-08T12:00:00.000Z",
      investmentContributionId: 20,
    },
  ]

  it("no contabiliza ahorros ni inversiones en totals ni totalsCrossCurrency", () => {
    expect(totals(txs, CATEGORIES)).toEqual({
      income: 5000,
      expense: 1500,
      balance: 3500,
    })

    expect(totalsCrossCurrency(txs, identityConvert, CATEGORIES)).toEqual({
      income: 5000,
      expense: 1500,
      balance: 3500,
    })
  })

  it("excluye ahorros e inversiones del desglose por categoría", () => {
    const slices = categoryBreakdownCrossCurrency(txs, CATEGORIES, "expense", identityConvert)
    expect(slices).toHaveLength(1)
    expect(slices[0]).toMatchObject({ name: "Comida", value: 1500 })
  })
})

describe("getEffectiveBudgetPeriod & calculateBudgetConsumption", () => {
  const baseBudget: Budget = {
    id: 1,
    name: "Presupuesto Test",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-01-31T23:59:59.999Z",
    amountLimit: 3000,
    categoryId: 1,
    currency: "ARS",
    isRecurring: true,
    recurringFrequency: "monthly",
  }

  const refNow = new Date("2026-11-18T15:30:00.000Z") // miércoles 18 nov 2026

  it("calcula el período diario correctamente", () => {
    const { start, end } = getEffectiveBudgetPeriod(
      { ...baseBudget, recurringFrequency: "daily" },
      refNow,
    )
    expect(start.toISOString()).toBe("2026-11-18T00:00:00.000Z")
    expect(end.toISOString()).toBe("2026-11-18T23:59:59.999Z")
  })

  it("calcula el período semanal (lunes a domingo) correctamente", () => {
    const { start, end } = getEffectiveBudgetPeriod(
      { ...baseBudget, recurringFrequency: "weekly" },
      refNow,
    )
    expect(start.toISOString()).toBe("2026-11-16T00:00:00.000Z")
    expect(end.toISOString()).toBe("2026-11-22T23:59:59.999Z")
  })

  it("calcula el período mensual correctamente", () => {
    const { start, end } = getEffectiveBudgetPeriod(
      { ...baseBudget, recurringFrequency: "monthly" },
      refNow,
    )
    expect(start.toISOString()).toBe("2026-11-01T00:00:00.000Z")
    expect(end.toISOString()).toBe("2026-11-30T23:59:59.999Z")
  })

  it("calcula el período anual correctamente", () => {
    const { start, end } = getEffectiveBudgetPeriod(
      { ...baseBudget, recurringFrequency: "yearly" },
      refNow,
    )
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z")
    expect(end.toISOString()).toBe("2026-12-31T23:59:59.999Z")
  })

  it("respeta startDate/endDate fijos cuando no es repetitivo", () => {
    const { start, end } = getEffectiveBudgetPeriod(
      { ...baseBudget, isRecurring: false, recurringFrequency: null },
      refNow,
    )
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z")
    expect(end.toISOString()).toBe("2026-01-31T23:59:59.999Z")
  })

  it("calcula el consumo usando el período activo actual y excluyendo ahorros/inversiones", () => {
    const now = new Date()
    const currentMonthDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), Math.min(15, now.getUTCDate() || 15), 12, 0, 0),
    ).toISOString()

    const txs: Transaction[] = [
      {
        id: 1,
        kind: "expense",
        amount: 1500,
        description: "Supermercado",
        categoryId: 1,
        currency: "ARS",
        date: currentMonthDate,
      },
      {
        id: 2,
        kind: "expense",
        amount: 5000,
        description: "Aporte a inversión",
        categoryId: 1,
        currency: "ARS",
        date: currentMonthDate,
        investmentContributionId: 99,
      },
    ]

    const result = calculateBudgetConsumption(baseBudget, txs, identityConvert, CATEGORIES)
    expect(result.spent).toBe(1500)
    expect(result.percentage).toBe(50)
    expect(result.status).toBe("normal")
  })
})
