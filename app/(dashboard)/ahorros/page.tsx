"use client"

import { useState } from "react"
import { PiggyBank, Plus, Target, TrendingUp } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AmountDisplay } from "@/components/shared/amount-display"
import { ColorPicker } from "@/components/shared/color-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useData } from "@/context/data-context"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function AhorrosPage() {
  const { savings, addSaving, deleteSaving } = useData()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [target, setTarget] = useState("1000")
  const [saved, setSaved] = useState("0")
  const [color, setColor] = useState("--chart-1")

  function handleSubmit() {
    const parsedTarget = Number(target)
    const parsedSaved = Number(saved)
    if (!name.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return
    addSaving({
      name: name.trim(),
      target: parsedTarget,
      saved: Math.max(0, Math.min(parsedSaved, parsedTarget)),
      color,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString(),
    })
    setOpen(false)
    setName("")
    setTarget("1000")
    setSaved("0")
    setColor("--chart-1")
  }

  return (
    <>
      <PageHeader
        title="Ahorros"
        description="Seguimiento de tus metas y fondos de reserva."
        actions={
          <Button onClick={() => setOpen((prev) => !prev)}>
            <Plus className="size-4" data-icon="inline-start" />
            Nueva meta
          </Button>
        }
      />

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle>Nueva meta</CardTitle>
            <CardDescription>Creá una nueva meta para tus ahorros.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Fondo de emergencia" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Objetivo</label>
              <Input type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ahorrado</label>
              <Input type="number" min="0" value={saved} onChange={(e) => setSaved(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Color</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Guardar meta</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {savings.map((goal) => {
          const progress = Math.min((goal.saved / goal.target) * 100, 100)

          return (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-md" style={{ backgroundColor: `var(${goal.color})`, color: "white" }}>
                      <Target className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{goal.name}</CardTitle>
                      <CardDescription>
                        {goal.deadline ? `Meta: ${formatDate(goal.deadline)}` : "Sin fecha límite"}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => deleteSaving(goal.id)} aria-label={`Eliminar ${goal.name}`}>
                    <PiggyBank className="size-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Progreso</span>
                  <span className="font-medium text-foreground">{Math.round(progress)}%</span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: `var(${goal.color})` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ahorrado</span>
                  <AmountDisplay value={goal.saved} className="font-semibold" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Objetivo</span>
                  <AmountDisplay value={goal.target} className="font-semibold" />
                </div>

                <div className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs",
                  progress >= 100 ? "bg-emerald-500/10 text-emerald-700" : "bg-primary/5 text-primary",
                )}>
                  <TrendingUp className="size-3.5" />
                  {progress >= 100 ? "Meta completada" : "Sigue avanzando"}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
