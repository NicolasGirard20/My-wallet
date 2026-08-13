"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, TrendingUp } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AmountDisplay } from "@/components/shared/amount-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useData } from "@/context/data-context"
import { formatDate } from "@/lib/format"

export default function InversionesPage() {
  const { investments, addInvestment } = useData()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [currentValue, setCurrentValue] = useState("1000")

  function handleSubmit() {
    const parsed = Number(currentValue)
    if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) return

    addInvestment({
      name: name.trim(),
      description: description.trim() || "Inversión personal",
      currentValue: parsed,
    })

    setOpen(false)
    setName("")
    setDescription("")
    setCurrentValue("1000")
  }

  return (
    <>
      <PageHeader
        title="Inversiones"
        description="Monitoreá tus carteras y proyectos de inversión."
        actions={
          <Button onClick={() => setOpen((prev) => !prev)}>
            <Plus className="size-4" data-icon="inline-start" />
            Nueva inversión
          </Button>
        }
      />

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle>Nueva inversión</CardTitle>
            <CardDescription>Registrá una nueva cartera o proyecto.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Acciones Tech" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Valor actual</label>
              <Input type="number" min="0" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Guardar</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {investments.map((item) => {
          const change = item.currentValue - item.invested
          return (
            <Link key={item.id} href={`/inversiones/${item.id}`}>
              <Card className="h-full transition-colors hover:border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <TrendingUp className="size-4" />
                      </span>
                      <div>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <CardDescription>{formatDate(item.createdAt)}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor actual</span>
                    <AmountDisplay value={item.currentValue} className="font-semibold" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Invertido</span>
                    <AmountDisplay value={item.invested} className="font-medium" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia</span>
                    <AmountDisplay value={change} kind={change >= 0 ? "income" : "expense"} showSign className="font-medium" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </>
  )
}
