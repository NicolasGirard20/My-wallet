"use client"

import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCurrency } from "@/context/currency-context"
import type { CategorySlice } from "@/lib/selectors"

export function CategoryChart({ data }: { data: CategorySlice[] }) {
  const { format } = useCurrency()

  return (
    <ChartContainer config={{}} className="mx-auto aspect-square h-52">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: item?.payload?.fill }}
                    />
                    {item?.payload?.name}
                  </span>
                  <span className="font-mono font-medium tabular-nums">{format(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} strokeWidth={2}>
          {data.map((slice) => (
            <Cell key={slice.categoryId} fill={`var(${slice.color})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
