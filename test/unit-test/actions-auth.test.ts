import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  mockGetSession,
  mockRequireSession,
  mockValidateUserLogin,
  mockChangeUserPassword,
  mockGetUserById,
  mockUpdateUserThemePalette,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRequireSession: vi.fn(),
  mockValidateUserLogin: vi.fn(),
  mockChangeUserPassword: vi.fn(),
  mockGetUserById: vi.fn(),
  mockUpdateUserThemePalette: vi.fn(),
}))

vi.mock("@/app/lib/session", () => ({
  getSession: mockGetSession,
  requireSession: mockRequireSession,
}))

vi.mock("@/app/service/auth.service", () => ({
  validateUserLogin: mockValidateUserLogin,
  changeUserPassword: mockChangeUserPassword,
}))

vi.mock("@/app/service/user.service", () => ({
  getUserById: mockGetUserById,
  updateUserThemePalette: mockUpdateUserThemePalette,
}))

vi.mock("@/app/imports/dev", () => ({
  DEV: false,
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import {
  changePasswordAction,
  getCurrentUserAction,
  getSessionAction,
  loginAction,
  logoutAction,
  updateThemePaletteAction,
} from "@/app/actions/auth"

describe("app/actions/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("loginAction", () => {
    it("rechaza usuario o contraseña vacíos", async () => {
      expect(await loginAction("", "123456")).toEqual({
        ok: false,
        error: "Usuario y contraseña son obligatorios",
      })
      expect(await loginAction("nico", "   ")).toEqual({
        ok: false,
        error: "Usuario y contraseña son obligatorios",
      })
      expect(mockValidateUserLogin).not.toHaveBeenCalled()
    })

    it("devuelve error si las credenciales son inválidas", async () => {
      mockValidateUserLogin.mockResolvedValue(null)
      const res = await loginAction("nico", "wrong")
      expect(res).toEqual({ ok: false, error: "Credenciales inválidas" })
    })

    it("guarda la sesión y normaliza el usuario cuando el login es válido", async () => {
      const save = vi.fn().mockResolvedValue(undefined)
      const sessionObj: Record<string, unknown> = { save }
      mockGetSession.mockResolvedValue(sessionObj)
      mockValidateUserLogin.mockResolvedValue({
        id: 7,
        username: "nico",
        name: "Nico",
        email: "nico@example.com",
        role: "admin",
        themePalette: "palette-inexistente",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      })

      const res = await loginAction("  nico  ", "secret123")

      expect(mockValidateUserLogin).toHaveBeenCalledWith("nico", "secret123")
      expect(save).toHaveBeenCalledTimes(1)
      expect(sessionObj.userId).toBe(7)
      expect(sessionObj.username).toBe("nico")
      expect(sessionObj.role).toBe("admin")
      expect(res.ok).toBe(true)
      if (res.ok && res.user) {
        expect(res.user.id).toBe(7)
        expect(res.user.createdAt).toBe("2026-01-01T00:00:00.000Z")
        expect(res.user.themePalette).toBeDefined()
      }
    })
  })

  describe("logoutAction", () => {
    it("destruye la sesión y devuelve ok: true", async () => {
      const destroy = vi.fn()
      mockGetSession.mockResolvedValue({ destroy })
      const res = await logoutAction()
      expect(destroy).toHaveBeenCalledTimes(1)
      expect(res).toEqual({ ok: true })
    })
  })

  describe("getSessionAction y getCurrentUserAction", () => {
    it("devuelve null cuando no hay userId en sesión", async () => {
      mockGetSession.mockResolvedValue({})
      expect(await getSessionAction()).toBeNull()
      expect(await getCurrentUserAction()).toBeNull()
    })

    it("devuelve datos de sesión y usuario cuando existe userId", async () => {
      mockGetSession.mockResolvedValue({ userId: 3, username: "ana", role: "user" })
      mockGetUserById.mockResolvedValue({ id: 3, username: "ana", name: "Ana", email: "a@a.com", role: "user" })

      expect(await getSessionAction()).toEqual({ userId: 3, username: "ana", role: "user" })
      expect(await getCurrentUserAction()).toMatchObject({ id: 3, username: "ana" })
      expect(mockGetUserById).toHaveBeenCalledWith(3)
    })
  })

  describe("updateThemePaletteAction", () => {
    it("rechaza si no está autorizado", async () => {
      mockRequireSession.mockRejectedValue(new Error("No autorizado"))
      const res = await updateThemePaletteAction("emerald")
      expect(res).toEqual({ ok: false, error: "No autorizado" })
    })

    it("rechaza una paleta inválida", async () => {
      mockRequireSession.mockResolvedValue({ userId: 1 })
      const res = await updateThemePaletteAction("paleta-que-no-existe")
      expect(res).toEqual({ ok: false, error: "Paleta de tema inválida" })
      expect(mockUpdateUserThemePalette).not.toHaveBeenCalled()
    })
  })

  describe("changePasswordAction", () => {
    it("requiere sesión y nueva contraseña de al menos 6 caracteres", async () => {
      mockGetSession.mockResolvedValue({})
      expect(await changePasswordAction("old", "123456")).toEqual({ ok: false, error: "No autorizado" })

      mockGetSession.mockResolvedValue({ userId: 1, username: "nico" })
      expect(await changePasswordAction("old", "123")).toEqual({
        ok: false,
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      })
    })

    it("llama a changeUserPassword cuando los datos son válidos", async () => {
      mockGetSession.mockResolvedValue({ userId: 1, username: "nico" })
      mockChangeUserPassword.mockResolvedValue(undefined)

      const res = await changePasswordAction("oldpass", "newpass123")
      expect(mockChangeUserPassword).toHaveBeenCalledWith("nico", "oldpass", "newpass123")
      expect(res).toEqual({ ok: true })
    })
  })
})
