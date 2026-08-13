"use server"

import { getSession } from "@/app/lib/session"
import {
  validateUserLogin,
  changeUserPassword,
} from "@/app/service/auth.service"
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
    await session.save()

    logger.info("User logged in:", user.username)
    return { ok: true }
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
    return { userId: session.userId, username: session.username }
  } catch (error) {
    logger.error("getSessionAction failed:", error)
    return null
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