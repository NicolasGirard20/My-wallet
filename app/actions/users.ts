"use server"

import { requireSession } from "@/app/lib/session"
import * as service from "@/app/service/user.service"
import { logger } from "@/app/imports/dev"
import type { User } from "@/lib/types"

async function requireAdmin() {
  const session = await requireSession()
  if (session.role !== "admin") {
    throw new Error("No autorizado. Se requiere rol de administrador.")
  }
  return session
}

export async function getUsersAction(): Promise<User[]> {
  try {
    await requireAdmin()
    return service.getUsers()
  } catch (error) {
    logger.error("getUsersAction failed:", error)
    throw error
  }
}

export async function getUserByIdAction(id: number): Promise<User | null> {
  try {
    await requireAdmin()
    return service.getUserById(id)
  } catch (error) {
    logger.error("getUserByIdAction failed:", error)
    throw error
  }
}

export async function createUserAction(data: {
  username: string
  password: string
  name: string
  email: string
}) {
  try {
    await requireAdmin()
    const user = await service.createUser({ ...data, role: "user" })
    logger.info("User created:", user.username)
    return { ok: true, user }
  } catch (error) {
    logger.error("createUserAction failed:", error)
    if (error instanceof Error) return { ok: false, error: error.message }
    return { ok: false, error: "Error al crear el usuario" }
  }
}

export async function updateUserAction(
  id: number,
  data: { name?: string; email?: string; password?: string },
) {
  try {
    await requireAdmin()
    const user = await service.updateUser(id, data)
    logger.info("User updated:", user.username)
    return { ok: true, user }
  } catch (error) {
    logger.error("updateUserAction failed:", error)
    if (error instanceof Error) return { ok: false, error: error.message }
    return { ok: false, error: "Error al actualizar el usuario" }
  }
}

export async function deleteUserAction(id: number) {
  try {
    const session = await requireAdmin()
    if (session.userId === id) {
      return { ok: false, error: "No podés eliminar tu propio usuario" }
    }
    await service.deleteUser(id)
    logger.info("User deleted:", id)
    return { ok: true }
  } catch (error) {
    logger.error("deleteUserAction failed:", error)
    if (error instanceof Error) return { ok: false, error: error.message }
    return { ok: false, error: "Error al eliminar el usuario" }
  }
}

export async function getUserDataSizeAction(userId: number) {
  try {
    await requireAdmin()
    return await service.getUserDataSize(userId)
  } catch (error) {
    logger.error("getUserDataSizeAction failed:", error)
    return "—"
  }
}