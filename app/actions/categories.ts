"use server"

import { requireSession } from "@/app/lib/session"
import * as service from "@/app/service/category.service"
import { logger } from "@/app/imports/dev"
import type { Category, TransactionKind } from "@/lib/types"

export async function getCategoriesAction() {
  try {
    const session = await requireSession()
    const categories = await service.getCategories(session.userId)
    return categories.map((c): Category => ({
      id: c.id,
      name: c.name,
      kind: c.kind as TransactionKind,
      color: c.color,
    }))
  } catch (error) {
    logger.error("getCategoriesAction failed:", error)
    throw new Error("Error al obtener las categorías")
  }
}

export async function createCategoryAction(data: { name: string; kind: string; color: string }) {
  try {
    const session = await requireSession()
    if (!data.name?.trim()) throw new Error("El nombre es obligatorio")
    if (!["income", "expense"].includes(data.kind)) throw new Error("Tipo inválido")

    const category = await service.createCategory({
      ...data,
      name: data.name.trim(),
      userId: session.userId,
    })
    return { id: category.id, name: category.name, kind: category.kind as TransactionKind, color: category.color }
  } catch (error) {
    logger.error("createCategoryAction failed:", error)
    throw error
  }
}

export async function updateCategoryAction(id: number, data: { name?: string; color?: string }) {
  try {
    const session = await requireSession()
    const sanitized: { name?: string; color?: string } = {}
    if (data.name?.trim()) sanitized.name = data.name.trim()
    if (data.color) sanitized.color = data.color

    const category = await service.updateCategory(id, session.userId, sanitized)
    return { id: category.id, name: category.name, kind: category.kind as TransactionKind, color: category.color }
  } catch (error) {
    logger.error("updateCategoryAction failed:", error)
    throw error
  }
}

export async function deleteCategoryAction(id: number) {
  try {
    const session = await requireSession()
    await service.deleteCategory(id, session.userId)
  } catch (error) {
    logger.error("deleteCategoryAction failed:", error)
    throw error
  }
}