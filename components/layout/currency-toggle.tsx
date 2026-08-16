"use client"

import { RefreshCw } from "lucide-react"
import { HelpCircle } from "lucide-react"

import { useCurrency } from "@/context/currency-context"
import { CURRENCY_META } from "@/lib/format"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const OPTIONS: Currency[] = ["USD", "ARS"]

export function CurrencyToggle({ className }: { className?: string }) {
  const {
    currency,
    setCurrency,
    rates,
    dollarType,
    setDollarType,
    rate,
    ratesLoading,
    ratesUpdatedAt,
    refreshRates,
    ratesError,
  } = useCurrency()

  const updatedAtLabel = ratesUpdatedAt
    ? new Date(ratesUpdatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="group"
        aria-label="Seleccionar moneda"
        className="inline-flex items-center gap-1 rounded-lg border bg-muted/60 p-1"
      >
        {OPTIONS.map((option) => {
          const active = currency === option
          const meta = CURRENCY_META[option]
          return (
            <button
              key={option}
              type="button"
              onClick={() => setCurrency(option)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span aria-hidden>{meta.flag}</span>
              {option}
            </button>
          )
        })}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground",
            ratesError && "text-destructive",
          )}
        >
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">
              {rate ? `${rate.nombre}:` : "Cotización"}
            </span>
            {rate ? (
              <span className="font-mono tabular-nums">
                ${rate.venta.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </span>
            ) : ratesLoading ? (
              <span>Cargando…</span>
            ) : (
              <span>Sin datos</span>
            )}
          </span>
          <RefreshCw
            className={cn("size-3.5", ratesLoading && "animate-spin")}
            aria-label="Actualizar cotización"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              refreshRates(true)
            }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">Tipo de dólar</span>
              {updatedAtLabel ? (
                <span className="text-[10px] font-normal text-muted-foreground">
                  Actualizado {updatedAtLabel} hs
                </span>
              ) : null}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={dollarType}
            onValueChange={(v) => setDollarType(String(v))}
          >
            {rates.length === 0 && !ratesLoading ? (
              <DropdownMenuItem disabled>Sin cotizaciones disponibles</DropdownMenuItem>
            ) : (
              rates.map((r) => (
                <DropdownMenuRadioItem key={r.casa} value={r.casa}>
                  <span className="grid w-full grid-cols-[minmax(0,1fr)_6rem_6rem] items-center gap-x-3">
                    <span className="truncate">{r.nombre}</span>
                    <span className="text-right font-mono tabular-nums text-muted-foreground">
                      C: ${r.compra.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-right font-mono tabular-nums text-muted-foreground">
                      V: ${r.venta.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))
            )}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => refreshRates(true)} disabled={ratesLoading}>
            <RefreshCw className={cn("size-4", ratesLoading && "animate-spin")} />
            Actualizar cotización
            <Tooltip>
              <TooltipTrigger className="ml-auto cursor-help">
                <HelpCircle className="size-3.5 text-muted-foreground/60 hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <p className="max-w-xs">Actualiza las cotizaciones de dólares desde la API. Los datos pueden tardar unos segundos en reflejarse.</p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuItem>
          {ratesError ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled>
                {ratesError}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
