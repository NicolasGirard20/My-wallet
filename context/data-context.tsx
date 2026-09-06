"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useCurrency } from "@/context/currency-context"
import { getCategoriesAction, createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/app/actions/categories"
import {
  getTransactionsAction,
  createTransactionAction,
  importTransactionsAction,
  updateTransactionAction,
  deleteTransactionAction,
} from "@/app/actions/transactions"
import {
  getSavingGoalsAction,
  createSavingGoalAction,
  updateSavingGoalAction,
  deleteSavingGoalAction,
} from "@/app/actions/savings"
import {
  getInvestmentsAction,
  createInvestmentAction,
  updateInvestmentAction,
  deleteInvestmentAction,
  addContributionAction,
  deleteContributionAction,
  updateContributionAction,
} from "@/app/actions/investments"
import type {
  Category,
  Investment,
  InvestmentContribution,
  SavingGoal,
  Transaction,
  TransactionKind,
} from "@/lib/types"
import { logger } from "@/app/imports/dev"

interface DataContextValue {
  loading: boolean
  transactions: Transaction[]
  allTransactions: Transaction[]
  categories: Category[]
  savings: SavingGoal[]
  allSavings: SavingGoal[]
  investments: Investment[]
  allInvestments: Investment[]

  addTransaction: (tx: Omit<Transaction, "id" | "currency">) => Promise<void>
  importTransactions: (txs: Omit<Transaction, "id" | "currency">[]) => Promise<void>
  updateTransaction: (id: number, tx: Partial<Omit<Transaction, "id" | "currency">>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>

  addCategory: (name: string, kind: TransactionKind, color: string) => Promise<Category>
  updateCategory: (id: number, name: string, color: string) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  categoriesByKind: (kind: TransactionKind) => Category[]
  getCategory: (id: number) => Category | undefined

  addSaving: (goal: Omit<SavingGoal, "id" | "currency">) => Promise<void>
  updateSaving: (id: number, goal: Partial<Omit<SavingGoal, "id" | "currency" | "deadline">> & { deadline?: string | null }) => Promise<void>
  deleteSaving: (id: number) => Promise<void>

  addInvestment: (inv: Omit<Investment, "id" | "invested" | "contributions" | "createdAt" | "currency">) => Promise<void>
  updateInvestment: (id: number, inv: Partial<Pick<Investment, "name" | "description" | "currentValue">>) => Promise<void>
  deleteInvestment: (id: number) => Promise<void>
  addContribution: (investmentId: number, c: Omit<InvestmentContribution, "id" | "currency">) => Promise<void>
  deleteContribution: (contributionId: number) => Promise<void>
  updateContribution: (contributionId: number, data: { amount: number; date: string; note?: string }) => Promise<void>
  getInvestment: (id: number) => Investment | undefined
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated: authHydrated, username } = useAuth()
  const { currency } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [savings, setSavings] = useState<SavingGoal[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)
  const previousUsername = useRef<string | null>(null)

  // Views filtered by the active currency. Categories stay global.
  const visibleTransactions = useMemo(
    () => transactions.filter((t) => t.currency === currency),
    [transactions, currency],
  )
  const visibleSavings = useMemo(
    () => savings.filter((s) => s.currency === currency),
    [savings, currency],
  )
  const visibleInvestments = useMemo(
    () => investments.filter((i) => i.currency === currency),
    [investments, currency],
  )

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, txs, sav, invs] = await Promise.all([
        getCategoriesAction(),
        getTransactionsAction(),
        getSavingGoalsAction(),
        getInvestmentsAction(),
      ])
      setCategories(cats)
      setTransactions(txs)
      setSavings(sav)
      setInvestments(invs)
    } catch (error) {
      logger.error("loadAllData failed:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authHydrated) return

    if (!isAuthenticated) {
      setTransactions([])
      setCategories([])
      setSavings([])
      setInvestments([])
      loadedRef.current = false
      return
    }

    if (username && username !== previousUsername.current) {
      previousUsername.current = username
      loadedRef.current = false
    }

    if (!loadedRef.current) {
      loadedRef.current = true
      loadAllData()
    }
  }, [authHydrated, isAuthenticated, loadAllData, username])

  const addTransaction = useCallback(async (tx: Omit<Transaction, "id" | "currency">) => {
    await createTransactionAction({ ...tx, currency })
    const txs = await getTransactionsAction()
    setTransactions(txs)
  }, [currency])

  const importTransactions = useCallback(async (txs: Omit<Transaction, "id" | "currency">[]) => {
    await importTransactionsAction(txs.map((tx) => ({ ...tx, currency })))
    const fresh = await getTransactionsAction()
    setTransactions(fresh)
  }, [currency])

  const updateTransaction = useCallback(async (id: number, tx: Partial<Omit<Transaction, "id" | "currency">>) => {
    const payload: Record<string, unknown> = {}
    if (tx.kind !== undefined) payload.kind = tx.kind
    if (tx.amount !== undefined) payload.amount = tx.amount
    if (tx.description !== undefined) payload.description = tx.description
    if (tx.categoryId !== undefined) payload.categoryId = tx.categoryId
    if (tx.date !== undefined) payload.date = tx.date
    await updateTransactionAction(id, payload)
    const [txs, sav, invs] = await Promise.all([getTransactionsAction(), getSavingGoalsAction(), getInvestmentsAction()])
    setTransactions(txs)
    setSavings(sav)
    setInvestments(invs)
  }, [])

  const deleteTransaction = useCallback(async (id: number) => {
    await deleteTransactionAction(id)
    const [txs, sav, invs] = await Promise.all([getTransactionsAction(), getSavingGoalsAction(), getInvestmentsAction()])
    setTransactions(txs)
    setSavings(sav)
    setInvestments(invs)
  }, [])

  const addCategory = useCallback(async (name: string, kind: TransactionKind, color: string) => {
    const created = await createCategoryAction({ name, kind, color })
    const cats = await getCategoriesAction()
    setCategories(cats)
    return created
  }, [])

  const updateCategory = useCallback(async (id: number, name: string, color: string) => {
    await updateCategoryAction(id, { name, color })
    const cats = await getCategoriesAction()
    setCategories(cats)
  }, [])

  const deleteCategory = useCallback(async (id: number) => {
    await deleteCategoryAction(id)
    const cats = await getCategoriesAction()
    setCategories(cats)
    const txs = await getTransactionsAction()
    setTransactions(txs)
  }, [])

  const categoriesByKind = useCallback(
    (kind: TransactionKind) => categories.filter((c) => c.kind === kind),
    [categories],
  )

  const getCategory = useCallback((id: number) => categories.find((c) => c.id === id), [categories])

  const addSaving = useCallback(async (goal: Omit<SavingGoal, "id" | "currency">) => {
    await createSavingGoalAction({
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      color: goal.color,
      currency,
      deadline: goal.deadline,
    })
    const [sav, txs] = await Promise.all([getSavingGoalsAction(), getTransactionsAction()])
    setSavings(sav)
    setTransactions(txs)
  }, [currency])

  const updateSaving = useCallback(async (id: number, goal: Partial<Omit<SavingGoal, "id" | "currency" | "deadline">> & { deadline?: string | null }) => {
    const payload: Record<string, unknown> = {}
    if (goal.name !== undefined) payload.name = goal.name
    if (goal.target !== undefined) payload.target = goal.target
    if (goal.saved !== undefined) payload.saved = goal.saved
    if (goal.color !== undefined) payload.color = goal.color
    if (goal.deadline !== undefined) payload.deadline = goal.deadline ?? null
    await updateSavingGoalAction(id, payload)
    const [sav, txs] = await Promise.all([getSavingGoalsAction(), getTransactionsAction()])
    setSavings(sav)
    setTransactions(txs)
  }, [])

  const deleteSaving = useCallback(async (id: number) => {
    await deleteSavingGoalAction(id)
    const [sav, txs] = await Promise.all([getSavingGoalsAction(), getTransactionsAction()])
    setSavings(sav)
    setTransactions(txs)
  }, [])

  const addInvestment = useCallback(
    async (inv: Omit<Investment, "id" | "invested" | "contributions" | "createdAt" | "currency">) => {
      await createInvestmentAction({
        name: inv.name,
        description: inv.description,
        currentValue: inv.currentValue,
        currency,
      })
      const invs = await getInvestmentsAction()
      setInvestments(invs)
    },
    [currency],
  )

  const updateInvestment = useCallback(
    async (id: number, inv: Partial<Pick<Investment, "name" | "description" | "currentValue">>) => {
      await updateInvestmentAction(id, inv)
      const invs = await getInvestmentsAction()
      setInvestments(invs)
    },
    [],
  )

  const deleteInvestment = useCallback(async (id: number) => {
    await deleteInvestmentAction(id)
    const [invs, txs] = await Promise.all([getInvestmentsAction(), getTransactionsAction()])
    setInvestments(invs)
    setTransactions(txs)
  }, [])

  const addContribution = useCallback(
    async (investmentId: number, c: Omit<InvestmentContribution, "id" | "currency">) => {
      await addContributionAction(investmentId, {
        date: c.date,
        amount: c.amount,
        currency,
        note: c.note,
      })
      const [invs, txs] = await Promise.all([getInvestmentsAction(), getTransactionsAction()])
      setInvestments(invs)
      setTransactions(txs)
    },
    [currency],
  )

  const deleteContribution = useCallback(async (contributionId: number) => {
    await deleteContributionAction(contributionId)
    const [invs, txs] = await Promise.all([getInvestmentsAction(), getTransactionsAction()])
    setInvestments(invs)
    setTransactions(txs)
  }, [])

  const updateContribution = useCallback(
    async (contributionId: number, data: { amount: number; date: string; note?: string }) => {
      await updateContributionAction(contributionId, data)
      const [invs, txs] = await Promise.all([getInvestmentsAction(), getTransactionsAction()])
      setInvestments(invs)
      setTransactions(txs)
    },
    [],
  )

  const getInvestment = useCallback(
    (id: number) => visibleInvestments.find((i) => i.id === id),
    [visibleInvestments],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      transactions: visibleTransactions,
      allTransactions: transactions,
      categories,
      savings: visibleSavings,
      allSavings: savings,
      investments: visibleInvestments,
      allInvestments: investments,
      addTransaction,
      importTransactions,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      categoriesByKind,
      getCategory,
      addSaving,
      updateSaving,
      deleteSaving,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      addContribution,
      deleteContribution,
      updateContribution,
      getInvestment,
    }),
    [
      loading,
      visibleTransactions,
      transactions,
      categories,
      visibleSavings,
      savings,
      visibleInvestments,
      investments,
      addTransaction,
      importTransactions,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      categoriesByKind,
      getCategory,
      addSaving,
      updateSaving,
      deleteSaving,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      addContribution,
      deleteContribution,
      updateContribution,
      getInvestment,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}