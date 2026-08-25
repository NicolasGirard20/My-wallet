"use client"

import { CalendarRange } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type PeriodFilter = { mode: "total" } | { mode: "range"; from: string; to: string }

interface PeriodFilterProps {
  value: PeriodFilter
  onChange: (value: PeriodFilter) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  function handleModeChange(mode: string) {
    if (mode === "range") {
      const today = todayInput()
      onChange({ mode: "range", from: today, to: today })
    } else {
      onChange({ mode: "total" })
    }
  }

  function handleFromChange(from: string) {
    if (value.mode !== "range") return
    const to = from > value.to ? from : value.to
    onChange({ mode: "range", from, to })
  }

  function handleToChange(to: string) {
    if (value.mode !== "range") return
    const from = to < value.from ? to : value.from
    onChange({ mode: "range", from, to })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value.mode} onValueChange={handleModeChange}>
        <SelectTrigger className="w-44" aria-label="Período del resumen">
          <SelectValue>
            {(v) => (v === "range" ? "Rango personalizado" : "Total")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="total">Total</SelectItem>
            <SelectItem value="range">Rango personalizado</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {value.mode === "range" ? (
        <>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Desde</span>
            <Input
              type="date"
              value={value.from}
              onChange={(e) => handleFromChange(e.target.value)}
              className="w-36"
              aria-label="Desde"
            />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Hasta</span>
            <Input
              type="date"
              value={value.to}
              onChange={(e) => handleToChange(e.target.value)}
              className="w-36"
              aria-label="Hasta"
            />
          </label>
        </>
      ) : (
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
          <CalendarRange className="size-3.5" />
          Todo el historial
        </span>
      )}
    </div>
  )
}

function todayInput() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}