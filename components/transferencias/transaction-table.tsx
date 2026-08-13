"use client"

import { useMemo, useState } from "react"
import { PencilIcon, Trash2Icon, SearchIcon, ArrowUpDownIcon } from "lucide-react"

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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CategoryBadge } from "@/components/shared/category-badge"
import { AmountDisplay } from "@/components/shared/amount-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useData } from "@/context/data-context"
import { formatDate } from "@/lib/format"
import type { Category, Transaction, TransactionKind } from "@/lib/types"

type SortKey = "date" | "amount"

export function TransactionTable({
  kind,
  onEdit,
}: {
  kind: TransactionKind
  onEdit: (tx: Transaction) => void
}) {
  const { transactions, categories, deleteTransaction } = useData()
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)

  const catMap = useMemo(() => {
    const m = new Map<number, Category>()
    categories.forEach((c) => m.set(c.id, c))
    return m
  }, [categories])

  const kindCategories = categories.filter((c) => c.kind === kind)

  const rows = useMemo(() => {
    let list = transactions.filter((t) => t.kind === kind)
    if (categoryFilter !== "all") {
      list = list.filter((t) => t.categoryId === Number(categoryFilter))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (catMap.get(t.categoryId)?.name.toLowerCase().includes(q) ?? false),
      )
    }
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "date") cmp = a.date.localeCompare(b.date)
      else cmp = a.amount - b.amount
      return sortDir === "asc" ? cmp : -cmp
    })
    return list
  }, [transactions, kind, categoryFilter, query, catMap, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por descripción o categoría"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {kindCategories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
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
        description={`¿Seguro que querés eliminar "${pendingDelete?.description}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) deleteTransaction(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
