import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AmountDisplay } from "@/components/shared/amount-display"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number
  kind?: "income" | "expense" | "neutral"
  icon: LucideIcon
  hint?: string
  accent?: boolean
}

export function StatCard({ title, value, kind = "neutral", icon: Icon, hint, accent }: StatCardProps) {
  return (
    <Card className={cn(accent && "border-primary/30 bg-primary/5")}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            kind === "income" && "bg-primary/10 text-primary",
            kind === "expense" && "bg-destructive/10 text-destructive",
            kind === "neutral" && "bg-muted text-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <AmountDisplay value={value} kind={kind} className="text-2xl font-semibold" />
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
