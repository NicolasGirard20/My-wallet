import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockPrisma, mockBcrypt } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  mockBcrypt: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

vi.mock("@/app/service/db", () => ({ prisma: mockPrisma }))
vi.mock("bcryptjs", () => ({ default: mockBcrypt }))
vi.mock("@/app/imports/dev", () => ({
  DEV: false,
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { changeUserPassword, validateUserLogin } from "@/app/service/auth.service"
import { createBudget, deleteBudget, updateBudget } from "@/app/service/budget.service"

describe("Services — auth.service y budget.service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("auth.service", () => {
    it("validateUserLogin devuelve null si el usuario no existe o la contraseña no coincide", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      expect(await validateUserLogin("ghost", "1234")).toBeNull()

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: "nico",
        passwordHash: "hash",
        name: "Nico",
        email: "n@e.com",
        role: "user",
      })
      mockBcrypt.compare.mockResolvedValue(false)
      expect(await validateUserLogin("nico", "bad")).toBeNull()
    })

    it("validateUserLogin omite passwordHash al autenticar correctamente", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: "nico",
        passwordHash: "secret-hash",
        name: "Nico",
        email: "n@e.com",
        role: "user",
      })
      mockBcrypt.compare.mockResolvedValue(true)

      const user = await validateUserLogin("nico", "good")
      expect(user).toEqual({
        id: 1,
        username: "nico",
        name: "Nico",
        email: "n@e.com",
        role: "user",
      })
      expect(user).not.toHaveProperty("passwordHash")
    })

    it("changeUserPassword valida contraseña actual y guarda nuevo hash", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: "nico",
        passwordHash: "old-hash",
      })
      mockBcrypt.compare.mockResolvedValue(false)
      await expect(changeUserPassword("nico", "wrong", "new123")).rejects.toThrow("Contraseña actual incorrecta")

      mockBcrypt.compare.mockResolvedValue(true)
      mockBcrypt.hash.mockResolvedValue("new-hash")
      mockPrisma.user.update.mockResolvedValue({})

      await changeUserPassword("nico", "correct", "new123")
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { username: "nico" },
        data: { passwordHash: "new-hash" },
      })
    })
  })

  describe("budget.service", () => {
    it("createBudget limpia recurringFrequency cuando isRecurring es false", async () => {
      mockPrisma.budget.create.mockResolvedValue({ id: 1 })
      const start = new Date("2026-05-01")
      const end = new Date("2026-05-31")

      await createBudget({
        name: "Comida",
        startDate: start,
        endDate: end,
        amountLimit: 10000,
        categoryId: 2,
        isRecurring: false,
        recurringFrequency: "monthly",
        userId: 5,
      })

      expect(mockPrisma.budget.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isRecurring: false,
          recurringFrequency: null,
          currency: "ARS",
        }),
      })
    })

    it("updateBudget y deleteBudget verifican pertenencia al usuario", async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null)
      await expect(updateBudget(99, 5, { name: "X" })).rejects.toThrow("Error al actualizar el presupuesto")
      await expect(deleteBudget(99, 5)).rejects.toThrow("Error al eliminar el presupuesto")

      mockPrisma.budget.findFirst.mockResolvedValue({ id: 99, userId: 5 })
      mockPrisma.budget.delete.mockResolvedValue({ id: 99 })
      await deleteBudget(99, 5)
      expect(mockPrisma.budget.delete).toHaveBeenCalledWith({ where: { id: 99 } })
    })
  })
})
