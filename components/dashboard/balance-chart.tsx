"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useCurrency } from "@/context/currency-context"
import type { MonthlyPoint } from "@/lib/selectors"

const chartConfig = {
  income: { label: "Ingresos", color: "var(--chart-1)" },
  expense: { label: "Gastos", color: "var(--chart-3)" },
} satisfies ChartConfig

export function BalanceChart({ data }: { data: MonthlyPoint[] }) {
  const { format } = useCurrency()

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {format(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="income"
          type="monotone"
          fill="url(#fillIncome)"
          stroke="var(--color-income)"
          strokeWidth={2}
        />
        <Area
          dataKey="expense"
          type="monotone"
          fill="url(#fillExpense)"
          stroke="var(--color-expense)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
