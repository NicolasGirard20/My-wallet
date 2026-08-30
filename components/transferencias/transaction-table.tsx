"use client"

import { useMemo, useState } from "react"
import { PencilIcon, Trash2Icon, SearchIcon, ArrowUpDownIcon, CheckIcon } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CategoryBadge } from "@/components/shared/category-badge"
import { AmountDisplay } from "@/components/shared/amount-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useData } from "@/context/data-context"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Category, Transaction, TransactionKind } from "@/lib/types"

type SortKey = "date" | "amount"

export function TransactionTable({
  kind,
  onEdit,
}: {
  kind: TransactionKind
  onEdit: (tx: Transaction) => void
}) {
  const { transactions, categories, savings, deleteTransaction } = useData()
  const [query, setQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)

  const catMap = useMemo(() => {
    const m = new Map<number, Category>()
    categories.forEach((c) => m.set(c.id, c))
    return m
  }, [categories])

  const kindCategories = categories.filter((c) => c.kind === kind)

  function toggleCategory(id: number) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearCategories() {
    setSelectedCategories(new Set())
  }

  const categoryLabel = useMemo(() => {
    if (selectedCategories.size === 0) return "Todas las categorías"
    if (selectedCategories.size === 1) {
      const id = [...selectedCategories][0]
      return catMap.get(id)?.name ?? "1 categoría"
    }
    return `${selectedCategories.size} categorías`
  }, [selectedCategories, catMap])

  const rows = useMemo(() => {
    let list = transactions.filter((t) => t.kind === kind)

    if (selectedCategories.size > 0) {
      list = list.filter((t) => selectedCategories.has(t.categoryId))
    }

    if (dateFrom) {
      list = list.filter((t) => t.date.slice(0, 10) >= dateFrom)
    }
    if (dateTo) {
      list = list.filter((t) => t.date.slice(0, 10) <= dateTo)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((t) => {
        const categoryName = catMap.get(t.categoryId)?.name.toLowerCase() ?? ""
        const formattedDate = formatDate(t.date).toLowerCase()

        return (
          t.description.toLowerCase().includes(q) ||
          categoryName.includes(q) ||
          t.date.includes(q) ||
          formattedDate.includes(q)
        )
      })
    }

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "date") cmp = a.date.localeCompare(b.date)
      else cmp = a.amount - b.amount
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [transactions, kind, selectedCategories, dateFrom, dateTo, query, catMap, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const deleteDescription = useMemo(() => {
    if (!pendingDelete) return ""
    if (pendingDelete.savingGoalId) {
      const goal = savings.find((s) => s.id === pendingDelete.savingGoalId)
      const goalName = goal?.name ?? "una meta de ahorro"
      const amount = formatCurrency(pendingDelete.amount, pendingDelete.currency)
      if (pendingDelete.kind === "expense") {
        return `Esta transferencia está vinculada a la meta "${goalName}". Al eliminarla, el ahorro se reducirá en ${amount}. ¿Continuar?`
      }
      return `Esta transferencia está vinculada a la meta "${goalName}". Al eliminarla, el ahorro se aumentará en ${amount}. ¿Continuar?`
    }
    return `¿Seguro que querés eliminar "${pendingDelete.description}"? Esta acción no se puede deshacer.`
  }, [pendingDelete, savings])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por descripción, categoría o fecha"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">


          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Desde</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
                aria-label="Desde"
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Hasta</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
                aria-label="Hasta"
              />
            </label>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="w-full sm:w-48 justify-start" />}>
                {categoryLabel}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Categorías</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={selectedCategories.size === 0}
                    closeOnClick={false}
                    onCheckedChange={() => clearCategories()}
                  >
                    Todas las categorías
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {kindCategories.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.id}
                      checked={selectedCategories.has(c.id)}
                      closeOnClick={false}
                      onCheckedChange={() => toggleCategory(c.id)}
                    >
                      {c.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>Sin movimientos</EmptyTitle>
            <EmptyDescription>
              No se encontraron {kind === "income" ? "ingresos" : "gastos"} con los filtros actuales.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("date")}
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                  >
                    Fecha
                    <ArrowUpDownIcon className="size-3" />
                  </button>
                </TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("amount")}
                    className="ml-auto inline-flex items-center gap-1 font-medium hover:text-foreground"
                  >
                    Monto
                    <ArrowUpDownIcon className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="w-20 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx) => {
                const cat = catMap.get(tx.categoryId)
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>
                      {cat ? (
                        <CategoryBadge name={cat.name} color={cat.color} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountDisplay
                        value={tx.amount}
                        kind={kind}
                        showSign
                        className="justify-end"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(tx)}
                          aria-label="Editar movimiento"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete(tx)}
                          aria-label="Eliminar movimiento"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Eliminar movimiento"
        description={deleteDescription}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) deleteTransaction(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}