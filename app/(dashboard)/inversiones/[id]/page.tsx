"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, TrendingUp } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AmountDisplay } from "@/components/shared/amount-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useData } from "@/context/data-context"
import { formatDate, validateDate } from "@/lib/format"

export default function InversionDetallePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { getInvestment, addContribution } = useData()
  const investmentId = Number(params.id)
  const investment = Number.isInteger(investmentId) ? getInvestment(investmentId) : undefined
  const [amount, setAmount] = useState("500")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")

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
    if (!Number.isFinite(parsed) || parsed <= 0) return
    if (!investment) return

    const parsedDate = validateDate(date)
    if (!parsedDate) return

    addContribution(investment.id, {
      amount: parsed,
      date: parsedDate.toISOString(),
      note: note.trim() || "Aporte",
    })

    setAmount("500")
    setNote("")
    setDate(new Date().toISOString().slice(0, 10))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={investment.name}
        description={investment.description}
        actions={
          <Button variant="outline" onClick={() => router.push("/inversiones")}>
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Volver
          </Button>
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
            <CardTitle>Timeline de aportes</CardTitle>
            <CardDescription>Historial de contribuciones y movimientos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {investment.contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no registraste aportes para esta inversión.</p>
            ) : (
              investment.contributions.map((contribution) => (
                <div key={contribution.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{contribution.note || "Aporte"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(contribution.date)}</p>
                  </div>
                  <AmountDisplay
                    value={contribution.amount}
                    kind={contribution.amount >= 0 ? "income" : "expense"}
                    showSign
                    className="font-medium"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agregar aporte</CardTitle>
            <CardDescription>Sumá un nuevo movimiento a esta inversión.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
              Agregar aporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
