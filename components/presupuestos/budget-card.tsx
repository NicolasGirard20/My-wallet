"use client"

import { AlertTriangle, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import { AmountDisplay } from "@/components/shared/amount-display"
import { useCurrency } from "@/context/currency-context"
import { useData } from "@/context/data-context"
import { calculateBudgetConsumption } from "@/lib/selectors"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Budget } from "@/lib/types"

interface BudgetCardProps {
  budget: Budget
  onEdit: (budget: Budget) => void
  onDelete: (id: number) => void
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const { allTransactions, categories } = useData()
  const { convert } = useCurrency()

  const consumption = calculateBudgetConsumption(budget, allTransactions, convert)
  const category = budget.categoryId
    ? categories.find((c) => c.id === budget.categoryId)
    : null

  const formattedStart = formatDate(budget.startDate, "short")
  const formattedEnd = formatDate(budget.endDate, "short")
  const isOverbudget = consumption.percentage >= 100

  return (
    <Card className="flex flex-col justify-between overflow-hidden shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold">{budget.name}</CardTitle>
            {category ? (
              <Badge variant="outline" className="text-xs">
                {category.name}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Global
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formattedStart} — {formattedEnd}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(budget)}
            title="Editar presupuesto"
            aria-label={`Editar ${budget.name}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(budget.id)}
            title="Eliminar presupuesto"
            aria-label={`Eliminar ${budget.name}`}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Consumo</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                consumption.status === "danger"
                  ? "text-destructive"
                  : consumption.status === "warning"
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-foreground"
              )}
            >
              {Math.round(consumption.percentage)}%
            </span>
          </div>

          <Progress value={Math.min(consumption.percentage, 100)} className="w-full">
            <ProgressTrack className="h-2.5 w-full rounded-full bg-muted">
              <ProgressIndicator
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  consumption.status === "danger"
                    ? "bg-destructive"
                    : consumption.status === "warning"
                      ? "bg-amber-500"
                      : "bg-primary"
                )}
              />
            </ProgressTrack>
          </Progress>
        </div>

        {/* Montos */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Gastado</span>
            <AmountDisplay
              value={consumption.spent}
              className={cn(
                "font-semibold",
                consumption.status === "danger" && "text-destructive"
              )}
            />
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Límite</span>
            <AmountDisplay value={budget.amountLimit} className="font-semibold" />
          </div>
        </div>

        {/* Advertencia si sobregira */}
        {isOverbudget && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive font-medium"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            <span>Presupuesto superado por exceso de gastos</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
