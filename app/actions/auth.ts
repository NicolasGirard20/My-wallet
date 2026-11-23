"use server"

import { getSession, requireSession } from "@/app/lib/session"
import {
  validateUserLogin,
  changeUserPassword,
} from "@/app/service/auth.service"
import { getUserById, updateUserThemePalette } from "@/app/service/user.service"
import {
  DEFAULT_THEME_PALETTE,
  isValidThemePalette,
  type ThemePaletteId,
} from "@/lib/theme"
import type { User, UserRole } from "@/lib/types"
import { logger } from "@/app/imports/dev"

export async function loginAction(username: string, password: string) {
  try {
    if (!username?.trim() || !password?.trim()) {
      return { ok: false, error: "Usuario y contraseña son obligatorios" }
    }

    const user = await validateUserLogin(username.trim(), password)
    if (!user) {
      return { ok: false, error: "Credenciales inválidas" }
    }

    const session = await getSession()
    session.userId = user.id
    session.username = user.username
    session.role = user.role
    await session.save()

    const safeUser: User = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      themePalette: isValidThemePalette(user.themePalette)
        ? user.themePalette
        : DEFAULT_THEME_PALETTE,
      createdAt: user.createdAt.toISOString(),
    }

    logger.info("User logged in:", user.username)
    return { ok: true, user: safeUser }
  } catch (error) {
    logger.error("loginAction failed:", error)
    return { ok: false, error: "Error al iniciar sesión" }
  }
}

export async function logoutAction() {
  try {
    const session = await getSession()
    session.destroy()
    return { ok: true }
  } catch (error) {
    logger.error("logoutAction failed:", error)
    return { ok: false, error: "Error al cerrar sesión" }
  }
}

export async function getSessionAction() {
  try {
    const session = await getSession()
    if (!session.userId) return null
    return { userId: session.userId, username: session.username, role: session.role }
  } catch (error) {
    logger.error("getSessionAction failed:", error)
    return null
  }
}

export async function getCurrentUserAction(): Promise<User | null> {
  try {
    const session = await getSession()
    if (!session.userId) return null
    return await getUserById(session.userId)
  } catch (error) {
    logger.error("getCurrentUserAction failed:", error)
    return null
  }
}

export async function updateThemePaletteAction(
  palette: string,
): Promise<{ ok: boolean; palette?: ThemePaletteId; error?: string }> {
  try {
    const session = await requireSession()
    if (!isValidThemePalette(palette)) {
      return { ok: false, error: "Paleta de tema inválida" }
    }
    const savedPalette = await updateUserThemePalette(session.userId, palette)
    return { ok: true, palette: savedPalette }
  } catch (error) {
    if (error instanceof Error && error.message === "No autorizado") {
      return { ok: false, error: "No autorizado" }
    }
    logger.error("updateThemePaletteAction failed:", error)
    return { ok: false, error: "Error al actualizar la paleta de tema" }
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
) {
  try {
    const session = await getSession()
    if (!session.userId) {
      return { ok: false, error: "No autorizado" }
    }

    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: "La nueva contraseña debe tener al menos 6 caracteres" }
    }

    if (!session.username) {
      return { ok: false, error: "No autorizado" }
    }

    await changeUserPassword(session.username, currentPassword, newPassword)
    return { ok: true }
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "Error al cambiar la contraseña" }
  }
}