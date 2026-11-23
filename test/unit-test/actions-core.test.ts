import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  mockRequireSession,
  mockTxService,
  mockBudgetService,
  mockSavingService,
  mockCategoryService,
  mockUserService,
} = vi.hoisted(() => ({
  mockRequireSession: vi.fn(),
  mockTxService: {
    getTransactions: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
  mockBudgetService: {
    getBudgets: vi.fn(),
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
  },
  mockSavingService: {
    getSavingGoals: vi.fn(),
    createSavingGoal: vi.fn(),
    updateSavingGoal: vi.fn(),
    deleteSavingGoal: vi.fn(),
  },
  mockCategoryService: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
  mockUserService: {
    getUsers: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    getUserDataSize: vi.fn(),
  },
}))

vi.mock("@/app/lib/session", () => ({
  requireSession: mockRequireSession,
}))
vi.mock("@/app/service/transaction.service", () => mockTxService)
vi.mock("@/app/service/budget.service", () => mockBudgetService)
vi.mock("@/app/service/saving-goal.service", () => mockSavingService)
vi.mock("@/app/service/category.service", () => mockCategoryService)
vi.mock("@/app/service/user.service", () => mockUserService)
vi.mock("@/app/imports/dev", () => ({
  DEV: false,
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { createBudgetAction, updateBudgetAction } from "@/app/actions/budgets"
import { createCategoryAction, updateCategoryAction } from "@/app/actions/categories"
import { getExchangeRatesAction } from "@/app/actions/exchange"
import { createSavingGoalAction } from "@/app/actions/savings"
import { createTransactionAction, importTransactionsAction } from "@/app/actions/transactions"
import { deleteUserAction, getUsersAction } from "@/app/actions/users"

describe("Server Actions — validaciones de negocio y autorización", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireSession.mockResolvedValue({ userId: 10, username: "nico", role: "user" })
  })

  describe("transactions", () => {
    it("rechaza tipo, monto, descripción, categoría, moneda o fecha inválidos", async () => {
      await expect(
        createTransactionAction({
          kind: "transfer",
          amount: 100,
          description: "Test",
          categoryId: 1,
          currency: "ARS",
          date: "2026-05-01",
        }),
      ).rejects.toThrow("Tipo inválido")

      await expect(
        createTransactionAction({
          kind: "expense",
          amount: 0,
          description: "Test",
          categoryId: 1,
          currency: "ARS",
          date: "2026-05-01",
        }),
      ).rejects.toThrow("El monto debe ser mayor a 0")

      await expect(
        createTransactionAction({
          kind: "expense",
          amount: 100,
          description: "   ",
          categoryId: 1,
          currency: "ARS",
          date: "2026-05-01",
        }),
      ).rejects.toThrow("La descripción es obligatoria")

      await expect(
        createTransactionAction({
          kind: "expense",
          amount: 100,
          description: "Café",
          categoryId: 1,
          currency: "EUR",
          date: "2026-05-01",
        }),
      ).rejects.toThrow("Moneda inválida")

      await expect(
        createTransactionAction({
          kind: "expense",
          amount: 100,
          description: "Café",
          categoryId: 1,
          currency: "ARS",
          date: "fecha-mala",
        }),
      ).rejects.toThrow("Fecha inválida")
    })

    it("importTransactionsAction omite filas inválidas y crea solo las válidas", async () => {
      const now = new Date("2026-05-01T10:00:00.000Z")
      mockTxService.createTransaction.mockResolvedValue({
        id: 1,
        kind: "expense",
        amount: 500,
        description: "Supermercado",
        categoryId: 2,
        currency: "ARS",
        date: now,
        createdAt: now,
        updatedAt: now,
      })

      const imported = await importTransactionsAction([
        { kind: "expense", amount: -10, description: "Inválida", categoryId: 2, currency: "ARS", date: "2026-05-01" },
        { kind: "expense", amount: 500, description: "  Supermercado ", categoryId: 2, currency: "ARS", date: "2026-05-01" },
        { kind: "expense", amount: 100, description: "Bad currency", categoryId: 2, currency: "BRL", date: "2026-05-01" },
      ])

      expect(imported).toHaveLength(1)
      expect(mockTxService.createTransaction).toHaveBeenCalledTimes(1)
      expect(imported[0].description).toBe("Supermercado")
    })
  })

  describe("budgets", () => {
    it("rechaza fechas invertidas o frecuencia inválida cuando es recurrente", async () => {
      await expect(
        createBudgetAction({
          name: "Comida",
          startDate: "2026-06-10",
          endDate: "2026-06-01",
          amountLimit: 50000,
          categoryId: 1,
          currency: "ARS",
          checkingAccountId: null,
          isRecurring: false,
          recurringFrequency: null,
        }),
      ).rejects.toThrow("La fecha de inicio no puede ser posterior a la fecha de fin")

      await expect(
        createBudgetAction({
          name: "Comida",
          startDate: "2026-06-01",
          endDate: "2026-06-30",
          amountLimit: 50000,
          categoryId: 1,
          currency: "ARS",
          checkingAccountId: null,
          isRecurring: true,
          recurringFrequency: null,
        }),
      ).rejects.toThrow("Frecuencia de repetición inválida")
    })

    it("updateBudgetAction valida id y nombre vacío", async () => {
      await expect(updateBudgetAction(0, { name: "Nuevo" })).rejects.toThrow("ID inválido")
      await expect(updateBudgetAction(1, { name: "   " })).rejects.toThrow("El nombre no puede estar vacío")
    })
  })

  describe("savings & categories", () => {
    it("createSavingGoalAction valida meta, ahorro inicial y moneda", async () => {
      await expect(
        createSavingGoalAction({
          name: "Auto",
          target: 0,
          saved: 0,
          color: "--chart-1",
          currency: "USD",
        }),
      ).rejects.toThrow("La meta debe ser mayor a 0")

      await expect(
        createSavingGoalAction({
          name: "Auto",
          target: 1000,
          saved: -5,
          color: "--chart-1",
          currency: "USD",
        }),
      ).rejects.toThrow("El ahorro inicial debe ser un número válido")
    })

    it("categories valida tipo y sanitiza nombre en update", async () => {
      await expect(createCategoryAction({ name: "Ocio", kind: "other", color: "--chart-1" })).rejects.toThrow(
        "Tipo inválido",
      )

      mockCategoryService.updateCategory.mockResolvedValue({
        id: 4,
        name: "Ocio",
        kind: "expense",
        color: "--chart-2",
      })
      const updated = await updateCategoryAction(4, { name: "  Ocio  ", color: "--chart-2" })
      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(4, 10, {
        name: "Ocio",
        color: "--chart-2",
      })
      expect(updated.name).toBe("Ocio")
    })
  })

  describe("users (control de rol admin)", () => {
    it("bloquea getUsersAction si el usuario no es admin", async () => {
      mockRequireSession.mockResolvedValue({ userId: 10, username: "nico", role: "user" })
      await expect(getUsersAction()).rejects.toThrow("No autorizado. Se requiere rol de administrador.")
    })

    it("impide que un admin elimine su propio usuario", async () => {
      mockRequireSession.mockResolvedValue({ userId: 1, username: "admin", role: "admin" })
      const res = await deleteUserAction(1)
      expect(res).toEqual({ ok: false, error: "No podés eliminar tu propio usuario" })
      expect(mockUserService.deleteUser).not.toHaveBeenCalled()
    })
  })

  describe("exchange", () => {
    it("filtra cotizaciones válidas de DolarAPI y cachea el resultado", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            casa: "oficial",
            nombre: "Oficial",
            compra: 1000,
            venta: 1050,
            fechaActualizacion: "2026-05-01T12:00:00Z",
          },
          { invalido: true },
        ],
      })
      vi.stubGlobal("fetch", fetchMock)

      const snap1 = await getExchangeRatesAction(true)
      expect(snap1.rates).toHaveLength(1)
      expect(snap1.rates[0].casa).toBe("oficial")

      const snap2 = await getExchangeRatesAction(false)
      expect(snap2.rates).toEqual(snap1.rates)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      vi.unstubAllGlobals()
    })
  })
})
