"use client"

import { useCurrency } from "@/context/currency-context"
import { CURRENCY_META } from "@/lib/format"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"

const OPTIONS: Currency[] = ["USD", "ARS"]

export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency()

  return (
    <div
      role="group"
      aria-label="Seleccionar moneda"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border bg-muted/60 p-1",
        className,
      )}
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
  )
}
