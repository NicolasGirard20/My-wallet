"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCard, Edit3, Plus, TrendingUp, Trash2 } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AmountDisplay } from "@/components/shared/amount-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useData } from "@/context/data-context"
import { useCurrency } from "@/context/currency-context"
import { formatDate } from "@/lib/format"
import type { Investment } from "@/lib/types"

export default function InversionesPage() {
  const { investments, checkingAccounts, selectedAccountId, addInvestment, updateInvestment, deleteInvestment } = useData()
  const { currency: globalCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [currentValue, setCurrentValue] = useState("1000")
  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null)

  const [editingInv, setEditingInv] = useState<Investment | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCurrentValue, setEditCurrentValue] = useState("")
  const [editCheckingAccountId, setEditCheckingAccountId] = useState<number | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  function handleOpenCreate() {
    const defaultAcc =
      selectedAccountId !== "all"
        ? checkingAccounts.find((a) => a.id === selectedAccountId)
        : checkingAccounts.find((a) => a.isDefault) ?? checkingAccounts[0]
    setCheckingAccountId(defaultAcc?.id ?? null)
    setOpen(true)
  }

  function handleSubmit() {
    const parsed = Number(currentValue)
    if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) return
    const acc = checkingAccounts.find((a) => a.id === checkingAccountId)

    addInvestment({
      name: name.trim(),
      description: description.trim() || "Inversión personal",
      currentValue: parsed,
      checkingAccountId: checkingAccountId ?? null,
      currency: acc?.currency ?? globalCurrency,
    })

    setOpen(false)
    setName("")
    setDescription("")
    setCurrentValue("1000")
    setCheckingAccountId(null)
  }

  function handleEdit(inv: Investment) {
    setEditingInv(inv)
    setEditName(inv.name)
    setEditDescription(inv.description)
    setEditCurrentValue(String(inv.currentValue))
    setEditCheckingAccountId(inv.checkingAccountId ?? null)
  }

  function handleSaveEdit() {
    if (!editingInv) return
    const parsed = Number(editCurrentValue)
    if (!editName.trim() || !Number.isFinite(parsed) || parsed < 0) return
    updateInvestment(editingInv.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      currentValue: parsed,
      checkingAccountId: editCheckingAccountId,
    })
    setEditingInv(null)
  }

  return (
    <>
      <PageHeader
        title="Inversiones"
        description="Monitoreá tus carteras y proyectos de inversión."
        actions={
          <Button onClick={handleOpenCreate}>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto / Valor inicial</label>
              <Input type="number" min="0" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cuenta Corriente de origen</label>
              <select
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
          const linkedAccount = checkingAccounts.find((a) => a.id === item.checkingAccountId)

          return (
            <Card key={item.id} className="group relative h-full transition-colors hover:border-primary/30">
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon-sm" onClick={(e) => { e.preventDefault(); handleEdit(item) }} aria-label={`Editar ${item.name}`}>
                  <Edit3 className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={(e) => { e.preventDefault(); setConfirmDeleteId(item.id) }} aria-label={`Eliminar ${item.name}`}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Link href={`/inversiones/${item.id}`} className="block h-full">
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
                  
                  {linkedAccount && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CreditCard className="size-3.5" />
                      <span>Cuenta: <strong className="text-foreground font-medium">{linkedAccount.name}</strong> ({linkedAccount.currency})</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor actual</span>
                    <AmountDisplay value={item.currentValue} from={item.currency} className="font-semibold" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Invertido</span>
                    <AmountDisplay value={item.invested} from={item.currency} className="font-medium" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia</span>
                    <AmountDisplay value={change} from={item.currency} kind={change >= 0 ? "income" : "expense"} showSign className="font-medium" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={editingInv !== null}
        onOpenChange={(open) => { if (!open) setEditingInv(null) }}
        title="Editar inversión"
        description="Modificá los datos de esta inversión."
        confirmLabel="Guardar"
        confirmVariant="default"
        onConfirm={handleSaveEdit}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor actual</label>
            <Input type="number" min="0" value={editCurrentValue} onChange={(e) => setEditCurrentValue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cuenta Corriente asociada</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={editCheckingAccountId ?? ""}
              onChange={(e) => setEditCheckingAccountId(Number(e.target.value) || null)}
            >
              <option value="">Sin cuenta asignada</option>
              {checkingAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency}) — Saldo: ${a.currentBalance?.toLocaleString("es-AR")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}
        title="Eliminar inversión"
        description="¿Estás seguro de eliminar esta inversión? Esta acción no se puede deshacer."
        onConfirm={() => {
          if (confirmDeleteId !== null) deleteInvestment(confirmDeleteId)
        }}
      />
    </>
  )
}
