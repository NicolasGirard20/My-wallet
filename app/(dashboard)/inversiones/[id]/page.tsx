"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, TrendingUp, Trash2, RefreshCw } from "lucide-react"

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
  const { getInvestment, addContribution, deleteContribution, updateInvestment } = useData()
  const investmentId = Number(params.id)
  const investment = Number.isInteger(investmentId) ? getInvestment(investmentId) : undefined
  const [amount, setAmount] = useState("500")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")

  const [updateValueOpen, setUpdateValueOpen] = useState(false)
  const [newValue, setNewValue] = useState("")

  const [confirmDeleteContribId, setConfirmDeleteContribId] = useState<number | null>(null)

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
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed === 0) return
    if (!investment) return

    const parsedDate = validateDate(date)
    if (!parsedDate) return

    addContribution(investment.id, {
      amount: parsed,
      date: parsedDate.toISOString(),
      note: note.trim() || (parsed > 0 ? "Aporte" : "Retiro"),
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
            <AmountDisplay value={investment.currentValue} className="text-2xl font-semibold" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invertido</CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay value={investment.invested} className="text-2xl font-semibold" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay
              value={change}
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
              investment.contributions.map((contribution) => (
                <div key={contribution.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="font-medium">{contribution.note || (contribution.amount >= 0 ? "Aporte" : "Retiro")}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(contribution.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AmountDisplay
                      value={contribution.amount}
                      kind={contribution.amount >= 0 ? "income" : "expense"}
                      showSign
                      className="font-medium"
                    />
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
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agregar movimiento</CardTitle>
            <CardDescription>Registrá un aporte (positivo) o retiro (negativo).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Positivo para aporte, negativo para retiro" />
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
              Agregar movimiento
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
        description="¿Estás seguro de eliminar este movimiento? El valor invertido y actual se ajustarán automáticamente."
        onConfirm={() => {
          if (confirmDeleteContribId !== null) deleteContribution(confirmDeleteContribId)
        }}
      />
    </div>
  )
}
