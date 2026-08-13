"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { useData } from "@/context/data-context"
import type { Category, TransactionKind } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ColorPicker, CHART_COLORS } from "@/components/shared/color-picker"
import { CategoryBadge } from "@/components/shared/category-badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface CategoryManagerProps {
  kind: TransactionKind
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryManager({ kind, open, onOpenChange }: CategoryManagerProps) {
  const { categoriesByKind, transactions, addCategory, updateCategory, deleteCategory } = useData()
  const categories = categoriesByKind(kind)

  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(CHART_COLORS[0])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState(CHART_COLORS[0])
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const noun = kind === "income" ? "ingreso" : "gasto"

  function handleAdd() {
    if (!newName.trim()) {
      toast.error("Ingresá un nombre para la categoría")
      return
    }
    addCategory(newName.trim(), kind, newColor)
    setNewName("")
    setNewColor(CHART_COLORS[0])
    toast.success("Categoría creada")
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  function saveEdit() {
    if (!editName.trim()) {
      toast.error("El nombre no puede estar vacío")
      return
    }
    if (editingId) {
      updateCategory(editingId, editName.trim(), editColor)
      toast.success("Categoría actualizada")
      setEditingId(null)
    }
  }

  function confirmDelete() {
    if (!toDelete) return
    const used = transactions.some((t) => t.categoryId === toDelete.id)
    if (used) {
      toast.error("No se puede eliminar: hay movimientos con esta categoría")
      return
    }
    deleteCategory(toDelete.id)
    toast.success("Categoría eliminada")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Categorías de {noun}</DialogTitle>
            <DialogDescription>Creá, editá o eliminá tus categorías de {noun}.</DialogDescription>
          </DialogHeader>

          {/* Add new */}
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <Input
              value={newName}
              placeholder={`Nueva categoría de ${noun}`}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleAdd()
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <ColorPicker value={newColor} onChange={setNewColor} />
              <Button size="sm" onClick={handleAdd}>
                <Plus className="size-4" data-icon="inline-start" />
                Agregar
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {categories.map((cat) =>
              editingId === cat.id ? (
                <div key={cat.id} className="flex flex-col gap-2 rounded-lg border border-primary/40 p-3">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                  <div className="flex items-center justify-between gap-2">
                    <ColorPicker value={editColor} onChange={setEditColor} />
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="size-4" />
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
                >
                  <CategoryBadge name={cat.name} color={cat.color} />
                  <div className="flex gap-0.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => startEdit(cat)}
                      aria-label={`Editar ${cat.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setToDelete(cat)}
                      aria-label={`Eliminar ${cat.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Eliminar categoría "${toDelete?.name}"`}
        description="Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
      />
    </>
  )
}
