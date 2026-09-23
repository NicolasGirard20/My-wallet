"use client"

import { useMemo, useState } from "react"
import { AlertCircle, Plus, Target, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { AmountDisplay } from "@/components/shared/amount-display"
import { useData } from "@/context/data-context"
import { useCurrency } from "@/context/currency-context"
import { calculateBudgetConsumption } from "@/lib/selectors"
import { BudgetCard } from "./budget-card"
import { BudgetFormDialog } from "./budget-form-dialog"
import type { Budget } from "@/lib/types"

interface BudgetListProps {
  onCreateNew: () => void
}

export function BudgetList({ onCreateNew }: BudgetListProps) {
  const { budgets, allTransactions, updateBudget, deleteBudget } = useData()
  const { convert } = useCurrency()

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<"all" | "alert" | "ok">("all")

  // Resumen global de presupuestos
  const summary = useMemo(() => {
    let totalLimit = 0
    let totalSpent = 0
    let alertCount = 0

    for (const b of budgets) {
      const consumption = calculateBudgetConsumption(b, allTransactions, convert)
      totalLimit += b.amountLimit
      totalSpent += consumption.spent
      if (consumption.status === "warning" || consumption.status === "danger") {
        alertCount++
      }
    }

    return {
      totalLimit,
      totalSpent,
      alertCount,
      count: budgets.length,
    }
  }, [budgets, allTransactions, convert])

  const filteredBudgets = useMemo(() => {
    if (filter === "all") return budgets

    return budgets.filter((b) => {
      const consumption = calculateBudgetConsumption(b, allTransactions, convert)
      if (filter === "alert") {
        return consumption.status === "warning" || consumption.status === "danger"
      }
      return consumption.status === "normal"
    })
  }, [budgets, filter, allTransactions, convert])

  async function handleSaveEdit(data: Omit<Budget, "id">) {
    if (!editingBudget) return
    try {
      await updateBudget(editingBudget.id, data)
      toast.success("Presupuesto actualizado exitosamente")
      setEditingBudget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar presupuesto")
    }
  }

  async function handleConfirmDelete() {
    if (deletingId === null) return
    try {
      await deleteBudget(deletingId)
      toast.success("Presupuesto eliminado")
      setDeletingId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar presupuesto")
    }
  }

  if (budgets.length === 0) {
    return (
      <Empty className="border rounded-xl bg-card p-12 text-center">
        <EmptyMedia variant="icon">
          <Target className="size-6 text-primary" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No tenés presupuestos definidos</EmptyTitle>
          <EmptyDescription>
            Creá presupuestos para controlar tus gastos mensuales, semanales o por categoría.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="size-4" />
            Crear primer presupuesto
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Límite Total Presupuestado</p>
            <p className="text-xl font-bold">
              <AmountDisplay value={summary.totalLimit} />
            </p>
            <p className="text-xs text-muted-foreground">En {summary.count} presupuestos</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Gasto Consumido</p>
            <p className="text-xl font-bold">
              <AmountDisplay value={summary.totalSpent} />
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.totalLimit > 0
                ? `${Math.round((summary.totalSpent / summary.totalLimit) * 100)}% del total`
                : "Sin límite"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Estado y Alertas</p>
            <div className="flex items-center gap-2">
              {summary.alertCount > 0 ? (
                <>
                  <AlertCircle className="size-5 text-destructive" />
                  <p className="text-xl font-bold text-destructive">
                    {summary.alertCount} en alerta
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  <p className="text-xl font-bold text-foreground">Bajo control</p>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.alertCount > 0
                ? "Presupuestos al 80% o sobregirados"
                : "Todos dentro de los límites"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filtrar:</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="text-xs h-8"
          >
            Todos ({budgets.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "alert" ? "default" : "outline"}
            onClick={() => setFilter("alert")}
            className="text-xs h-8"
          >
            En Alerta / Peligro ({summary.alertCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "ok" ? "default" : "outline"}
            onClick={() => setFilter("ok")}
            className="text-xs h-8"
          >
            Normales ({budgets.length - summary.alertCount})
          </Button>
        </div>
      </div>

      {/* Grilla de Presupuestos */}
      {filteredBudgets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay presupuestos que coincidan con el filtro seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBudgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={(budget) => setEditingBudget(budget)}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

      {/* Modal Editar */}
      <BudgetFormDialog
        open={editingBudget !== null}
        onOpenChange={(open) => {
          if (!open) setEditingBudget(null)
        }}
        budget={editingBudget}
        onSubmit={handleSaveEdit}
      />

      {/* Confirmar Eliminación */}
      <ConfirmDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
        title="Eliminar Presupuesto"
        description="¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
