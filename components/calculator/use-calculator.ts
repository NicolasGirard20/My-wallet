"use client"

import { useCallback, useMemo, useState } from "react"

import { logger } from "@/app/imports/dev"

type Operation = "+" | "-" | "*" | "/"

interface CalculatorState {
  display: string
  accumulator: number | null
  operator: Operation | null
  overwrite: boolean
  error: boolean
  expression: string
}

export interface HistoryEntry {
  id: string
  expression: string
  result: string
  timestamp: number
}

const INITIAL: CalculatorState = {
  display: "0",
  accumulator: null,
  operator: null,
  overwrite: false,
  error: false,
  expression: "",
}

const HISTORY_KEY = "mywallet.calcHistory"
const MAX_HISTORY = 10

const OP_SYMBOL: Record<Operation, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
}

function round(n: number): number {
  return Math.round(n * 1e12) / 1e12
}

function operate(a: number, op: Operation, b: number): number {
  switch (op) {
    case "+":
      return a + b
    case "-":
      return a - b
    case "*":
      return a * b
    case "/":
      return b !== 0 ? a / b : NaN
  }
}

function buildExpression(
  accumulator: number | null,
  operator: Operation | null,
  display: string,
): string {
  if (accumulator === null || operator === null) return ""
  const accFormatted = accumulator.toLocaleString("es-AR", { maximumFractionDigits: 10 })
  const displayFormatted = parseFloat(display).toLocaleString("es-AR", { maximumFractionDigits: 10 })
  return `${accFormatted} ${OP_SYMBOL[operator]} ${displayFormatted} =`
}

export function formatCalcValue(value: string): string {
  const num = parseFloat(value)
  if (!Number.isFinite(num)) return value
  return num.toLocaleString("es-AR", { maximumFractionDigits: 10 })
}

function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHistory(history: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    logger.warn("Failed to save calculator history")
  }
}

export interface CalculatorActions {
  inputDigit: (digit: string) => void
  inputDot: () => void
  setOperation: (op: Operation) => void
  calculate: () => void
  clearAll: () => void
  backspace: () => void
  toggleSign: () => void
  percent: () => void
  applyValue: (value: string) => void
  clearHistory: () => void
  history: HistoryEntry[]
  state: CalculatorState
  formattedDisplay: string
  displayValue: number
  rawValue: string
}

export function useCalculator(): CalculatorActions {
  const [state, setState] = useState<CalculatorState>(INITIAL)
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)

  const displayValue = useMemo(() => {
    if (state.error) return 0
    const num = parseFloat(state.display)
    return Number.isFinite(num) ? num : 0
  }, [state.display, state.error])

  const formattedDisplay = useMemo(() => {
    if (state.error) return "Error"
    const hasTrailingDot = state.display.endsWith(".")
    const clean = hasTrailingDot ? state.display.slice(0, -1) : state.display
    const num = parseFloat(clean)
    if (!Number.isFinite(num)) return state.display
    const formatted = num.toLocaleString("es-AR", { maximumFractionDigits: 10 })
    return hasTrailingDot ? formatted + "," : formatted
  }, [state.display, state.error])

  const rawValue = state.error ? "0" : state.display

  const inputDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.error) return { ...INITIAL, display: digit, expression: "" }
      if (prev.overwrite) {
        return { ...prev, display: digit, overwrite: false, expression: "" }
      }
      if (prev.display === "0" && digit !== ".") {
        return { ...prev, display: digit }
      }
      if (prev.display.length >= 16) return prev
      return { ...prev, display: prev.display + digit }
    })
  }, [])

  const inputDot = useCallback(() => {
    setState((prev) => {
      if (prev.error) return { ...INITIAL, display: "0.", expression: "" }
      if (prev.overwrite) {
        return { ...prev, display: "0.", overwrite: false, expression: "" }
      }
      if (prev.display.includes(".")) return prev
      return { ...prev, display: prev.display + "." }
    })
  }, [])

  const setOperation = useCallback((op: Operation) => {
    setState((prev) => {
      if (prev.error) return prev
      const current = parseFloat(prev.display)
      if (!Number.isFinite(current)) return prev

      if (prev.accumulator !== null && prev.operator !== null && !prev.overwrite) {
        const result = round(operate(prev.accumulator, prev.operator, current))
        if (!Number.isFinite(result)) {
          return { ...INITIAL, error: true, display: "Error" }
        }
        return {
          display: String(result),
          accumulator: result,
          operator: op,
          overwrite: true,
          error: false,
          expression: "",
        }
      }

      return {
        ...prev,
        accumulator: current,
        operator: op,
        overwrite: true,
        expression: "",
      }
    })
  }, [])

  const calculate = useCallback(() => {
    setState((prev) => {
      if (prev.error) return prev
      if (prev.accumulator === null || prev.operator === null) return prev

      const current = parseFloat(prev.display)
      if (!Number.isFinite(current)) return prev

      const result = round(operate(prev.accumulator, prev.operator, current))
      if (!Number.isFinite(result)) {
        return { ...INITIAL, error: true, display: "Error" }
      }

      const expressionStr = buildExpression(prev.accumulator, prev.operator, prev.display)
      const resultStr = String(result)

      const entry: HistoryEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        expression: expressionStr,
        result: resultStr,
        timestamp: Date.now(),
      }

      setHistory((h) => {
        const updated = [entry, ...h].slice(0, MAX_HISTORY)
        saveHistory(updated)
        return updated
      })

      return {
        display: resultStr,
        accumulator: result,
        operator: null,
        overwrite: true,
        error: false,
        expression: `${expressionStr} ${formatCalcValue(resultStr)}`,
      }
    })
  }, [])

  const clearAll = useCallback(() => setState(INITIAL), [])

  const backspace = useCallback(() => {
    setState((prev) => {
      if (prev.error) return INITIAL
      if (prev.overwrite) return { ...prev, display: "0", overwrite: false }
      const next = prev.display.length <= 1 ? "0" : prev.display.slice(0, -1)
      return { ...prev, display: next }
    })
  }, [])

  const toggleSign = useCallback(() => {
    setState((prev) => {
      if (prev.error) return prev
      const num = parseFloat(prev.display)
      if (!Number.isFinite(num) || num === 0) return prev
      return { ...prev, display: String(round(-num)) }
    })
  }, [])

  const percent = useCallback(() => {
    setState((prev) => {
      if (prev.error) return prev
      const num = parseFloat(prev.display)
      if (!Number.isFinite(num)) return prev
      return { ...prev, display: String(round(num / 100)), overwrite: true }
    })
  }, [])

  const applyValue = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      display: value,
      overwrite: true,
      error: false,
      expression: "",
    }))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {
      // ignore
    }
  }, [])

  return {
    inputDigit,
    inputDot,
    setOperation,
    calculate,
    clearAll,
    backspace,
    toggleSign,
    percent,
    applyValue,
    clearHistory,
    history,
    state,
    formattedDisplay,
    displayValue,
    rawValue,
  }
}