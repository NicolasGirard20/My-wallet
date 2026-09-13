"use client"

import { useCallback, useMemo, useState } from "react"
import { Check, ChevronDown, Copy, Delete } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useCurrency } from "@/context/currency-context"
import { CURRENCY_META, formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { CalculatorActions, HistoryEntry } from "./use-calculator"
import { formatCalcValue } from "./use-calculator"

interface CalculatorPanelProps {
  calc: CalculatorActions
}

function calcCopy(value: string) {
  navigator.clipboard.writeText(value).then(
    () => toast.success("Resultado copiado"),
    () => toast.error("No se pudo copiar"),
  )
}

function HistoryItem({
  entry,
  onApply,
}: {
  entry: HistoryEntry
  onApply: (value: string) => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      calcCopy(entry.result)
      setCopiedId(entry.id)
      setTimeout(() => setCopiedId(null), 1500)
    },
    [entry],
  )

  return (
    <div className="group flex w-full items-center gap-1 rounded-lg pr-1.5 transition-colors hover:bg-muted">
      <button
        type="button"
        onClick={() => onApply(entry.result)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs"
      >
        <span className="flex-1 truncate text-muted-foreground">
          {entry.expression}
        </span>
        <span className="font-mono tabular-nums text-foreground">
          {formatCalcValue(entry.result)}
        </span>
      </button>
      <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar resultado"
          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        >
          {copiedId === entry.id ? (
            <Check className="size-3 text-primary" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      </span>
    </div>
  )
}

export function CalculatorPanel({ calc }: CalculatorPanelProps) {
  const { currency, rate } = useCurrency()
  const [historyOpen, setHistoryOpen] = useState(false)

  const otherCurrency = currency === "USD" ? "ARS" : "USD"

  const convertedValue = useMemo(() => {
    if (!rate || !rate.compra || !rate.venta) return null
    const tasa = (rate.compra + rate.venta) / 2
    if (!Number.isFinite(tasa) || tasa <= 0) return null
    const value = calc.displayValue
    if (value === 0) return null
    return currency === "USD" ? value * tasa : value / tasa
  }, [rate, currency, calc.displayValue])

  const formattedConversion =
    convertedValue !== null && Number.isFinite(convertedValue)
      ? formatCurrency(convertedValue, otherCurrency, { compact: true })
      : null

  const handleCopy = useCallback(() => calcCopy(calc.rawValue), [calc.rawValue])

  const handleConversionClick = useCallback(() => {
    if (convertedValue !== null && Number.isFinite(convertedValue)) {
      calc.applyValue(String(convertedValue))
    }
  }, [convertedValue, calc])

  return (
    <div className="flex flex-col gap-3">
      {/* Display */}
      <div className="flex min-h-[5.5rem] flex-col items-end justify-end gap-0.5 rounded-xl bg-muted/30 p-3 pt-2">
        {calc.state.expression || calc.state.accumulator !== null ? (
          <span className="h-4 truncate text-xs text-muted-foreground">
            {calc.state.expression}
          </span>
        ) : (
          <span className="h-4" />
        )}

        <div className="flex w-full items-center justify-end gap-2">
          <span
            className={cn(
              "font-mono tabular-nums leading-none text-foreground",
              calc.state.display.length > 12 ? "text-2xl" : "text-3xl",
            )}
          >
            {calc.formattedDisplay}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copiar resultado"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
        </div>

        {/* Conversion chip */}
        {formattedConversion && rate ? (
          <button
            type="button"
            onClick={handleConversionClick}
            className="mt-0.5 flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span>{CURRENCY_META[otherCurrency].flag}</span>
            <span>
              {CURRENCY_META[otherCurrency].symbol} {formattedConversion}
            </span>
            <span className="font-medium">{otherCurrency}</span>
          </button>
        ) : null}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <Button variant="ghost" onClick={calc.clearAll} className="h-10 font-medium">
          AC
        </Button>
        <Button variant="ghost" onClick={calc.backspace} className="h-10">
          <Delete className="size-4" />
        </Button>
        <Button variant="ghost" onClick={calc.percent} className="h-10">
          %
        </Button>
        <Button
          variant="secondary"
          onClick={() => calc.setOperation("/")}
          className={cn(
            "h-10 text-base",
            calc.state.operator === "/" && "bg-primary text-primary-foreground",
          )}
        >
          ÷
        </Button>

        {/* Row 2 */}
        <CalculatorButton onClick={() => calc.inputDigit("7")}>7</CalculatorButton>
        <CalculatorButton onClick={() => calc.inputDigit("8")}>8</CalculatorButton>
        <CalculatorButton onClick={() => calc.inputDigit("9")}>9</CalculatorButton>
        <OperatorButton
          active={calc.state.operator === "*"}
          onClick={() => calc.setOperation("*")}
        >
          ×
        </OperatorButton>

        {/* Row 3 */}
        <CalculatorButton onClick={() => calc.inputDigit("4")}>4</CalculatorButton>
        <CalculatorButton onClick={() => calc.inputDigit("5")}>5</CalculatorButton>
        <CalculatorButton onClick={() => calc.inputDigit("6")}>6</CalculatorButton>
        <OperatorButton
          active={calc.state.operator === "-"}
          onClick={() => calc.setOperation("-")}
        >
          −
        </OperatorButton>

        {/* Row 4 */}
        <CalculatorButton onClick={() => calc.inputDigit("1")}>1</CalculatorButton>
        <CalculatorButton onClick={() => calc.inputDigit("2")}>2</CalculatorButton>
        <CalculatorButton onClick={() => calc.inputDigit("3")}>3</CalculatorButton>
        <OperatorButton
          active={calc.state.operator === "+"}
          onClick={() => calc.setOperation("+")}
        >
          +
        </OperatorButton>

        {/* Row 5 */}
        <Button variant="ghost" onClick={calc.toggleSign} className="h-10 text-base">
          ±
        </Button>
        <CalculatorButton onClick={() => calc.inputDigit("0")}>0</CalculatorButton>
        <Button variant="ghost" onClick={calc.inputDot} className="h-10 text-base">
          ,
        </Button>
        <Button
          variant="default"
          onClick={calc.calculate}
          className="h-10 text-base font-semibold"
        >
          =
        </Button>
      </div>

      {/* History */}
      {calc.history.length > 0 && (
        <div className="border-t pt-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex w-full items-center gap-1.5 px-1 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn("size-3 transition-transform", historyOpen && "rotate-180")}
            />
            Historial ({calc.history.length})
          </button>

          {historyOpen && (
            <div className="mt-1 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {calc.history.map((entry) => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  onApply={calc.applyValue}
                />
              ))}
              {calc.history.length > 0 && (
                <button
                  type="button"
                  onClick={calc.clearHistory}
                  className="mt-1 self-start px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                >
                  Limpiar historial
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CalculatorButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className="h-10 text-base font-medium bg-muted/80 text-foreground border border-border hover:bg-muted"
    >
      {children}
    </Button>
  )
}

function OperatorButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant={active ? "default" : "secondary"}
      onClick={onClick}
      className={cn(
        "h-10 text-base",
        !active && "bg-primary/10 text-primary hover:bg-primary/20",
      )}
    >
      {children}
    </Button>
  )
}