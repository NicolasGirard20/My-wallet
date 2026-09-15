"use client"

import { useState } from "react"
import { CreditCard, MinusCircle, Plus, PlusCircle, Target, Trash2, TrendingUp } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AmountDisplay } from "@/components/shared/amount-display"
import { ColorPicker } from "@/components/shared/color-picker"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useData } from "@/context/data-context"
import { useCurrency } from "@/context/currency-context"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SavingGoal } from "@/lib/types"

export default function AhorrosPage() {
  const { savings, checkingAccounts, selectedAccountId, addSaving, updateSaving, deleteSaving } = useData()
  const { currency: globalCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [target, setTarget] = useState("1000")
  const [saved, setSaved] = useState("0")
  const [color, setColor] = useState("--chart-1")
  const [deadline, setDeadline] = useState("")
  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null)

  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null)
  const [editName, setEditName] = useState("")
  const [editTarget, setEditTarget] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editDeadline, setEditDeadline] = useState("")
  const [editCheckingAccountId, setEditCheckingAccountId] = useState<number | null>(null)

  const [depositGoal, setDepositGoal] = useState<SavingGoal | null>(null)
  const [depositAmount, setDepositAmount] = useState("")
  const [depositAccountId, setDepositAccountId] = useState<number | null>(null)

  const [withdrawGoal, setWithdrawGoal] = useState<SavingGoal | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAccountId, setWithdrawAccountId] = useState<number | null>(null)

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
    const parsedTarget = Number(target)
    const parsedSaved = Number(saved)
    if (!name.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return
    const acc = checkingAccounts.find((a) => a.id === checkingAccountId)
    addSaving({
      name: name.trim(),
      target: parsedTarget,
      saved: Math.max(0, Math.min(parsedSaved, parsedTarget)),
      color,
      deadline: deadline || undefined,
      checkingAccountId: checkingAccountId ?? null,
      currency: acc?.currency ?? globalCurrency,
    })
    setOpen(false)
    setName("")
    setTarget("1000")
    setSaved("0")
    setColor("--chart-1")
    setDeadline("")
    setCheckingAccountId(null)
  }

  function handleEdit(goal: SavingGoal) {
    setEditingGoal(goal)
    setEditName(goal.name)
    setEditTarget(String(goal.target))
    setEditColor(goal.color)
    setEditDeadline(goal.deadline ? goal.deadline.slice(0, 10) : "")
    setEditCheckingAccountId(goal.checkingAccountId ?? null)
  }

  function handleSaveEdit() {
    if (!editingGoal) return
    const parsedTarget = Number(editTarget)
    if (!editName.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return
    updateSaving(editingGoal.id, {
      name: editName.trim(),
      target: parsedTarget,
      color: editColor,
      deadline: editDeadline || null,
      checkingAccountId: editCheckingAccountId,
    })
    setEditingGoal(null)
  }

  function openDeposit(goal: SavingGoal) {
    setDepositGoal(goal)
    setDepositAmount("")
    const defaultAcc =
      goal.checkingAccountId ??
      (selectedAccountId !== "all"
        ? selectedAccountId
        : checkingAccounts.find((a) => a.isDefault)?.id ?? checkingAccounts[0]?.id ?? null)
    setDepositAccountId(defaultAcc)
  }

  function handleConfirmDeposit() {
    if (!depositGoal) return
    const amount = Number(depositAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    const newSaved = depositGoal.saved + amount
    updateSaving(
      depositGoal.id,
      { saved: newSaved },
      depositAccountId,
    )
    setDepositGoal(null)
    setDepositAmount("")
  }

  function openWithdraw(goal: SavingGoal) {
    setWithdrawGoal(goal)
    setWithdrawAmount("")
    const defaultAcc =
      goal.checkingAccountId ??
      (selectedAccountId !== "all"
        ? selectedAccountId
        : checkingAccounts.find((a) => a.isDefault)?.id ?? checkingAccounts[0]?.id ?? null)
    setWithdrawAccountId(defaultAcc)
  }

  function handleConfirmWithdraw() {
    if (!withdrawGoal) return
    const amount = Number(withdrawAmount)
    if (!Number.isFinite(amount) || amount <= 0 || amount > withdrawGoal.saved) return
    const newSaved = Math.max(0, withdrawGoal.saved - amount)
    updateSaving(
      withdrawGoal.id,
      { saved: newSaved },
      withdrawAccountId,
    )
    setWithdrawGoal(null)
    setWithdrawAmount("")
  }

  return (
    <>
      <PageHeader
        title="Ahorros"
        description="Seguimiento de tus metas y fondos de reserva."
        actions={
          <Button onClick={handleOpenCreate}>
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
              <label className="text-sm font-medium">Ahorrado inicial</label>
              <Input type="number" min="0" value={saved} onChange={(e) => setSaved(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Cuenta Corriente asociada</label>
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
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Color</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Fecha límite (opcional)</label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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
          const linkedAccount = checkingAccounts.find((a) => a.id === goal.checkingAccountId)

          return (
            <Card
              key={goal.id}
              onClick={() => handleEdit(goal)}
              className="cursor-pointer overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md active:scale-[0.99]"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `var(${goal.color})`, color: "white" }}>
                      <Target className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{goal.name}</CardTitle>
                      <CardDescription>
                        {goal.deadline ? `Meta: ${formatDate(goal.deadline)}` : "Sin fecha límite"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openDeposit(goal)}
                      title="Aportar a este ahorro"
                      aria-label={`Aportar a ${goal.name}`}
                      className="text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                    >
                      <PlusCircle className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openWithdraw(goal)}
                      title="Extraer de este ahorro"
                      aria-label={`Extraer de ${goal.name}`}
                      className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                    >
                      <MinusCircle className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setConfirmDeleteId(goal.id)}
                      title="Eliminar meta"
                      aria-label={`Eliminar ${goal.name}`}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {linkedAccount && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    <span>Cuenta: <strong className="text-foreground font-medium">{linkedAccount.name}</strong> ({linkedAccount.currency})</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Progreso</span>
                  <span className="font-medium text-foreground">{Math.round(progress)}%</span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: `var(${goal.color})` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ahorrado</span>
                  <AmountDisplay value={goal.saved} from={goal.currency} className="font-semibold" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Objetivo</span>
                  <AmountDisplay value={goal.target} from={goal.currency} className="font-semibold" />
                </div>

                <div className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs",
                  progress >= 100 ? "bg-emerald-500/10 text-emerald-700 font-medium" : "bg-primary/5 text-primary",
                )}>
                  <TrendingUp className="size-3.5" />
                  {progress >= 100 ? "Meta completada" : "Sigue avanzando"}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal Editar Meta */}
      <ConfirmDialog
        open={editingGoal !== null}
        onOpenChange={(open) => { if (!open) setEditingGoal(null) }}
        title="Editar meta"
        description="Modificá los datos de esta meta de ahorro."
        confirmLabel="Guardar cambios"
        confirmVariant="default"
        onConfirm={handleSaveEdit}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Objetivo</label>
            <Input type="number" min="0" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} />
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <ColorPicker value={editColor} onChange={setEditColor} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha límite (opcional)</label>
            <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
          </div>
        </div>
      </ConfirmDialog>

      {/* Modal Aportar (Positivo) */}
      <ConfirmDialog
        open={depositGoal !== null}
        onOpenChange={(open) => { if (!open) { setDepositGoal(null); setDepositAmount("") } }}
        title={depositGoal ? `Aportar a "${depositGoal.name}"` : "Aportar a ahorro"}
        description={
          depositGoal
            ? `Ahorrado actual: ${depositGoal.saved.toLocaleString("es-AR")} ${depositGoal.currency}. Ingresá el monto a depositar (se debitará de la cuenta corriente seleccionada).`
            : undefined
        }
        confirmLabel="Confirmar aporte"
        confirmVariant="default"
        onConfirm={handleConfirmDeposit}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto a depositar</label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Ej: 500"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cuenta corriente de origen</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={depositAccountId ?? ""}
              onChange={(e) => setDepositAccountId(Number(e.target.value) || null)}
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

      {/* Modal Extraer (Positivo) */}
      <ConfirmDialog
        open={withdrawGoal !== null}
        onOpenChange={(open) => { if (!open) { setWithdrawGoal(null); setWithdrawAmount("") } }}
        title={withdrawGoal ? `Extraer de "${withdrawGoal.name}"` : "Extraer de ahorro"}
        description={
          withdrawGoal
            ? `Ahorrado actual disponible: ${withdrawGoal.saved.toLocaleString("es-AR")} ${withdrawGoal.currency}. Ingresá el monto a retirar (se acreditará en la cuenta corriente seleccionada).`
            : undefined
        }
        confirmLabel="Confirmar extracción"
        confirmVariant="default"
        onConfirm={handleConfirmWithdraw}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto a retirar</label>
            <Input
              type="number"
              min="0.01"
              max={withdrawGoal ? withdrawGoal.saved : undefined}
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Ej: 200"
              autoFocus
            />
            {withdrawGoal && Number(withdrawAmount) > withdrawGoal.saved && (
              <p className="text-xs text-destructive">El monto no puede superar lo ahorrado ({withdrawGoal.saved.toLocaleString("es-AR")} {withdrawGoal.currency})</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cuenta corriente de destino</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={withdrawAccountId ?? ""}
              onChange={(e) => setWithdrawAccountId(Number(e.target.value) || null)}
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

      {/* Modal Eliminar Meta */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}
        title="Eliminar meta"
        description="¿Estás seguro de eliminar esta meta de ahorro? Esta acción no se puede deshacer."
        onConfirm={() => {
          if (confirmDeleteId !== null) deleteSaving(confirmDeleteId)
        }}
      />
    </>
  )
}

