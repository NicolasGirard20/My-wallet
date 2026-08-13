"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useCurrency } from "@/context/currency-context"
import { useData } from "@/context/data-context"
import { CURRENCY_META, validateDate } from "@/lib/format"
import type { Transaction, TransactionKind } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TransactionFormProps {
  kind: TransactionKind
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Transaction | null
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export function TransactionForm({ kind, open, onOpenChange, editing }: TransactionFormProps) {
  const { currency } = useCurrency()
  const { categoriesByKind, addTransaction, updateTransaction } = useData()
  const categories = categoriesByKind(kind)

  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [date, setDate] = useState(todayInput())

  useEffect(() => {
    if (!open) return
    if (editing) {
      setAmount(String(editing.amount))
      setDescription(editing.description)
      setCategoryId(editing.categoryId)
      setDate(editing.date.slice(0, 10))
    } else {
      setAmount("")
      setDescription("")
      setCategoryId(categories[0]?.id ?? null)
      setDate(todayInput())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const noun = kind === "income" ? "ingreso" : "gasto"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      toast.error("Ingresá un monto válido mayor a cero")
      return
    }
    if (!categoryId) {
      toast.error("Seleccioná una categoría")
      return
    }
    const parsedDate = validateDate(date)
    if (!parsedDate) {
      toast.error("Fecha inválida")
      return
    }
    const payload = {
      kind,
      amount: parsed,
      description: description.trim() || (kind === "income" ? "Ingreso" : "Gasto"),
      categoryId,
      date: parsedDate.toISOString(),
    }

    if (editing) {
      updateTransaction(editing.id, payload)
      toast.success(`${kind === "income" ? "Ingreso" : "Gasto"} actualizado`)
    } else {
      addTransaction(payload)
      toast.success(`${kind === "income" ? "Ingreso" : "Gasto"} agregado`)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${noun}` : `Nuevo ${noun}`}
          </DialogTitle>
          <DialogDescription>
            Los montos se cargan en {CURRENCY_META[currency].label.toLowerCase()} ({currency}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="transaction-form">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="amount">Monto ({CURRENCY_META[currency].symbol})</FieldLabel>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                placeholder="0"
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Input
                id="description"
                value={description}
                placeholder={kind === "income" ? "Ej: Sueldo mensual" : "Ej: Supermercado"}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Categoría</FieldLabel>
              <Select value={categoryId ? String(categoryId) : null} onValueChange={(v) => v && setCategoryId(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí una categoría">
                    {(value) => value ? categories.find(c => c.id === Number(value))?.name ?? value : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="date">Fecha</FieldLabel>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button type="submit" form="transaction-form">
            {editing ? "Guardar cambios" : `Agregar ${noun}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
