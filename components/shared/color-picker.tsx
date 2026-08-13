"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export const CHART_COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHART_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Color ${color}`}
          className={cn(
            "flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-all",
            value === color ? "ring-2 ring-ring" : "hover:scale-110",
          )}
          style={{ backgroundColor: `var(${color})` }}
        >
          {value === color ? <Check className="size-4 text-white" /> : null}
        </button>
      ))}
    </div>
  )
}
