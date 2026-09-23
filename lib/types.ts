export type Currency = "USD" | "ARS"

export type TransactionKind = "income" | "expense"

export type UserRole = "admin" | "user"

export interface User {
  id: number
  username: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface Category {
  id: number
  name: string
  kind: TransactionKind
  color: string // one of the chart tokens, e.g. "--chart-1"
}

export interface Transaction {
  id: number
  kind: TransactionKind
  amount: number // stored in its own currency
  description: string
  categoryId: number
  currency: Currency
  date: string // ISO date string
  savingGoalId?: number
  investmentContributionId?: number
  checkingAccountId?: number
}

export interface CheckingAccount {
  id: number
  name: string
  bankName?: string
  accountNumber?: string
  cbuOrAlias?: string
  currency: Currency
  initialBalance: number
  overdraftLimit: number
  color: string
  isDefault: boolean
  isActive: boolean
  currentBalance?: number // Computado: initialBalance + ingresos - gastos + transferencias
  createdAt: string
}

export interface AccountTransfer {
  id: number
  sourceAccountId: number
  targetAccountId: number
  sourceAmount: number
  targetAmount: number
  exchangeRate?: number
  date: string
  description?: string
}

export interface SavingGoal {
  id: number
  name: string
  target: number // in its own currency
  saved: number // in its own currency
  color: string
  currency: Currency
  deadline?: string | null
  checkingAccountId?: number | null
}

export interface InvestmentContribution {
  id: number
  date: string
  amount: number // in its own currency, positive = aporte, negative = retiro/retorno registrado
  currency: Currency
  note?: string
  checkingAccountId?: number | null
}

export interface Investment {
  id: number
  name: string
  description: string
  invested: number // in its own currency (sum of aportes)
  currentValue: number // in its own currency current valuation
  currency: Currency
  contributions: InvestmentContribution[]
  checkingAccountId?: number | null
  createdAt: string
}

export interface Budget {
  id: number
  name: string
  startDate: string // ISO string date
  endDate: string // ISO string date
  amountLimit: number
  categoryId: number | null
}

export type BudgetStatus = "normal" | "warning" | "danger"

export interface BudgetConsumption {
  budgetId: number
  amountLimit: number
  spent: number
  percentage: number
  status: BudgetStatus
}
