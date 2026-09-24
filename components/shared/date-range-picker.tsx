"use client"

import { useMemo } from "react"
import { CalendarRange, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface DateRangePickerProps {
  dateFrom?: string
  dateTo?: string
  onChange?: (from: string, to: string) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  size?: "default" | "sm" | "lg"
  align?: "start" | "center" | "end"
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
  onClear,
  placeholder = "Todo el historial",
  className,
  size = "default",
  align = "start",
}: DateRangePickerProps) {
  const hasFrom = Boolean(dateFrom)
  const hasTo = Boolean(dateTo)
  const hasActiveDates = hasFrom || hasTo

  const label = useMemo(() => {
    if (hasFrom && hasTo) {
      if (dateFrom === dateTo) {
        return formatDate(dateFrom!, "short")
      }
      return `${formatDate(dateFrom!, "short")} — ${formatDate(dateTo!, "short")}`
    }
    if (hasFrom) return `Desde ${formatDate(dateFrom!, "short")}`
    if (hasTo) return `Hasta ${formatDate(dateTo!, "short")}`
    return placeholder
  }, [hasFrom, hasTo, dateFrom, dateTo, placeholder])

  function handleFromChange(newFrom: string) {
    let nextTo = dateTo ?? ""
    if (newFrom && nextTo && newFrom > nextTo) {
      nextTo = newFrom
    }
    onChange?.(newFrom, nextTo)
  }

  function handleToChange(newTo: string) {
    let nextFrom = dateFrom ?? ""
    if (newTo && nextFrom && newTo < nextFrom) {
      nextFrom = newTo
    }
    onChange?.(nextFrom, newTo)
  }

  function handleClear() {
    onClear?.()
    onChange?.("", "")
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size={size}
              className={cn(
                "justify-start gap-2 font-normal",
                !hasActiveDates && "text-muted-foreground",
              )}
            />
          }
        >
          <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </PopoverTrigger>
        <PopoverContent align={align} className="w-72 p-3 shadow-md">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-semibold text-foreground">Rango de fechas</span>
              {hasActiveDates && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleClear}
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpiar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Desde</span>
                <Input
                  type="date"
                  value={dateFrom ?? ""}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className="h-8 text-xs"
                  aria-label="Desde"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Hasta</span>
                <Input
                  type="date"
                  value={dateTo ?? ""}
                  onChange={(e) => handleToChange(e.target.value)}
                  className="h-8 text-xs"
                  aria-label="Hasta"
                />
              </label>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveDates && (
        <Button
          type="button"
          variant="ghost"
          size={size === "sm" ? "icon-xs" : "icon-sm"}
          onClick={handleClear}
          className="size-7 text-muted-foreground hover:text-foreground"
          title="Limpiar fechas"
          aria-label="Limpiar fechas"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
