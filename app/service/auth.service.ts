import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"
import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function validateUserLogin(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return null

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return null

    const { passwordHash: _, ...safeUser } = user
    return safeUser
  } catch (error) {
    logger.error("validateUserLogin failed:", error)
    return null
  }
}

export async function changeUserPassword(
  username: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new Error("Usuario no encontrado")

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) throw new Error("Contraseña actual incorrecta")

  const passwordHash = await hashPassword(newPassword)

  await prisma.user.update({
    where: { username },
    data: { passwordHash },
  })

  const { passwordHash: _, ...safeUser } = user
  return safeUser
}