"use client"

import { DateRangePicker } from "@/components/shared/date-range-picker"

export type PeriodFilter = { mode: "total" } | { mode: "range"; from: string; to: string }

interface PeriodFilterProps {
  value: PeriodFilter
  onChange: (value: PeriodFilter) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const dateFrom = value.mode === "range" ? value.from : ""
  const dateTo = value.mode === "range" ? value.to : ""

  function handleChange(from: string, to: string) {
    if (!from && !to) {
      onChange({ mode: "total" })
      return
    }
    const safeFrom = from || to
    const safeTo = to || from
    onChange({ mode: "range", from: safeFrom, to: safeTo })
  }

  function handleClear() {
    onChange({ mode: "total" })
  }

  return (
    <DateRangePicker
      dateFrom={dateFrom}
      dateTo={dateTo}
      onChange={handleChange}
      onClear={handleClear}
      placeholder="Todo el historial"
    />
  )
}