"use client"

import { useState } from "react"
import { CirclePlus, Tags } from "lucide-react"

import { CategoryManager } from "@/components/transferencias/category-manager"
import { TransactionForm } from "@/components/transferencias/transaction-form"
import { TransactionTable } from "@/components/transferencias/transaction-table"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/lib/types"

export default function GastosPage() {
  const [openForm, setOpenForm] = useState(false)
  const [openCategories, setOpenCategories] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Revisá tus gastos por categoría y fecha.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setOpenCategories(true)}>
            <Tags className="size-4" data-icon="inline-start" />
            Categorías
          </Button>
          <Button onClick={() => {
            setEditing(null)
            setOpenForm(true)
          }}>
            <CirclePlus className="size-4" data-icon="inline-start" />
            Nuevo gasto
          </Button>
        </div>
      </div>

      <TransactionTable kind="expense" onEdit={(tx) => {
        setEditing(tx)
        setOpenForm(true)
      }} />

      <TransactionForm
        kind="expense"
        open={openForm}
        editing={editing}
        onOpenChange={(next) => {
          setOpenForm(next)
          if (!next) setEditing(null)
        }}
      />

      <CategoryManager
        kind="expense"
        open={openCategories}
        onOpenChange={setOpenCategories}
      />
    </>
  )
}
