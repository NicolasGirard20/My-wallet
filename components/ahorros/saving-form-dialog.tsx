"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ColorPicker } from "@/components/shared/color-picker"
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

interface SavingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SavingFormDialog({ open, onOpenChange }: SavingFormDialogProps) {
  const { checkingAccounts, selectedAccountId, addSaving } = useData()
  const { currency: globalCurrency } = useCurrency()

  const [name, setName] = useState("")
  const [target, setTarget] = useState("1000")
  const [saved, setSaved] = useState("0")
  const [color, setColor] = useState("--chart-1")
  const [deadline, setDeadline] = useState("")
  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName("")
    setTarget("1000")
    setSaved("0")
    setColor("--chart-1")
    setDeadline("")
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
      toast.error("El nombre de la meta es obligatorio")
      return
    }

    const parsedTarget = Number(target)
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      toast.error("El objetivo debe ser un número positivo")
      return
    }

    const parsedSaved = Number(saved)
    if (!Number.isFinite(parsedSaved) || parsedSaved < 0) {
      toast.error("El ahorrado inicial no puede ser negativo")
      return
    }

    const acc = checkingAccounts.find((a) => a.id === checkingAccountId)

    setSubmitting(true)
    try {
      await addSaving({
        name: trimmedName,
        target: parsedTarget,
        saved: Math.min(parsedSaved, parsedTarget),
        color,
        deadline: deadline || undefined,
        checkingAccountId: checkingAccountId ?? null,
        currency: acc?.currency ?? globalCurrency,
      })
      toast.success("Meta de ahorro creada")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear la meta de ahorro")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva meta de ahorro</DialogTitle>
          <DialogDescription>Creá una nueva meta para tus ahorros.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="saving-form-dialog" className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="saving-name">Nombre</FieldLabel>
              <Input
                id="saving-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Fondo de emergencia"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="saving-target">Objetivo</FieldLabel>
                <Input
                  id="saving-target"
                  type="number"
                  min="0.01"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="saving-saved">Ahorrado inicial</FieldLabel>
                <Input
                  id="saving-saved"
                  type="number"
                  min="0"
                  step="any"
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="saving-account">Cuenta Corriente asociada</FieldLabel>
              <select
                id="saving-account"
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

            <Field>
              <FieldLabel>Color</FieldLabel>
              <ColorPicker value={color} onChange={setColor} />
            </Field>

            <Field>
              <FieldLabel htmlFor="saving-deadline">Fecha límite (opcional)</FieldLabel>
              <Input
                id="saving-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
