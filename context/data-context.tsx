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
import {
  getCheckingAccountsAction,
  createCheckingAccountAction,
  updateCheckingAccountAction,
  deleteCheckingAccountAction,
  createAccountTransferAction,
} from "@/app/actions/checking-accounts"
import type {
  Category,
  CheckingAccount,
  AccountTransfer,
  Investment,
  InvestmentContribution,
  SavingGoal,
  Transaction,
  TransactionKind,
  Currency,
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
  checkingAccounts: CheckingAccount[]
  selectedAccountId: number | "all"
  setSelectedAccountId: (id: number | "all") => void
  activeAccount: CheckingAccount | null

  addTransaction: (tx: Omit<Transaction, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }) => Promise<void>
  importTransactions: (txs: Array<Omit<Transaction, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }>) => Promise<void>
  updateTransaction: (id: number, tx: Partial<Omit<Transaction, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>

  addCheckingAccount: (data: {
    name: string
    bankName?: string
    accountNumber?: string
    cbuOrAlias?: string
    currency: Currency
    initialBalance?: number
    overdraftLimit?: number
    color?: string
    isDefault?: boolean
  }) => Promise<CheckingAccount>
  updateCheckingAccount: (
    id: number,
    data: Partial<{
      name: string
      bankName?: string
      accountNumber?: string
      cbuOrAlias?: string
      currency?: Currency
      initialBalance?: number
      overdraftLimit?: number
      color?: string
      isDefault?: boolean
      isActive?: boolean
    }>,
  ) => Promise<CheckingAccount>
  deleteCheckingAccount: (id: number) => Promise<void>
  createTransfer: (data: {
    sourceAccountId: number
    targetAccountId: number
    sourceAmount: number
    targetAmount: number
    exchangeRate?: number
    date?: string
    description?: string
  }) => Promise<AccountTransfer>
  refreshCheckingAccounts: () => Promise<void>

  addCategory: (name: string, kind: TransactionKind, color: string) => Promise<Category>
  updateCategory: (id: number, name: string, color: string) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  categoriesByKind: (kind: TransactionKind) => Category[]
  getCategory: (id: number) => Category | undefined

  addSaving: (goal: Omit<SavingGoal, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }) => Promise<void>
  updateSaving: (
    id: number,
    goal: Partial<Omit<SavingGoal, "id" | "currency" | "deadline">> & { currency?: Currency; deadline?: string | null; checkingAccountId?: number | null },
    explicitCheckingAccountId?: number | null,
  ) => Promise<void>
  deleteSaving: (id: number) => Promise<void>

  addInvestment: (inv: Omit<Investment, "id" | "invested" | "contributions" | "createdAt" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }) => Promise<void>
  updateInvestment: (id: number, inv: Partial<Pick<Investment, "name" | "description" | "currentValue" | "checkingAccountId">>) => Promise<void>
  deleteInvestment: (id: number) => Promise<void>
  addContribution: (investmentId: number, c: Omit<InvestmentContribution, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }) => Promise<void>
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
  const [checkingAccounts, setCheckingAccounts] = useState<CheckingAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | "all">("all")
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)
  const previousUsername = useRef<string | null>(null)

  // Transactions are filtered by checking account (if one is selected), NOT by currency.
  // Currency toggle now serves as a global display / conversion lens.
  const visibleTransactions = useMemo(() => {
    if (selectedAccountId === "all") return transactions
    return transactions.filter((t) => t.checkingAccountId === selectedAccountId)
  }, [transactions, selectedAccountId])

  const activeAccount = useMemo(() => {
    if (selectedAccountId === "all") return null
    return checkingAccounts.find((a) => a.id === selectedAccountId) ?? null
  }, [checkingAccounts, selectedAccountId])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, txs, sav, invs, accs] = await Promise.all([
        getCategoriesAction(),
        getTransactionsAction(),
        getSavingGoalsAction(),
        getInvestmentsAction(),
        getCheckingAccountsAction(),
      ])
      setCategories(cats)
      setTransactions(txs)
      setSavings(sav)
      setInvestments(invs)
      setCheckingAccounts(accs)
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

  const refreshCheckingAccounts = useCallback(async () => {
    const accs = await getCheckingAccountsAction()
    setCheckingAccounts(accs)
  }, [])

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }) => {
      const targetAccountId =
        tx.checkingAccountId !== undefined
          ? tx.checkingAccountId
          : selectedAccountId !== "all"
            ? selectedAccountId
            : checkingAccounts.find((a) => a.isDefault)?.id ?? null

      const acc = checkingAccounts.find((a) => a.id === targetAccountId)
      const txCurrency = tx.currency ?? acc?.currency ?? currency

      await createTransactionAction({
        ...tx,
        currency: txCurrency,
        checkingAccountId: targetAccountId,
      })

      const [txs, accs] = await Promise.all([
        getTransactionsAction(),
        getCheckingAccountsAction(),
      ])
      setTransactions(txs)
      setCheckingAccounts(accs)
    },
    [checkingAccounts, currency, selectedAccountId],
  )

  const importTransactions = useCallback(
    async (txs: Array<Omit<Transaction, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }>) => {
      await importTransactionsAction(
        txs.map((tx) => ({
          ...tx,
          currency: tx.currency ?? currency,
          checkingAccountId:
            tx.checkingAccountId !== undefined
              ? tx.checkingAccountId
              : selectedAccountId !== "all"
                ? selectedAccountId
                : null,
        })),
      )
      const [freshTxs, freshAccs] = await Promise.all([
        getTransactionsAction(),
        getCheckingAccountsAction(),
      ])
      setTransactions(freshTxs)
      setCheckingAccounts(freshAccs)
    },
    [currency, selectedAccountId],
  )

  const updateTransaction = useCallback(
    async (
      id: number,
      tx: Partial<Omit<Transaction, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }>,
    ) => {
      const payload: Record<string, unknown> = {}
      if (tx.kind !== undefined) payload.kind = tx.kind
      if (tx.amount !== undefined) payload.amount = tx.amount
      if (tx.description !== undefined) payload.description = tx.description
      if (tx.categoryId !== undefined) payload.categoryId = tx.categoryId
      if (tx.currency !== undefined) payload.currency = tx.currency
      if (tx.date !== undefined) payload.date = tx.date
      if (tx.checkingAccountId !== undefined) payload.checkingAccountId = tx.checkingAccountId

      await updateTransactionAction(id, payload)
      const [txs, freshAccs, sav, invs] = await Promise.all([
        getTransactionsAction(),
        getCheckingAccountsAction(),
        getSavingGoalsAction(),
        getInvestmentsAction(),
      ])
      setTransactions(txs)
      setCheckingAccounts(freshAccs)
      setSavings(sav)
      setInvestments(invs)
    },
    [],
  )

  const deleteTransaction = useCallback(async (id: number) => {
    await deleteTransactionAction(id)
    const [txs, freshAccs, sav, invs] = await Promise.all([
      getTransactionsAction(),
      getCheckingAccountsAction(),
      getSavingGoalsAction(),
      getInvestmentsAction(),
    ])
    setTransactions(txs)
    setCheckingAccounts(freshAccs)
    setSavings(sav)
    setInvestments(invs)
  }, [])

  const addCheckingAccount = useCallback(
    async (data: Parameters<typeof createCheckingAccountAction>[0]) => {
      const created = await createCheckingAccountAction(data)
      await refreshCheckingAccounts()
      return created
    },
    [refreshCheckingAccounts],
  )

  const updateCheckingAccount = useCallback(
    async (id: number, data: Parameters<typeof updateCheckingAccountAction>[1]) => {
      const updated = await updateCheckingAccountAction(id, data)
      await refreshCheckingAccounts()
      return updated
    },
    [refreshCheckingAccounts],
  )

  const deleteCheckingAccount = useCallback(
    async (id: number) => {
      await deleteCheckingAccountAction(id)
      if (selectedAccountId === id) {
        setSelectedAccountId("all")
      }
      await refreshCheckingAccounts()
    },
    [refreshCheckingAccounts, selectedAccountId],
  )

  const createTransfer = useCallback(
    async (data: Parameters<typeof createAccountTransferAction>[0]) => {
      const transfer = await createAccountTransferAction(data)
      await refreshCheckingAccounts()
      return transfer
    },
    [refreshCheckingAccounts],
  )

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

  const addSaving = useCallback(
    async (goal: Omit<SavingGoal, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }) => {
      await createSavingGoalAction({
        name: goal.name,
        target: goal.target,
        saved: goal.saved,
        color: goal.color,
        currency: goal.currency ?? currency,
        deadline: goal.deadline ?? undefined,
        checkingAccountId: goal.checkingAccountId ?? null,
      })
      const [sav, txs, accs] = await Promise.all([
        getSavingGoalsAction(),
        getTransactionsAction(),
        getCheckingAccountsAction(),
      ])
      setSavings(sav)
      setTransactions(txs)
      setCheckingAccounts(accs)
    },
    [currency],
  )

  const updateSaving = useCallback(
    async (
      id: number,
      goal: Partial<Omit<SavingGoal, "id" | "currency" | "deadline">> & { currency?: Currency; deadline?: string | null; checkingAccountId?: number | null },
      explicitCheckingAccountId?: number | null,
    ) => {
      const payload: Record<string, unknown> = {}
      if (goal.name !== undefined) payload.name = goal.name
      if (goal.target !== undefined) payload.target = goal.target
      if (goal.saved !== undefined) payload.saved = goal.saved
      if (goal.color !== undefined) payload.color = goal.color
      if (goal.currency !== undefined) payload.currency = goal.currency
      if (goal.checkingAccountId !== undefined) payload.checkingAccountId = goal.checkingAccountId
      if (goal.deadline !== undefined) payload.deadline = goal.deadline ?? null
      await updateSavingGoalAction(id, payload, explicitCheckingAccountId)
      const [sav, txs, accs] = await Promise.all([
        getSavingGoalsAction(),
        getTransactionsAction(),
        getCheckingAccountsAction(),
      ])
      setSavings(sav)
      setTransactions(txs)
      setCheckingAccounts(accs)
    },
    [],
  )

  const deleteSaving = useCallback(async (id: number) => {
    await deleteSavingGoalAction(id)
    const [sav, txs, accs] = await Promise.all([
      getSavingGoalsAction(),
      getTransactionsAction(),
      getCheckingAccountsAction(),
    ])
    setSavings(sav)
    setTransactions(txs)
    setCheckingAccounts(accs)
  }, [])

  const addInvestment = useCallback(
    async (inv: Omit<Investment, "id" | "invested" | "contributions" | "createdAt" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }) => {
      await createInvestmentAction({
        name: inv.name,
        description: inv.description,
        currentValue: inv.currentValue,
        currency: inv.currency ?? currency,
        checkingAccountId: inv.checkingAccountId ?? null,
      })
      const [invs, txs, accs] = await Promise.all([
        getInvestmentsAction(),
        getTransactionsAction(),
        getCheckingAccountsAction(),
      ])
      setInvestments(invs)
      setTransactions(txs)
      setCheckingAccounts(accs)
    },
    [currency],
  )

  const updateInvestment = useCallback(
    async (id: number, inv: Partial<Pick<Investment, "name" | "description" | "currentValue" | "checkingAccountId">>) => {
      await updateInvestmentAction(id, inv)
      const [invs, txs, accs] = await Promise.all([
        getInvestmentsAction(),
        getTransactionsAction(),
        getCheckingAccountsAction(),
      ])
      setInvestments(invs)
      setTransactions(txs)
      setCheckingAccounts(accs)
    },
    [],
  )

  const deleteInvestment = useCallback(async (id: number) => {
    await deleteInvestmentAction(id)
    const [invs, txs, accs] = await Promise.all([
      getInvestmentsAction(),
      getTransactionsAction(),
      getCheckingAccountsAction(),
    ])
    setInvestments(invs)
    setTransactions(txs)
    setCheckingAccounts(accs)
  }, [])

  const addContribution = useCallback(
    async (investmentId: number, c: Omit<InvestmentContribution, "id" | "currency"> & { currency?: Currency; checkingAccountId?: number | null }) => {
      await addContributionAction(investmentId, {
        date: c.date,
        amount: c.amount,
        currency: c.currency ?? currency,
        note: c.note,
        checkingAccountId: c.checkingAccountId ?? undefined,
      })
      const [invs, txs, accs] = await Promise.all([
        getInvestmentsAction(),
        getTransactionsAction(),
        getCheckingAccountsAction(),
      ])
      setInvestments(invs)
      setTransactions(txs)
      setCheckingAccounts(accs)
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
    (id: number) => investments.find((i) => i.id === id),
    [investments],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      transactions: visibleTransactions,
      allTransactions: transactions,
      categories,
      savings,
      allSavings: savings,
      investments,
      allInvestments: investments,
      checkingAccounts,
      selectedAccountId,
      setSelectedAccountId,
      activeAccount,
      addTransaction,
      importTransactions,
      updateTransaction,
      deleteTransaction,
      addCheckingAccount,
      updateCheckingAccount,
      deleteCheckingAccount,
      createTransfer,
      refreshCheckingAccounts,
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
      savings,
      investments,
      checkingAccounts,
      selectedAccountId,
      activeAccount,
      addTransaction,
      importTransactions,
      updateTransaction,
      deleteTransaction,
      addCheckingAccount,
      updateCheckingAccount,
      deleteCheckingAccount,
      createTransfer,
      refreshCheckingAccounts,
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