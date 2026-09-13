"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Landmark,
  Plus,
  Settings,
  Wallet,
} from "lucide-react"

import { useData } from "@/context/data-context"
import { useCurrency } from "@/context/currency-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckingAccountManager } from "@/components/layout/checking-account-manager"
import { cn } from "@/lib/utils"

export function CheckingAccountSelector({ className }: { className?: string }) {
  const {
    checkingAccounts,
    selectedAccountId,
    setSelectedAccountId,
    activeAccount,
  } = useData()
  const { currency, convert, format } = useCurrency()
  const [managerOpen, setManagerOpen] = useState(false)
  const [managerTab, setManagerTab] = useState<"accounts" | "transfer">("accounts")

  // Calculate total net balance across all accounts converted to active display currency
  const totalBalanceConverted = checkingAccounts.reduce((acc, a) => {
    const bal = a.currentBalance ?? a.initialBalance
    return acc + convert(bal, a.currency)
  }, 0)

  // Active account balance converted to active display currency
  const activeBalanceConverted = activeAccount
    ? convert(activeAccount.currentBalance ?? activeAccount.initialBalance, activeAccount.currency)
    : totalBalanceConverted

  const isOverdrawn =
    activeAccount &&
    (activeAccount.currentBalance ?? activeAccount.initialBalance) < 0

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border bg-background/80 px-2.5 sm:px-3 py-1.5 text-xs font-medium shadow-xs transition-all hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[190px] sm:max-w-[250px]",
                isOverdrawn && "border-amber-500/50 bg-amber-500/5",
                className,
              )}
            />
          }
        >
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md text-primary-foreground",
              activeAccount ? "" : "bg-primary",
            )}
            style={
              activeAccount
                ? { backgroundColor: `var(${activeAccount.color})` }
                : undefined
            }
          >
            {activeAccount ? (
              <Landmark className="size-3.5" />
            ) : (
              <Wallet className="size-3.5" />
            )}
          </span>

          <div className="flex flex-col text-left min-w-0">
            <span className="flex items-center gap-1 font-semibold text-foreground leading-tight truncate">
              <span className="truncate">{activeAccount ? activeAccount.name : "Cuenta Corriente"}</span>
              {activeAccount && (
                <span className="text-[10px] font-normal text-muted-foreground shrink-0">
                  ({activeAccount.currency})
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground leading-none">
              {format(activeBalanceConverted)}
            </span>
          </div>

          <ChevronDown className="size-3.5 text-muted-foreground ml-0.5 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 sm:w-80">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold">Mis Cuentas Corrientes</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Visor: {currency}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* GLOBAL CONSOLIDATED VIEW */}
          <DropdownMenuItem
            onClick={() => setSelectedAccountId("all")}
            className="flex items-center justify-between cursor-pointer py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Wallet className="size-3.5" />
              </span>
              <div className="min-w-0">
                <span className="font-medium text-xs block">
                  Todas las cuentas (Vista global)
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Patrimonio total consolidado
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs font-semibold tabular-nums">
                {format(totalBalanceConverted)}
              </span>
              {selectedAccountId === "all" && <Check className="size-4 text-primary" />}
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* LIST OF INDIVIDUAL CHECKING ACCOUNTS */}
          <div className="max-h-60 overflow-y-auto py-1">
            {checkingAccounts.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                No hay cuentas configuradas
              </div>
            ) : (
              checkingAccounts.map((acc) => {
                const bal = acc.currentBalance ?? acc.initialBalance
                const convertedBal = convert(bal, acc.currency)
                const isSelected = selectedAccountId === acc.id
                const isNegative = bal < 0

                return (
                  <DropdownMenuItem
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: `var(${acc.color})` }}
                      >
                        <Landmark className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-medium">
                            {acc.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 leading-none"
                          >
                            {acc.currency}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {acc.bankName ?? "Bancaria / Billetera"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-right">
                      <div>
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold tabular-nums block",
                            isNegative && "text-destructive",
                          )}
                        >
                          {format(convertedBal)}
                        </span>
                        {acc.currency !== currency && (
                          <span className="font-mono text-[9px] text-muted-foreground/80 block tabular-nums">
                            {acc.currency === "ARS" ? "$" : "US$"}{" "}
                            {bal.toLocaleString("es-AR", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                        {isNegative && (
                          <span className="flex items-center justify-end gap-0.5 text-[9px] text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-2.5" />
                            Descubierto
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="size-4 text-primary" />}
                    </div>
                  </DropdownMenuItem>
                )
              })
            )}
          </div>

          <DropdownMenuSeparator />

          {/* ACTION BUTTONS */}
          <DropdownMenuItem
            onClick={() => {
              setManagerTab("accounts")
              setManagerOpen(true)
            }}
            className="cursor-pointer gap-2 py-2 text-xs font-medium text-primary"
          >
            <Settings className="size-3.5" />
            Gestionar cuentas corrientes
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setManagerTab("transfer")
              setManagerOpen(true)
            }}
            className="cursor-pointer gap-2 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Transferir entre cuentas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CheckingAccountManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        initialTab={managerTab}
      />
    </>
  )
}
