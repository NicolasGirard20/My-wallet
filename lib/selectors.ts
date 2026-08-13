import type { Category, Transaction } from "./types"

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

// Last `count` months of income vs expense, oldest -> newest.
export function monthlySeries(transactions: Transaction[], count = 6): MonthlyPoint[] {
  const now = new Date()
  const points: MonthlyPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    points.push({
      key,
      month: d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
      income: 0,
      expense: 0,
    })
  }
  const index = new Map(points.map((p) => [p.key, p]))
  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
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
