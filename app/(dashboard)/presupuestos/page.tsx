"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { BudgetList } from "@/components/presupuestos/budget-list"
import { BudgetFormDialog } from "@/components/presupuestos/budget-form-dialog"
import { useData } from "@/context/data-context"
import type { Budget } from "@/lib/types"

export default function PresupuestosPage() {
  const { addBudget, activeAccount } = useData()
  const [createOpen, setCreateOpen] = useState(false)

  async function handleCreate(data: Omit<Budget, "id">) {
    try {
      await addBudget(data)
      toast.success("Presupuesto creado exitosamente")
      setCreateOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear presupuesto")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={activeAccount ? `Presupuestos — ${activeAccount.name}` : "Presupuestos"}
        description={
          activeAccount
            ? `Metas de gasto para ${activeAccount.name} (${activeAccount.currency}) y presupuestos globales.`
            : "Establecé metas de gasto y monitoreá el consumo de tus finanzas en tiempo real."
        }
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Nuevo Presupuesto
          </Button>
        }
      />

      <BudgetList onCreateNew={() => setCreateOpen(true)} />

      <BudgetFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </div>
  )
}
