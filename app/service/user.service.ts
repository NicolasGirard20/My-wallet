import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"
import bcrypt from "bcryptjs"
import type { User, UserRole } from "@/lib/types"

const SALT_ROUNDS = 12

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Sueldo", kind: "income", color: "--chart-1" },
  { name: "Freelance", kind: "income", color: "--chart-2" },
  { name: "Dividendos", kind: "income", color: "--chart-3" },
  { name: "Regalos", kind: "income", color: "--chart-4" },
]

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Comida", kind: "expense", color: "--chart-1" },
  { name: "Alquiler", kind: "expense", color: "--chart-2" },
  { name: "Transporte", kind: "expense", color: "--chart-3" },
  { name: "Ocio", kind: "expense", color: "--chart-4" },
  { name: "Servicios", kind: "expense", color: "--chart-5" },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  })
  return users.map(({ passwordHash: _, ...u }) => ({
    ...u,
    role: u.role as UserRole,
    createdAt: u.createdAt.toISOString(),
  }))
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return null
  const { passwordHash: _, ...safe } = user
  return { ...safe, role: safe.role as UserRole, createdAt: safe.createdAt.toISOString() }
}

export async function createUser(data: {
  username: string
  password: string
  name: string
  email: string
  role: UserRole
}): Promise<User> {
  if (!data.username?.trim()) throw new Error("El nombre de usuario es obligatorio")
  if (!data.name?.trim()) throw new Error("El nombre es obligatorio")
  if (!data.email?.trim() || !EMAIL_REGEX.test(data.email.trim())) throw new Error("Email inválido")
  if (!data.password || data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres")
  if (data.role !== "admin" && data.role !== "user") throw new Error("Rol inválido")

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: data.username.trim() },
        { email: data.email.trim() },
      ],
    },
  })
  if (existing) {
    if (existing.username === data.username.trim()) throw new Error("El nombre de usuario ya existe")
    throw new Error("El email ya está registrado")
  }

  const passwordHash = await hashPassword(data.password)
  const user = await prisma.user.create({
    data: {
      username: data.username.trim(),
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role,
      passwordHash,
    },
  })

  const allDefaults = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]
  await prisma.category.createMany({
    data: allDefaults.map((cat) => ({ ...cat, userId: user.id })),
  })

  const { passwordHash: _, ...safe } = user
  return { ...safe, role: safe.role as UserRole, createdAt: safe.createdAt.toISOString() }
}

export async function updateUser(
  id: number,
  data: { name?: string; email?: string; password?: string },
): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error("Usuario no encontrado")

  const updateData: Record<string, unknown> = {}

  if (data.name?.trim()) updateData.name = data.name.trim()
  if (data.email?.trim()) {
    if (!EMAIL_REGEX.test(data.email.trim())) throw new Error("Email inválido")
    const existingEmail = await prisma.user.findFirst({
      where: { email: data.email.trim(), id: { not: id } },
    })
    if (existingEmail) throw new Error("El email ya está registrado por otro usuario")
    updateData.email = data.email.trim()
  }
  if (data.password) {
    if (data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres")
    updateData.passwordHash = await hashPassword(data.password)
  }

  const updated = await prisma.user.update({ where: { id }, data: updateData })
  const { passwordHash: _, ...safe } = updated
  return { ...safe, role: safe.role as UserRole, createdAt: safe.createdAt.toISOString() }
}

export async function deleteUser(id: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error("Usuario no encontrado")

  const adminCount = await prisma.user.count({ where: { role: "admin" } })
  if (user.role === "admin" && adminCount <= 1) {
    throw new Error("No se puede eliminar el único administrador del sistema")
  }

  await prisma.user.delete({ where: { id } })
}

export async function getUserDataSize(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("Usuario no encontrado")

  const [txCount, catCount, savCount, invCount, contribCount] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.category.count({ where: { userId } }),
    prisma.savingGoal.count({ where: { userId } }),
    prisma.investment.count({ where: { userId } }),
    prisma.investmentContribution.count({ where: { userId } }),
  ])

  const totalBytes =
    txCount * 500 +
    catCount * 200 +
    savCount * 300 +
    invCount * 400 +
    contribCount * 350

  return formatBytes(totalBytes)
}