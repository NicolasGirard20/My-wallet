"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit3, Plus, TrendingUp, Trash2, RefreshCw } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AmountDisplay } from "@/components/shared/amount-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useData } from "@/context/data-context"
import { formatDate, validateDate } from "@/lib/format"

export default function InversionDetallePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { investments, checkingAccounts, selectedAccountId, getInvestment, addContribution, deleteContribution, updateContribution, updateInvestment } = useData()
  const investmentId = Number(params.id)
  const investment = Number.isInteger(investmentId) ? getInvestment(investmentId) : undefined
  const [movementType, setMovementType] = useState<"income" | "expense">("expense") // expense = aporte (sale plata de cuenta corriente a inversión), income = retiro
  const [amount, setAmount] = useState("500")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")
  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null)

  const [updateValueOpen, setUpdateValueOpen] = useState(false)
  const [newValue, setNewValue] = useState("")

  const [confirmDeleteContribId, setConfirmDeleteContribId] = useState<number | null>(null)

  const [editingContrib, setEditingContrib] = useState<{
    id: number
    amount: string
    date: string
    note: string
  } | null>(null)

  const change = useMemo(
    () => (investment ? investment.currentValue - investment.invested : 0),
    [investment],
  )

  if (!investment) {
    return (
      <div className="space-y-4">
        <PageHeader title="Inversión no encontrada" description="La inversión solicitada no existe." />
        <Button variant="outline" onClick={() => router.push("/inversiones")}>
          <ArrowLeft className="size-4" data-icon="inline-start" />
          Volver a inversiones
        </Button>
      </div>
    )
  }

  function handleAddContribution() {
    const rawAmount = Number(amount)
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) return
    if (!investment) return

    const parsedDate = validateDate(date)
    if (!parsedDate) return

    const signedAmount = movementType === "expense" ? rawAmount : -rawAmount
    const defaultAcc =
      checkingAccountId ??
      investment.checkingAccountId ??
      (selectedAccountId !== "all"
        ? selectedAccountId
        : checkingAccounts.find((a) => a.isDefault)?.id ?? checkingAccounts[0]?.id ?? null)

    addContribution(investment.id, {
      amount: signedAmount,
      date: parsedDate.toISOString(),
      note: note.trim() || (movementType === "expense" ? "Aporte" : "Retiro"),
      checkingAccountId: defaultAcc,
    })

    setAmount("500")
    setNote("")
    setDate(new Date().toISOString().slice(0, 10))
  }

  function handleUpdateValue() {
    const parsed = Number(newValue)
    if (!Number.isFinite(parsed) || parsed < 0 || !investment) return
    updateInvestment(investment.id, { currentValue: parsed })
    setUpdateValueOpen(false)
  }

  function handleEditContribution(contrib: { id: number; amount: number; date: string; note?: string }) {
    setEditingContrib({
      id: contrib.id,
      amount: String(Math.abs(contrib.amount)),
      date: contrib.date.slice(0, 10),
      note: contrib.note ?? "",
    })
  }

  function handleSaveEditContribution() {
    if (!editingContrib || !investment) return
    const parsed = Number(editingContrib.amount)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    const parsedDate = validateDate(editingContrib.date)
    if (!parsedDate) return
    
    // Check if previous was negative
    const prev = investment.contributions.find((c) => c.id === editingContrib.id)
    const sign = prev && prev.amount < 0 ? -1 : 1

    updateContribution(editingContrib.id, {
      amount: parsed * sign,
      date: parsedDate.toISOString(),
      note: editingContrib.note.trim() || undefined,
    })
    setEditingContrib(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={investment.name}
        description={investment.description}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setNewValue(String(investment.currentValue)); setUpdateValueOpen(true) }}>
              <RefreshCw className="size-4" data-icon="inline-start" />
              Actualizar valor
            </Button>
            <Button variant="outline" onClick={() => router.push("/inversiones")}>
              <ArrowLeft className="size-4" data-icon="inline-start" />
              Volver
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Valor actual</CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay value={investment.currentValue} from={investment.currency} className="text-2xl font-semibold" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invertido</CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay value={investment.invested} from={investment.currency} className="text-2xl font-semibold" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay
              value={change}
              from={investment.currency}
              kind={change >= 0 ? "income" : "expense"}
              showSign
              className="text-2xl font-semibold"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Timeline de movimientos</CardTitle>
            <CardDescription>Historial de aportes y retiros.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {investment.contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no registraste movimientos para esta inversión.</p>
            ) : (
              investment.contributions.map((contribution) => {
                const linkedAcc = checkingAccounts.find((a) => a.id === contribution.checkingAccountId)
                return (
                  <div key={contribution.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <p className="font-medium">{contribution.note || (contribution.amount >= 0 ? "Aporte" : "Retiro")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(contribution.date)}
                        {linkedAcc ? ` • ${linkedAcc.name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AmountDisplay
                        value={contribution.amount}
                        from={contribution.currency}
                        kind={contribution.amount >= 0 ? "income" : "expense"}
                        showSign
                        className="font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEditContribution(contribution)}
                        aria-label="Editar movimiento"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmDeleteContribId(contribution.id)}
                        aria-label="Eliminar movimiento"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agregar movimiento</CardTitle>
            <CardDescription>Registrá un aporte a la inversión o un retiro de fondos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de operación</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={movementType === "expense" ? "default" : "outline"}
                  onClick={() => setMovementType("expense")}
                  className="w-full"
                >
                  Aporte (+)
                </Button>
                <Button
                  type="button"
                  variant={movementType === "income" ? "default" : "outline"}
                  onClick={() => setMovementType("income")}
                  className="w-full"
                >
                  Retiro (-)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej: 500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {movementType === "expense" ? "Cuenta corriente de origen" : "Cuenta corriente de destino"}
              </label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={checkingAccountId ?? investment.checkingAccountId ?? ""}
                onChange={(e) => setCheckingAccountId(Number(e.target.value) || null)}
              >
                <option value="">Sin cuenta asignada</option>
                {checkingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency}) — Saldo: ${a.currentBalance?.toLocaleString("es-AR")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nota</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: aporte trimestral" />
            </div>
            <Button onClick={handleAddContribution} className="w-full">
              <Plus className="size-4" data-icon="inline-start" />
              {movementType === "expense" ? "Registrar Aporte" : "Registrar Retiro"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={updateValueOpen}
        onOpenChange={(open) => { if (!open) setUpdateValueOpen(false) }}
        title="Actualizar valor actual"
        description="Modificá el valor actual de esta inversión para reflejar su rendimiento."
        confirmLabel="Guardar"
        confirmVariant="default"
        onConfirm={handleUpdateValue}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nuevo valor actual</label>
            <Input type="number" min="0" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDeleteContribId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteContribId(null) }}
        title="Eliminar movimiento"
        description="¿Estás seguro de eliminar este movimiento? El valor invertido y actual se ajustarán automáticamente, y la transferencia vinculada se eliminará."
        onConfirm={() => {
          if (confirmDeleteContribId !== null) deleteContribution(confirmDeleteContribId)
        }}
      />

      <ConfirmDialog
        open={editingContrib !== null}
        onOpenChange={(open) => { if (!open) setEditingContrib(null) }}
        title="Editar movimiento"
        description="Modificá el monto, fecha o nota de este aporte o retiro."
        confirmLabel="Guardar"
        confirmVariant="default"
        onConfirm={handleSaveEditContribution}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto</label>
            <Input type="number" value={editingContrib?.amount ?? ""} onChange={(e) => setEditingContrib((prev) => prev ? { ...prev, amount: e.target.value } : null)} placeholder="Positivo para aporte, negativo para retiro" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha</label>
            <Input type="date" value={editingContrib?.date ?? ""} onChange={(e) => setEditingContrib((prev) => prev ? { ...prev, date: e.target.value } : null)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nota</label>
            <Input value={editingContrib?.note ?? ""} onChange={(e) => setEditingContrib((prev) => prev ? { ...prev, note: e.target.value } : null)} placeholder="Ej: aporte trimestral" />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}
