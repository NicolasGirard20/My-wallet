"use client"

import { useCurrency } from "@/context/currency-context"
import { cn } from "@/lib/utils"

interface AmountDisplayProps {
  value: number
  kind?: "income" | "expense" | "neutral"
  showSign?: boolean
  compact?: boolean
  className?: string
}

export function AmountDisplay({
  value,
  kind = "neutral",
  showSign = false,
  compact = false,
  className,
}: AmountDisplayProps) {
  const { format } = useCurrency()

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        kind === "income" && "text-primary",
        kind === "expense" && "text-destructive",
        className,
      )}
    >
      {format(value, { compact, showSign })}
    </span>
  )
}
