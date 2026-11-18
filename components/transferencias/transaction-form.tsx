"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { useCurrency } from "@/context/currency-context"
import { useData } from "@/context/data-context"
import { CURRENCY_META, formatCurrency, validateDate } from "@/lib/format"
import type { Currency, Transaction, TransactionKind } from "@/lib/types"
import { cn } from "@/lib/utils"
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
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
  allowKindSwitch?: boolean
}

function todayInput() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

export function TransactionForm({
  kind,
  open,
  onOpenChange,
  editing,
  allowKindSwitch = false,
}: TransactionFormProps) {
  const { currency: globalCurrency } = useCurrency()
  const {
    categoriesByKind,
    checkingAccounts,
    selectedAccountId,
    savings,
    investments,
    addTransaction,
    updateTransaction,
  } = useData()

  const [activeKind, setActiveKind] = useState<TransactionKind>(kind)
  const categories = categoriesByKind(activeKind)

  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [txCurrency, setTxCurrency] = useState<Currency>("ARS")
  const [date, setDate] = useState(todayInput())
  const [pendingPayload, setPendingPayload] = useState<{
    kind: TransactionKind
    amount: number
    description: string
    categoryId: number
    date: string
  } | null>(null)

  useEffect(() => {
    if (!open) return
    const nextKind = editing ? editing.kind : kind
    setActiveKind(nextKind)
    if (editing) {
      setAmount(String(editing.amount))
      setDescription(editing.description)
      setCategoryId(editing.categoryId)
      setAccountId(editing.checkingAccountId ?? null)
      setTxCurrency(editing.currency)
      setDate(editing.date.slice(0, 10))
    } else {
      const initialCategories = categoriesByKind(nextKind)
      setAmount("")
      setDescription("")
      setCategoryId(initialCategories[0]?.id ?? null)
      const defaultAcc =
        selectedAccountId !== "all"
          ? checkingAccounts.find((a) => a.id === selectedAccountId)
          : checkingAccounts.find((a) => a.isDefault) ?? checkingAccounts[0]
      setAccountId(defaultAcc?.id ?? null)
      setTxCurrency(defaultAcc?.currency ?? globalCurrency)
      setDate(todayInput())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, kind])

  const noun = activeKind === "income" ? "ingreso" : "gasto"

  function handleKindChange(nextKind: TransactionKind) {
    setActiveKind(nextKind)
    const nextCategories = categoriesByKind(nextKind)
    setCategoryId(nextCategories[0]?.id ?? null)
  }

  function handleAccountChange(accId: number | null) {
    setAccountId(accId)
    if (accId) {
      const acc = checkingAccounts.find((a) => a.id === accId)
      if (acc) setTxCurrency(acc.currency)
    }
  }

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
      kind: activeKind,
      amount: parsed,
      description: description.trim() || (activeKind === "income" ? "Ingreso" : "Gasto"),
      categoryId,
      currency: txCurrency,
      checkingAccountId: accountId ?? undefined,
      date: parsedDate.toISOString(),
    }

    if (editing && (editing.savingGoalId || editing.investmentContributionId) && parsed !== editing.amount) {
      setPendingPayload(payload)
      return
    }

    if (editing) {
      updateTransaction(editing.id, payload)
      toast.success(`${activeKind === "income" ? "Ingreso" : "Gasto"} actualizado`)
    } else {
      addTransaction(payload)
      toast.success(`${activeKind === "income" ? "Ingreso" : "Gasto"} agregado`)
    }
    onOpenChange(false)
  }

  const confirmDescription = useMemo(() => {
    if (!pendingPayload || !editing) return ""
    const oldAmount = editing.amount
    const newAmount = pendingPayload.amount
    const delta = newAmount - oldAmount
    const absDelta = Math.abs(delta)
    const oldText = formatCurrency(oldAmount, editing.currency)
    const newText = formatCurrency(newAmount, editing.currency)
    const deltaText = formatCurrency(absDelta, editing.currency)

    if (editing.savingGoalId) {
      const goal = savings.find((s) => s.id === editing.savingGoalId)
      const goalName = goal?.name ?? "una meta de ahorro"
      const impact =
        activeKind === "expense"
          ? delta > 0
            ? `aumentará en ${deltaText}`
            : `se reducirá en ${deltaText}`
          : delta > 0
            ? `se reducirá en ${deltaText}`
            : `aumentará en ${deltaText}`
      return `Esta transferencia está vinculada a la meta "${goalName}". Al cambiar el monto de ${oldText} a ${newText}, el ahorro ${impact}. ¿Continuar?`
    }

    if (editing.investmentContributionId) {
      const impact =
        activeKind === "expense"
          ? delta > 0
            ? `aumentará en ${deltaText}`
            : `se reducirá en ${deltaText}`
          : delta > 0
            ? `se reducirá en ${deltaText}`
            : `aumentará en ${deltaText}`
      return `Esta transferencia está vinculada a una inversión. Al cambiar el monto de ${oldText} a ${newText}, el valor invertido ${impact}. ¿Continuar?`
    }

    return ""
  }, [pendingPayload, editing, savings, activeKind])

  const confirmTitle = useMemo(() => {
    if (!editing) return "Editar transferencia vinculada"
    if (editing.savingGoalId) return "Editar transferencia vinculada a ahorro"
    if (editing.investmentContributionId) return "Editar transferencia vinculada a inversión"
    return "Editar transferencia vinculada"
  }, [editing])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${noun}` : `Nuevo ${noun}`}
          </DialogTitle>
          <DialogDescription>
            Registrá la operación indicando la cuenta corriente y monto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="transaction-form">
          <FieldGroup>
            {allowKindSwitch && !editing ? (
              <Field>
                <FieldLabel>Tipo de operación</FieldLabel>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => handleKindChange("expense")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      activeKind === "expense"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKindChange("income")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      activeKind === "income"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Ingreso
                  </button>
                </div>
              </Field>
            ) : null}

            {/* Cuenta Corriente */}
            <Field>
              <FieldLabel>Cuenta Corriente</FieldLabel>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={accountId ?? ""}
                onChange={(e) => handleAccountChange(Number(e.target.value) || null)}
              >
                <option value="">Sin cuenta asignada</option>
                {checkingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency}) — Saldo: ${a.currentBalance?.toLocaleString("es-AR")}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="amount">
                  Monto ({CURRENCY_META[txCurrency].symbol})
                </FieldLabel>
                <div className="flex items-center gap-1">
                  {(["ARS", "USD"] as Currency[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTxCurrency(c)}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                        txCurrency === c
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
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
                placeholder={activeKind === "income" ? "Ej: Sueldo mensual" : "Ej: Supermercado"}
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

      <ConfirmDialog
        open={pendingPayload !== null}
        onOpenChange={(open) => { if (!open) setPendingPayload(null) }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Confirmar"
        confirmVariant="default"
        onConfirm={() => {
          if (editing && pendingPayload) {
            updateTransaction(editing.id, pendingPayload)
            toast.success(`${activeKind === "income" ? "Ingreso" : "Gasto"} actualizado`)
            setPendingPayload(null)
            onOpenChange(false)
          }
        }}
      />
    </Dialog>
  )
}
