import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CategoryBadgeProps {
  name: string
  color: string // css var token like "--chart-1"
  className?: string
}

export function CategoryBadge({ name, color, className }: CategoryBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-normal", className)}>
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ backgroundColor: `var(${color})` }}
      />
      {name}
    </Badge>
  )
}
