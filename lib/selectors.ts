import type { Budget, BudgetConsumption, BudgetStatus, Category, Currency, Transaction } from "./types"

export type ConvertFn = (amount: number, from: Currency) => number

export function totals(transactions: Transaction[]) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.kind === "income") income += t.amount
    else expense += t.amount
  }
  return { income, expense, balance: income - expense }
}

export interface MonthlyPoint {
  month: string
  key: string
  income: number
  expense: number
}

export function monthlySeries(transactions: Transaction[], count = 6): MonthlyPoint[] {
  const now = new Date()
  const points: MonthlyPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    points.push({
      key,
      month: d.toLocaleDateString("es-AR", { month: "short", timeZone: "UTC" }).replace(".", ""),
      income: 0,
      expense: 0,
    })
  }
  const index = new Map(points.map((p) => [p.key, p]))
  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    const point = index.get(key)
    if (!point) continue
    if (t.kind === "income") point.income += t.amount
    else point.expense += t.amount
  }
  return points
}

export interface CategorySlice {
  categoryId: number
  name: string
  color: string
  value: number
}

export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  kind: "income" | "expense",
): CategorySlice[] {
  const byCat = new Map<number, number>()
  for (const t of transactions) {
    if (t.kind !== kind) continue
    byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount)
  }
  return categories
    .filter((c) => c.kind === kind)
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      value: byCat.get(c.id) ?? 0,
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function totalsCrossCurrency(transactions: Transaction[], convert: ConvertFn) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    const converted = convert(t.amount, t.currency)
    if (t.kind === "income") income += converted
    else expense += converted
  }
  return { income, expense, balance: income - expense }
}

export function monthlySeriesCrossCurrency(
  transactions: Transaction[],
  convert: ConvertFn,
  options: { count?: number; from?: string; to?: string } = {},
): MonthlyPoint[] {
  const now = new Date()
  const points: MonthlyPoint[] = []

  if (options.from && options.to) {
    const [fy, fm] = options.from.slice(0, 10).split("-").map(Number)
    const [ty, tm] = options.to.slice(0, 10).split("-").map(Number)
    let y = fy
    let m = fm
    while (y < ty || (y === ty && m <= tm)) {
      const d = new Date(Date.UTC(y, m - 1, 1))
      points.push({
        key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`,
        month: d.toLocaleDateString("es-AR", { month: "short", timeZone: "UTC" }).replace(".", ""),
        income: 0,
        expense: 0,
      })
      m++
      if (m > 12) {
        m = 1
        y++
      }
    }
  } else {
    const count = options.count ?? 6
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      points.push({
        key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`,
        month: d.toLocaleDateString("es-AR", { month: "short", timeZone: "UTC" }).replace(".", ""),
        income: 0,
        expense: 0,
      })
    }
  }

  const index = new Map(points.map((p) => [p.key, p]))
  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    const point = index.get(key)
    if (!point) continue
    const converted = convert(t.amount, t.currency)
    if (t.kind === "income") point.income += converted
    else point.expense += converted
  }
  return points
}

export function categoryBreakdownCrossCurrency(
  transactions: Transaction[],
  categories: Category[],
  kind: "income" | "expense",
  convert: ConvertFn,
): CategorySlice[] {
  const byCat = new Map<number, number>()
  for (const t of transactions) {
    if (t.kind !== kind) continue
    const converted = convert(t.amount, t.currency)
    byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + converted)
  }
  return categories
    .filter((c) => c.kind === kind)
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      value: byCat.get(c.id) ?? 0,
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function calculateBudgetConsumption(
  budget: Budget,
  transactions: Transaction[],
  convert?: ConvertFn,
): BudgetConsumption {
  const start = new Date(budget.startDate)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(budget.endDate)
  end.setUTCHours(23, 59, 59, 999)

  let spent = 0

  for (const t of transactions) {
    if (t.kind !== "expense") continue

    if (budget.categoryId !== null && budget.categoryId !== undefined && t.categoryId !== budget.categoryId) {
      continue
    }

    const tDate = new Date(t.date)
    if (tDate < start || tDate > end) {
      continue
    }

    const amount = convert ? convert(t.amount, t.currency) : t.amount
    spent += amount
  }

  const percentage = budget.amountLimit > 0 ? (spent / budget.amountLimit) * 100 : 0

  let status: BudgetStatus = "normal"
  if (percentage >= 100) {
    status = "danger"
  } else if (percentage >= 80) {
    status = "warning"
  }

  return {
    budgetId: budget.id,
    amountLimit: budget.amountLimit,
    spent,
    percentage,
    status,
  }
}