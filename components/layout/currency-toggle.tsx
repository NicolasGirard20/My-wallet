"use client"

import { CircleHelp, RefreshCw } from "lucide-react"

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
              {rate ? `Dólar ${rate.nombre}` : "Cotización"}
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
            aria-hidden
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Tipo de dólar</span>
              {updatedAtLabel ? (
                <span className="text-[10px] font-normal text-muted-foreground">
                  {updatedAtLabel} hs
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
                  <span className="flex flex-1 items-center justify-between gap-2">
                    <span>{r.nombre}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      ${r.venta.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))
            )}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => refreshRates()} disabled={ratesLoading}>
            <RefreshCw className={cn("size-4", ratesLoading && "animate-spin")} />
            Actualizar cotización
            <Tooltip>
              <TooltipTrigger
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="ml-auto flex items-center"
              >
                <CircleHelp className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-56 text-xs">
                La cotización se actualiza automáticamente cada 5 minutos. Usá este botón para forzar una actualización manual si querés el valor más reciente.
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
