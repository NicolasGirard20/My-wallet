"use client"

import Link from "next/link"
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { useCurrency } from "@/context/currency-context"
import { useData } from "@/context/data-context"
import {
  categoryBreakdownCrossCurrency,
  monthlySeriesCrossCurrency,
  totalsCrossCurrency,
} from "@/lib/selectors"
import { formatDate } from "@/lib/format"
import { navItems } from "@/lib/nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { BalanceChart } from "@/components/dashboard/balance-chart"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { AmountDisplay } from "@/components/shared/amount-display"
import { CategoryBadge } from "@/components/shared/category-badge"

export default function InicioPage() {
  const { allTransactions, categories, allSavings, allInvestments, getCategory } = useData()
  const { currency, convert, rate, dollarType } = useCurrency()

  const { income, expense, balance } = totalsCrossCurrency(allTransactions, convert)
  const monthly = monthlySeriesCrossCurrency(allTransactions, convert, 6)
  const expenseSlices = categoryBreakdownCrossCurrency(
    allTransactions, categories, "expense", convert,
  )

  const totalSaved = allSavings.reduce((acc, s) => convert(s.saved, s.currency) + acc, 0)
  const invValue = allInvestments.reduce((acc, i) => convert(i.currentValue, i.currency) + acc, 0)

  const recent = [...allTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  const currencyLabel = currency === "USD" ? "dólares" : "pesos"
  const rateHint = rate
    ? `Dólar ${rate.nombre}: C $${rate.compra.toLocaleString("es-AR", { maximumFractionDigits: 0 })} / V $${rate.venta.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
    : `Tipo de dólar: ${dollarType}`

  return (
    <>
      <PageHeader
        title="Inicio"
        description={`Resumen general de tus finanzas en ${currencyLabel} (USD + ARS convertidos).`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Balance total"
          value={balance}
          icon={Wallet}
          accent
          hint="USD + ARS convertidos a la moneda activa"
        />
        <StatCard
          title="Ingresos"
          value={income}
          kind="income"
          icon={ArrowUpRight}
          hint="USD + ARS convertidos"
        />
        <StatCard
          title="Gastos"
          value={expense}
          kind="expense"
          icon={ArrowDownLeft}
          hint="USD + ARS convertidos"
        />
        <StatCard
          title="Ahorros + Inversiones"
          value={totalSaved + invValue}
          icon={PiggyBank}
          hint="USD + ARS convertidos"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos vs Gastos</CardTitle>
            <CardDescription>
              Evolución de los últimos 6 meses · USD + ARS convertidos a {currencyLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceChart data={monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría</CardTitle>
            <CardDescription>Distribución histórica · USD + ARS convertidos</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <CategoryChart data={expenseSlices} />
            <div className="flex flex-col gap-2">
              {expenseSlices.slice(0, 4).map((slice) => (
                <div key={slice.categoryId} className="flex items-center justify-between text-sm">
                  <CategoryBadge name={slice.name} color={slice.color} />
                  <AmountDisplay value={slice.value} className="text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent + quick links */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movimientos recientes</CardTitle>
            <CardDescription>
              Últimas transacciones de todas las monedas · USD + ARS convertidos a {currencyLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {recent.map((tx, i) => {
              const cat = getCategory(tx.categoryId)
              return (
                <div key={tx.id}>
                  {i > 0 ? <Separator /> : null}
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          tx.kind === "income"
                            ? "flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"
                            : "flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                        }
                      >
                        {tx.kind === "income" ? (
                          <ArrowUpRight className="size-4" />
                        ) : (
                          <ArrowDownLeft className="size-4" />
                        )}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{tx.description}</span>
                        <span className="text-xs text-muted-foreground">
                          {cat?.name} · {formatDate(tx.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AmountDisplay
                        value={tx.kind === "income" ? tx.amount : -tx.amount}
                        kind={tx.kind}
                        showSign
                        from={tx.currency}
                        className="text-sm font-semibold"
                      />
                      <span className="text-[10px] text-muted-foreground">{tx.currency}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
            <CardDescription>Ir a otras secciones</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {navItems
              .filter((item) => item.href !== "/inicio")
              .map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            <div className="col-span-2 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <TrendingUp className="size-4 shrink-0" />
              Los totales del panel incluyen USD + ARS convertidos con la cotización activa.
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}