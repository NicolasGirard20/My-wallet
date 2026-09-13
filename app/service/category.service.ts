import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"

import type { Prisma } from "@prisma/client"

export async function getCategories(userId?: number) {
  try {
    return await prisma.category.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { name: "asc" },
    })
  } catch (error) {
    logger.error("getCategories failed:", error)
    throw new Error("Error al obtener las categorías")
  }
}

export async function getCategoryById(id: number, userId: number) {
  try {
    return await prisma.category.findUnique({ where: { id, userId } })
  } catch (error) {
    logger.error("getCategoryById failed:", error)
    throw new Error("Error al obtener la categoría")
  }
}

export async function createCategory(data: { name: string; kind: string; color: string; userId: number }) {
  try {
    return await prisma.category.create({ data })
  } catch (error) {
    logger.error("createCategory failed:", error)
    throw new Error("Error al crear la categoría")
  }
}

export async function updateCategory(id: number, userId: number, data: { name?: string; color?: string }) {
  try {
    return await prisma.category.update({ where: { id, userId }, data })
  } catch (error) {
    logger.error("updateCategory failed:", error)
    throw new Error("Error al actualizar la categoría")
  }
}

export async function deleteCategory(id: number, userId: number) {
  try {
    await prisma.category.delete({ where: { id, userId } })
  } catch (error) {
    logger.error("deleteCategory failed:", error)
    throw new Error("Error al eliminar la categoría")
  }
}

export async function getOrCreateSavingsCategory(userId: number, kind: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma
  try {
    const existing = await client.category.findFirst({
      where: { userId, name: "Ahorros", kind },
    })
    if (existing) return existing

    return await client.category.create({
      data: { userId, name: "Ahorros", kind, color: "--chart-5" },
    })
  } catch (error) {
    logger.error("getOrCreateSavingsCategory failed:", error)
    throw new Error("Error al obtener o crear la categoría de ahorros")
  }
}

export async function getOrCreateInvestmentCategory(userId: number, kind: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma
  try {
    const existing = await client.category.findFirst({
      where: { userId, name: "Inversiones", kind },
    })
    if (existing) return existing

    return await client.category.create({
      data: { userId, name: "Inversiones", kind, color: "--chart-3" },
    })
  } catch (error) {
    logger.error("getOrCreateInvestmentCategory failed:", error)
    throw new Error("Error al obtener o crear la categoría de inversiones")
  }
}