"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useData } from "@/context/data-context"
import type { Budget, Currency } from "@/lib/types"

interface BudgetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget?: Budget | null
  onSubmit: (data: Omit<Budget, "id">) => Promise<void> | void
}

function getDefaultDates() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))

  return {
    start: firstDay.toISOString().slice(0, 10),
    end: lastDay.toISOString().slice(0, 10),
  }
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  onSubmit,
}: BudgetFormDialogProps) {
  const { categoriesByKind, checkingAccounts, activeAccount } = useData()
  const expenseCategories = categoriesByKind("expense")

  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [amountLimit, setAmountLimit] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null)
  const [currency, setCurrency] = useState<Currency>("ARS")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (budget) {
        setName(budget.name)
        setStartDate(budget.startDate.slice(0, 10))
        setEndDate(budget.endDate.slice(0, 10))
        setAmountLimit(String(budget.amountLimit))
        setCategoryId(budget.categoryId)
        setCheckingAccountId(budget.checkingAccountId ?? null)
        setCurrency(budget.currency ?? "ARS")
      } else {
        const defaults = getDefaultDates()
        setName("")
        setStartDate(defaults.start)
        setEndDate(defaults.end)
        setAmountLimit("")
        setCategoryId(null)
        if (activeAccount) {
          setCheckingAccountId(activeAccount.id)
          setCurrency(activeAccount.currency)
        } else {
          setCheckingAccountId(null)
          setCurrency("ARS")
        }
      }
    }
  }, [open, budget, activeAccount])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("El nombre del presupuesto es obligatorio")
      return
    }

    const parsedLimit = Number(amountLimit)
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      toast.error("El monto límite debe ser un número positivo")
      return
    }

    if (!startDate || !endDate) {
      toast.error("Las fechas de inicio y fin son obligatorias")
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("La fecha de inicio no puede ser posterior a la de fin")
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name: trimmedName,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        amountLimit: parsedLimit,
        categoryId,
        currency,
        checkingAccountId,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el presupuesto")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? "Editar Presupuesto" : "Nuevo Presupuesto"}</DialogTitle>
          <DialogDescription>
            {budget
              ? "Modificá el límite, categoría, cuenta o vigencia de este presupuesto."
              : "Definí un tope de gasto para un período, categoría o cuenta determinada."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="budget-name">Nombre</FieldLabel>
              <Input
                id="budget-name"
                value={name}
                placeholder="Ej: Presupuesto Mensual Supermercado"
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="budget-account">Cuenta asociada (opcional)</FieldLabel>
              <select
                id="budget-account"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-colors"
                value={checkingAccountId === null ? "" : String(checkingAccountId)}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "") {
                    setCheckingAccountId(null)
                  } else {
                    const accId = Number(val)
                    setCheckingAccountId(accId)
                    const acc = checkingAccounts.find((a) => a.id === accId)
                    if (acc) setCurrency(acc.currency)
                  }
                }}
              >
                <option value="">Todas las cuentas (Presupuesto Global)</option>
                {checkingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field>
                  <FieldLabel htmlFor="budget-limit">Monto Límite</FieldLabel>
                  <Input
                    id="budget-limit"
                    type="number"
                    step="any"
                    min="0.01"
                    value={amountLimit}
                    placeholder="0.00"
                    onChange={(e) => setAmountLimit(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <div>
                <Field>
                  <FieldLabel htmlFor="budget-currency">Moneda</FieldLabel>
                  <select
                    id="budget-currency"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-colors disabled:opacity-60"
                    value={currency}
                    disabled={checkingAccountId !== null}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </Field>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="budget-category">Categoría</FieldLabel>
              <select
                id="budget-category"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-colors"
                value={categoryId === null ? "" : String(categoryId)}
                onChange={(e) =>
                  setCategoryId(e.target.value === "" ? null : Number(e.target.value))
                }
              >
                <option value="">Todas las categorías (Global)</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="budget-start">Fecha de Inicio</FieldLabel>
                <Input
                  id="budget-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="budget-end">Fecha de Fin</FieldLabel>
                <Input
                  id="budget-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter className="pt-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : budget ? "Guardar cambios" : "Crear presupuesto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
