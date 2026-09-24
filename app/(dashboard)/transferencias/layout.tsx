"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Upload } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { ImportDialog } from "@/components/transferencias/import-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function TransferenciasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [importOpen, setImportOpen] = useState(false)

  const tabs = [
    { href: "/transferencias/ingresos", label: "Ingresos" },
    { href: "/transferencias/gastos", label: "Gastos" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transferencias"
        description="Registrá y filtrá tus ingresos y gastos de forma rápida."
        actions={
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" data-icon="inline-start" />
            Importar
          </Button>
        }
      />

      <nav className="inline-flex rounded-lg border bg-muted/40 p-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
