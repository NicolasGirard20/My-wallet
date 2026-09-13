"use client"

import { useState } from "react"
import { Calculator, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { CalculatorPanel } from "./calculator-panel"
import { useCalculator } from "./use-calculator"

export function FloatingCalculator() {
  const [open, setOpen] = useState(false)
  const calc = useCalculator()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            size="icon"
            title="Calculadora"
            aria-label="Calculadora"
            className="fixed bottom-6 right-6 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
          >
            {open ? <X className="size-5" /> : <Calculator className="size-5" />}
          </Button>
        }
      />

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="w-80 rounded-2xl p-4"
      >
        <CalculatorPanel calc={calc} />
      </PopoverContent>
    </Popover>
  )
}