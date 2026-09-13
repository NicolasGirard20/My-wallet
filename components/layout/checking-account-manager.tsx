"use client"

import { useState } from "react"
import {
  ArrowLeftRight,
  Check,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

import { useData } from "@/context/data-context"
import { useCurrency } from "@/context/currency-context"
import type { CheckingAccount, Currency } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColorPicker, CHART_COLORS } from "@/components/shared/color-picker"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { AmountDisplay } from "@/components/shared/amount-display"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CheckingAccountManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: "accounts" | "transfer"
}

export function CheckingAccountManager({
  open,
  onOpenChange,
  initialTab = "accounts",
}: CheckingAccountManagerProps) {
  const {
    checkingAccounts,
    addCheckingAccount,
    updateCheckingAccount,
    deleteCheckingAccount,
    createTransfer,
  } = useData()
  const { convert, rate } = useCurrency()

  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Account form fields
  const [name, setName] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [cbuOrAlias, setCbuOrAlias] = useState("")
  const [accountCurrency, setAccountCurrency] = useState<Currency>("ARS")
  const [initialBalance, setInitialBalance] = useState("0")
  const [overdraftLimit, setOverdraftLimit] = useState("0")
  const [color, setColor] = useState(CHART_COLORS[0])
  const [isDefault, setIsDefault] = useState(false)

  // Transfer form fields
  const [sourceAccountId, setSourceAccountId] = useState<number | null>(null)
  const [targetAccountId, setTargetAccountId] = useState<number | null>(null)
  const [transferAmount, setTransferAmount] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [transferNote, setTransferNote] = useState("")

  const [toDelete, setToDelete] = useState<CheckingAccount | null>(null)

  function resetForm() {
    setName("")
    setBankName("")
    setAccountNumber("")
    setCbuOrAlias("")
    setAccountCurrency("ARS")
    setInitialBalance("0")
    setOverdraftLimit("0")
    setColor(CHART_COLORS[0])
    setIsDefault(false)
    setIsCreating(false)
    setEditingId(null)
  }

  function startCreate() {
    resetForm()
    setIsCreating(true)
  }

  function startEdit(acc: CheckingAccount) {
    setIsCreating(false)
    setEditingId(acc.id)
    setName(acc.name)
    setBankName(acc.bankName ?? "")
    setAccountNumber(acc.accountNumber ?? "")
    setCbuOrAlias(acc.cbuOrAlias ?? "")
    setAccountCurrency(acc.currency)
    setInitialBalance(String(acc.initialBalance))
    setOverdraftLimit(String(acc.overdraftLimit))
    setColor(acc.color)
    setIsDefault(acc.isDefault)
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("El nombre de la cuenta es obligatorio")
      return
    }

    const initBal = Number(initialBalance) || 0
    const odLimit = Number(overdraftLimit) || 0

    if (odLimit < 0) {
      toast.error("El límite de descubierto no puede ser negativo")
      return
    }

    try {
      if (editingId !== null) {
        await updateCheckingAccount(editingId, {
          name: name.trim(),
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          cbuOrAlias: cbuOrAlias.trim() || undefined,
          currency: accountCurrency,
          initialBalance: initBal,
          overdraftLimit: odLimit,
          color,
          isDefault,
        })
        toast.success("Cuenta actualizada correctamente")
      } else {
        await addCheckingAccount({
          name: name.trim(),
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          cbuOrAlias: cbuOrAlias.trim() || undefined,
          currency: accountCurrency,
          initialBalance: initBal,
          overdraftLimit: odLimit,
          color,
          isDefault: checkingAccounts.length === 0 ? true : isDefault,
        })
        toast.success("Cuenta creada correctamente")
      }
      resetForm()
    } catch {
      toast.error("Ocurrió un error al guardar la cuenta")
    }
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return
    try {
      await deleteCheckingAccount(toDelete.id)
      toast.success("Cuenta eliminada")
      setToDelete(null)
    } catch {
      toast.error("No se pudo eliminar la cuenta")
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceAccountId || !targetAccountId) {
      toast.error("Seleccioná la cuenta de origen y destino")
      return
    }
    if (sourceAccountId === targetAccountId) {
      toast.error("Las cuentas deben ser diferentes")
      return
    }

    const sAmount = Number(transferAmount)
    if (!Number.isFinite(sAmount) || sAmount <= 0) {
      toast.error("Ingresá un monto de transferencia válido")
      return
    }

    const sourceAcc = checkingAccounts.find((a) => a.id === sourceAccountId)
    const targetAcc = checkingAccounts.find((a) => a.id === targetAccountId)
    if (!sourceAcc || !targetAcc) return

    // If different currencies, calculate or take target amount
    let tAmount = Number(targetAmount)
    let exchangeRateApplied: number | undefined

    if (sourceAcc.currency !== targetAcc.currency) {
      if (!Number.isFinite(tAmount) || tAmount <= 0) {
        tAmount = convert(sAmount, sourceAcc.currency)
      }
      exchangeRateApplied = sAmount > 0 ? tAmount / sAmount : undefined
    } else {
      tAmount = sAmount
    }

    try {
      await createTransfer({
        sourceAccountId,
        targetAccountId,
        sourceAmount: sAmount,
        targetAmount: tAmount,
        exchangeRate: exchangeRateApplied,
        description: transferNote.trim() || undefined,
      })
      toast.success("Transferencia realizada con éxito")
      setTransferAmount("")
      setTargetAmount("")
      setTransferNote("")
      setActiveTab("accounts")
    } catch {
      toast.error("No se pudo realizar la transferencia")
    }
  }

  // Auto-calculate target amount on transfer if currencies differ
  function handleSourceAmountChange(val: string) {
    setTransferAmount(val)
    const num = Number(val)
    if (Number.isFinite(num) && num > 0 && sourceAccountId && targetAccountId) {
      const sourceAcc = checkingAccounts.find((a) => a.id === sourceAccountId)
      const targetAcc = checkingAccounts.find((a) => a.id === targetAccountId)
      if (sourceAcc && targetAcc && sourceAcc.currency !== targetAcc.currency) {
        const converted = convert(num, sourceAcc.currency)
        setTargetAmount(converted.toFixed(2))
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              Gestión de Cuentas Corrientes
            </DialogTitle>
            <DialogDescription>
              Administrá tus cuentas bancarias, billeteras virtuales y registrá transferencias internas entre ellas.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2 flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="accounts" className="gap-2 text-xs sm:text-sm">
                <CreditCard className="size-4" />
                Mis Cuentas ({checkingAccounts.length})
              </TabsTrigger>
              <TabsTrigger value="transfer" className="gap-2 text-xs sm:text-sm">
                <ArrowLeftRight className="size-4" />
                Transferir
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ACCOUNTS */}
            <TabsContent value="accounts" className="space-y-4 pt-3 overflow-y-auto max-h-[calc(85vh-140px)] pr-1">
              {!isCreating && editingId === null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Cuentas activas en el sistema
                    </span>
                    <Button size="sm" onClick={startCreate}>
                      <Plus className="size-4" data-icon="inline-start" />
                      Nueva cuenta
                    </Button>
                  </div>

                  <div className="divide-y rounded-xl border bg-card">
                    {checkingAccounts.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No tenés cuentas corrientes configuradas aún.
                      </div>
                    ) : (
                      checkingAccounts.map((acc) => {
                        const bal = acc.currentBalance ?? acc.initialBalance
                        const isNegative = bal < 0
                        const isOverdrawn = isNegative && Math.abs(bal) <= acc.overdraftLimit
                        const isOverExceeded = isNegative && Math.abs(bal) > acc.overdraftLimit

                        return (
                          <div
                            key={acc.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors hover:bg-muted/40"
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <span
                                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white mt-0.5 sm:mt-0"
                                style={{ backgroundColor: `var(${acc.color})` }}
                              >
                                <Landmark className="size-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className="truncate font-semibold text-sm">
                                    {acc.name}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold">
                                    {acc.currency}
                                  </Badge>
                                  {acc.isDefault && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      Principal
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                                  {acc.bankName && <span>{acc.bankName}</span>}
                                  {acc.cbuOrAlias && <span>• Alias/CBU: {acc.cbuOrAlias}</span>}
                                  {acc.overdraftLimit > 0 && (
                                    <span>• Descubierto: ${acc.overdraftLimit.toLocaleString("es-AR")}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-muted/60">
                              <div className="text-left sm:text-right">
                                <AmountDisplay
                                  value={bal}
                                  from={acc.currency}
                                  className={cn("text-sm font-bold block", isNegative && "text-destructive")}
                                />
                                {isOverdrawn && (
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="size-3" />
                                    Bajo descubierto
                                  </span>
                                )}
                                {isOverExceeded && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-destructive">
                                    <AlertTriangle className="size-3" />
                                    Descubierto excedido
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => startEdit(acc)}
                                  aria-label="Editar cuenta"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                {checkingAccounts.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setToDelete(acc)}
                                    aria-label="Eliminar cuenta"
                                  >
                                    <Trash2 className="size-3.5 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* FORM TO CREATE OR EDIT */
                <form onSubmit={handleSaveAccount} className="space-y-4 pt-1">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-semibold">
                      {editingId !== null ? "Editar Cuenta Corriente" : "Nueva Cuenta Corriente"}
                    </h3>
                    <Button variant="ghost" size="sm" type="button" onClick={resetForm}>
                      Cancelar
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium">Nombre de la cuenta *</label>
                      <Input
                        placeholder="Ej: Galicia Pesos, Mercado Pago, Santander USD"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Banco o Entidad</label>
                      <Input
                        placeholder="Ej: Banco Galicia, BBVA, Brubank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">CBU, CVU o Alias</label>
                      <Input
                        placeholder="Opcional"
                        value={cbuOrAlias}
                        onChange={(e) => setCbuOrAlias(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Moneda de la cuenta</label>
                      <div className="flex gap-2">
                        {(["ARS", "USD"] as Currency[]).map((c) => (
                          <Button
                            key={c}
                            type="button"
                            size="sm"
                            variant={accountCurrency === c ? "default" : "outline"}
                            className="flex-1 text-xs"
                            onClick={() => setAccountCurrency(c)}
                          >
                            {c === "ARS" ? "🇦🇷 ARS" : "🇺🇸 USD"}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Saldo de Apertura / Inicial</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium">
                        Límite de Descubierto Acordado ({accountCurrency})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={overdraftLimit}
                        onChange={(e) => setOverdraftLimit(e.target.value)}
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Monto máximo que permite el banco girar en descubierto (saldo negativo).
                      </span>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium">Color distintivo</label>
                      <ColorPicker value={color} onChange={setColor} />
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2 pt-1">
                      <input
                        type="checkbox"
                        id="is-default-account"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="is-default-account" className="text-xs font-medium cursor-pointer">
                        Establecer como cuenta corriente predeterminada
                      </label>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-popover flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 pb-1 border-t mt-4">
                    <Button variant="outline" type="button" onClick={resetForm} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">
                      <Check className="size-4" data-icon="inline-start" />
                      {editingId !== null ? "Guardar cambios" : "Crear cuenta"}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            {/* TAB 2: TRANSFER BETWEEN ACCOUNTS */}
            <TabsContent value="transfer" className="space-y-4 pt-3 overflow-y-auto max-h-[calc(85vh-140px)] pr-1">
              <form onSubmit={handleTransfer} className="space-y-4 pt-1">
                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Las transferencias entre tus cuentas propias no alteran tus métricas de ingresos ni gastos: representan movimientos neutros de fondos entre dos cuentas.
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Cuenta de Origen (Debitar)</label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={sourceAccountId ?? ""}
                      onChange={(e) => {
                        const id = Number(e.target.value) || null
                        setSourceAccountId(id)
                      }}
                      required
                    >
                      <option value="">Seleccionar cuenta de origen...</option>
                      {checkingAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id} disabled={acc.id === targetAccountId}>
                          {acc.name} ({acc.currency}) — Saldo: ${acc.currentBalance?.toLocaleString("es-AR")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Cuenta de Destino (Acreditar)</label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={targetAccountId ?? ""}
                      onChange={(e) => {
                        const id = Number(e.target.value) || null
                        setTargetAccountId(id)
                      }}
                      required
                    >
                      <option value="">Seleccionar cuenta de destino...</option>
                      {checkingAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id} disabled={acc.id === sourceAccountId}>
                          {acc.name} ({acc.currency}) — Saldo: ${acc.currentBalance?.toLocaleString("es-AR")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Monto a debitar</label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => handleSourceAmountChange(e.target.value)}
                      required
                    />
                  </div>

                  {sourceAccountId &&
                    targetAccountId &&
                    checkingAccounts.find((a) => a.id === sourceAccountId)?.currency !==
                      checkingAccounts.find((a) => a.id === targetAccountId)?.currency && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium">
                          Monto a acreditar ({checkingAccounts.find((a) => a.id === targetAccountId)?.currency})
                        </label>
                        <Input
                          type="number"
                          step="any"
                          min="0.01"
                          placeholder="0.00"
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(e.target.value)}
                          required
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Cotización estimada aplicada automáticamente. Podés ajustarla.
                        </span>
                      </div>
                    )}

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium">Nota o Concepto (opcional)</label>
                    <Input
                      placeholder="Ej: Fondeo cuenta en dólares, traspaso para pagar tarjeta"
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 bg-popover flex justify-end gap-2 pt-3 pb-1 border-t mt-4">
                  <Button type="submit" className="w-full sm:w-auto">
                    <ArrowLeftRight className="size-4" data-icon="inline-start" />
                    Ejecutar Transferencia
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar cuenta corriente?"
        description={`Se archivará la cuenta "${toDelete?.name}". Sus transacciones históricas se preservarán para no alterar balances pasados.`}
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
