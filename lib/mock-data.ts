import type { Category, Investment, SavingGoal, Transaction } from "./types"

function daysAgo(n: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

let seq = 0
function nextId(): number {
  seq += 1
  return seq
}

export const genId = nextId

export const initialCategories: Category[] = [
  { id: 1, name: "Sueldo", kind: "income", color: "--chart-1" },
  { id: 2, name: "Freelance", kind: "income", color: "--chart-2" },
  { id: 3, name: "Dividendos", kind: "income", color: "--chart-3" },
  { id: 4, name: "Regalos", kind: "income", color: "--chart-4" },

  { id: 5, name: "Comida", kind: "expense", color: "--chart-1" },
  { id: 6, name: "Alquiler", kind: "expense", color: "--chart-2" },
  { id: 7, name: "Transporte", kind: "expense", color: "--chart-3" },
  { id: 8, name: "Ocio", kind: "expense", color: "--chart-4" },
  { id: 9, name: "Servicios", kind: "expense", color: "--chart-5" },
]

export const initialTransactions: Transaction[] = [
  { id: nextId(), kind: "income", amount: 3200, description: "Sueldo mensual", categoryId: 1, currency: "USD", date: daysAgo(2) },
  { id: nextId(), kind: "income", amount: 850, description: "Proyecto web cliente", categoryId: 2, currency: "USD", date: daysAgo(8) },
  { id: nextId(), kind: "income", amount: 120, description: "Dividendos ETF", categoryId: 3, currency: "USD", date: daysAgo(15) },
  { id: nextId(), kind: "income", amount: 3200, description: "Sueldo mensual", categoryId: 1, currency: "USD", date: daysAgo(32) },
  { id: nextId(), kind: "income", amount: 500, description: "Freelance logo", categoryId: 2, currency: "USD", date: daysAgo(40) },
  { id: nextId(), kind: "income", amount: 3200, description: "Sueldo mensual", categoryId: 1, currency: "USD", date: daysAgo(62) },
  { id: nextId(), kind: "income", amount: 200, description: "Regalo cumpleaños", categoryId: 4, currency: "USD", date: daysAgo(70) },

  { id: nextId(), kind: "expense", amount: 1100, description: "Alquiler depto", categoryId: 6, currency: "USD", date: daysAgo(1) },
  { id: nextId(), kind: "expense", amount: 320, description: "Supermercado", categoryId: 5, currency: "USD", date: daysAgo(3) },
  { id: nextId(), kind: "expense", amount: 90, description: "Nafta", categoryId: 7, currency: "USD", date: daysAgo(5) },
  { id: nextId(), kind: "expense", amount: 60, description: "Cine y cena", categoryId: 8, currency: "USD", date: daysAgo(6) },
  { id: nextId(), kind: "expense", amount: 140, description: "Luz, gas e internet", categoryId: 9, currency: "USD", date: daysAgo(9) },
  { id: nextId(), kind: "expense", amount: 1100, description: "Alquiler depto", categoryId: 6, currency: "USD", date: daysAgo(31) },
  { id: nextId(), kind: "expense", amount: 280, description: "Supermercado", categoryId: 5, currency: "USD", date: daysAgo(34) },
  { id: nextId(), kind: "expense", amount: 75, description: "Suscripciones", categoryId: 8, currency: "USD", date: daysAgo(38) },
  { id: nextId(), kind: "expense", amount: 1100, description: "Alquiler depto", categoryId: 6, currency: "USD", date: daysAgo(61) },
  { id: nextId(), kind: "expense", amount: 300, description: "Supermercado", categoryId: 5, currency: "USD", date: daysAgo(66) },
  { id: nextId(), kind: "expense", amount: 130, description: "Servicios", categoryId: 9, currency: "USD", date: daysAgo(69) },
]

export const initialSavings: SavingGoal[] = [
  { id: nextId(), name: "Fondo de emergencia", target: 10000, saved: 6400, color: "--chart-1", currency: "USD", deadline: daysAgo(-240) },
  { id: nextId(), name: "Viaje a Europa", target: 5000, saved: 1850, color: "--chart-2", currency: "USD", deadline: daysAgo(-180) },
  { id: nextId(), name: "Notebook nueva", target: 1800, saved: 1200, color: "--chart-3", currency: "USD", deadline: daysAgo(-90) },
]

export const initialInvestments: Investment[] = [
  {
    id: nextId(),
    name: "Cartera CEDEARs",
    description: "Índice S&P 500 vía CEDEARs",
    invested: 4000,
    currentValue: 4720,
    currency: "USD",
    createdAt: daysAgo(210),
    contributions: [
      { id: nextId(), date: daysAgo(210), amount: 2000, currency: "USD", note: "Aporte inicial" },
      { id: nextId(), date: daysAgo(120), amount: 1000, currency: "USD", note: "Aporte" },
      { id: nextId(), date: daysAgo(40), amount: 1000, currency: "USD", note: "Aporte" },
    ],
  },
  {
    id: nextId(),
    name: "Cripto (BTC/ETH)",
    description: "Posición de largo plazo",
    invested: 1500,
    currentValue: 1290,
    currency: "USD",
    createdAt: daysAgo(150),
    contributions: [
      { id: nextId(), date: daysAgo(150), amount: 1000, currency: "USD", note: "Aporte inicial" },
      { id: nextId(), date: daysAgo(60), amount: 500, currency: "USD", note: "DCA" },
    ],
  },
  {
    id: nextId(),
    name: "Plazo fijo UVA",
    description: "Ahorro ajustado por inflación",
    invested: 2000,
    currentValue: 2210,
    currency: "USD",
    createdAt: daysAgo(95),
    contributions: [{ id: nextId(), date: daysAgo(95), amount: 2000, currency: "USD", note: "Constitución" }],
  },
]
