"use client"

import { useState } from "react"
import { ArrowLeftRight, PiggyBank, Plus, Target, TrendingUp } from "lucide-react"
import { toast } from "sonner"

import { SavingFormDialog } from "@/components/ahorros/saving-form-dialog"
import { InvestmentFormDialog } from "@/components/inversiones/investment-form-dialog"
import { BudgetFormDialog } from "@/components/presupuestos/budget-form-dialog"
import { TransactionForm } from "@/components/transferencias/transaction-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useData } from "@/context/data-context"
import type { Budget } from "@/lib/types"

type QuickCreateModal = "transaction" | "saving" | "budget" | "investment" | null

export function FloatingQuickCreate() {
  const { addBudget } = useData()
  const [activeModal, setActiveModal] = useState<QuickCreateModal>(null)

  async function handleCreateBudget(data: Omit<Budget, "id">) {
    await addBudget(data)
    toast.success("Presupuesto creado")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon"
              title="Creación rápida"
              aria-label="Creación rápida"
              className="fixed bottom-20 right-6 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
            >
              <Plus className="size-5" />
            </Button>
          }
        />

        <DropdownMenuContent side="top" align="end" sideOffset={12} className="w-48">
          <DropdownMenuLabel>Crear nuevo</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActiveModal("transaction")}>
            <ArrowLeftRight className="size-4" />
            Transferencias
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("saving")}>
            <PiggyBank className="size-4" />
            Ahorros
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("budget")}>
            <Target className="size-4" />
            Presupuestos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("investment")}>
            <TrendingUp className="size-4" />
            Inversiones
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TransactionForm
        kind="expense"
        allowKindSwitch
        open={activeModal === "transaction"}
        onOpenChange={(open) => {
          if (!open) setActiveModal(null)
        }}
      />

      <SavingFormDialog
        open={activeModal === "saving"}
        onOpenChange={(open) => {
          if (!open) setActiveModal(null)
        }}
      />

      <BudgetFormDialog
        open={activeModal === "budget"}
        onOpenChange={(open) => {
          if (!open) setActiveModal(null)
        }}
        onSubmit={handleCreateBudget}
      />

      <InvestmentFormDialog
        open={activeModal === "investment"}
        onOpenChange={(open) => {
          if (!open) setActiveModal(null)
        }}
      />
    </>
  )
}
