"use client"

import { useCurrency } from "@/context/currency-context"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AmountDisplayProps {
  value: number
  kind?: "income" | "expense" | "neutral"
  showSign?: boolean
  compact?: boolean
  className?: string
  from?: Currency
}

export function AmountDisplay({
  value,
  kind = "neutral",
  showSign = false,
  compact = false,
  className,
  from,
}: AmountDisplayProps) {
  const { format, convert } = useCurrency()

  const amount = from ? convert(value, from) : value

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        kind === "income" && "text-primary",
        kind === "expense" && "text-destructive",
        className,
      )}
    >
      {format(amount, { compact, showSign })}
    </span>
  )
}
