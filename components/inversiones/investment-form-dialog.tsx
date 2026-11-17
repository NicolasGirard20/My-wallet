"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { useCurrency } from "@/context/currency-context"
import { useData } from "@/context/data-context"

interface InvestmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvestmentFormDialog({ open, onOpenChange }: InvestmentFormDialogProps) {
  const { checkingAccounts, selectedAccountId, addInvestment } = useData()
  const { currency: globalCurrency } = useCurrency()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [currentValue, setCurrentValue] = useState("1000")
  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName("")
    setDescription("")
    setCurrentValue("1000")
    const defaultAcc =
      selectedAccountId !== "all"
        ? checkingAccounts.find((a) => a.id === selectedAccountId)
        : checkingAccounts.find((a) => a.isDefault) ?? checkingAccounts[0]
    setCheckingAccountId(defaultAcc?.id ?? null)
  }, [open, selectedAccountId, checkingAccounts])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("El nombre de la inversión es obligatorio")
      return
    }

    const parsedValue = Number(currentValue)
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      toast.error("El valor invertido inicial debe ser un número positivo")
      return
    }

    const acc = checkingAccounts.find((a) => a.id === checkingAccountId)

    setSubmitting(true)
    try {
      await addInvestment({
        name: trimmedName,
        description: description.trim() || "Inversión personal",
        currentValue: parsedValue,
        checkingAccountId: checkingAccountId ?? null,
        currency: acc?.currency ?? globalCurrency,
      })
      toast.success("Inversión creada")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear la inversión")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva inversión</DialogTitle>
          <DialogDescription>Registrá una nueva cartera o proyecto.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="investment-form-dialog" className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="investment-name">Nombre</FieldLabel>
              <Input
                id="investment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Acciones Tech"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="investment-description">Descripción</FieldLabel>
              <Input
                id="investment-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="investment-value">Valor invertido inicial</FieldLabel>
              <Input
                id="investment-value"
                type="number"
                min="0.01"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="investment-account">Cuenta Corriente de origen</FieldLabel>
              <select
                id="investment-account"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={checkingAccountId ?? ""}
                onChange={(e) => setCheckingAccountId(Number(e.target.value) || null)}
              >
                <option value="">Sin cuenta asignada</option>
                {checkingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency}) — Saldo: ${a.currentBalance?.toLocaleString("es-AR")}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
