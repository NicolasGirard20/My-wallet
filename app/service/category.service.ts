import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"

export async function getCategories() {
  try {
    return await prisma.category.findMany({ orderBy: { name: "asc" } })
  } catch (error) {
    logger.error("getCategories failed:", error)
    throw new Error("Error al obtener las categorías")
  }
}

export async function getCategoryById(id: number) {
  try {
    return await prisma.category.findUnique({ where: { id } })
  } catch (error) {
    logger.error("getCategoryById failed:", error)
    throw new Error("Error al obtener la categoría")
  }
}

export async function createCategory(data: { name: string; kind: string; color: string }) {
  try {
    return await prisma.category.create({ data })
  } catch (error) {
    logger.error("createCategory failed:", error)
    throw new Error("Error al crear la categoría")
  }
}

export async function updateCategory(id: number, data: { name?: string; color?: string }) {
  try {
    return await prisma.category.update({ where: { id }, data })
  } catch (error) {
    logger.error("updateCategory failed:", error)
    throw new Error("Error al actualizar la categoría")
  }
}

export async function deleteCategory(id: number) {
  try {
    await prisma.category.delete({ where: { id } })
  } catch (error) {
    logger.error("deleteCategory failed:", error)
    throw new Error("Error al eliminar la categoría")
  }
}