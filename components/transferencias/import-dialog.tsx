"use client"

import { useCallback, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react"
import { toast } from "sonner"

import { useData } from "@/context/data-context"
import { useCurrency } from "@/context/currency-context"
import {
  parseExcelFile,
  validateExcelRows,
  type ExcelRow,
  type ParsedExcelResult,
} from "@/lib/excel"
import { CHART_COLORS } from "@/components/shared/color-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/format"
import { AmountDisplay } from "@/components/shared/amount-display"
import { CategoryBadge } from "@/components/shared/category-badge"
import { cn } from "@/lib/utils"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "select" | "preview" | "importing" | "done"

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { categories, addCategory, importTransactions } = useData()
  const { currency } = useCurrency()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("select")
  const [parsed, setParsed] = useState<ParsedExcelResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep("select")
    setParsed(null)
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  function handleClose(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    setStep("preview")
    try {
      const rows = await parseExcelFile(file)
      if (rows.length === 0) {
        toast.error("El archivo está vacío o no tiene datos válidos")
        reset()
        return
      }
      const result = validateExcelRows(rows, categories, currency)
      setParsed(result)
    } catch {
      toast.error("No se pudo leer el archivo. Asegurate de que sea un Excel válido.")
      reset()
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleConfirmImport() {
    if (!parsed) return
    setStep("importing")

    // Create new categories first
    parsed.newCategories.forEach((cat) => {
      addCategory(cat.name, cat.kind, cat.color)
    })

    // Remap placeholder IDs to real IDs
    const catNameToId = new Map<string, number>()
    // Build lookup: existing + newly created (we need the actual IDs)
    // Since addCategory generates its own ID, we look up by name+kind
    const allCats = [...categories, ...parsed.newCategories]
    for (const c of allCats) {
      catNameToId.set(`${c.kind}:${c.name.toLowerCase()}`, c.id)
    }

    const txs = parsed.validRows.map((row) => ({
      kind: row.kind,
      amount: row.amount,
      description: row.description,
      categoryId: catNameToId.get(`${row.kind}:${row.categoryName.toLowerCase()}`) ?? row.categoryId,
      date: row.date,
    }))

    importTransactions(txs)

    toast.success(`${parsed.validRows.length} movimientos importados correctamente`)
    setStep("done")
  }

  const validCount = parsed?.validRows.length ?? 0
  const errorCount = parsed?.errors.length ?? 0
  const newCatCount = parsed?.newCategories.length ?? 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar desde Excel</DialogTitle>
          <DialogDescription>
            Subí un archivo .xlsx con columnas: Tipo, Fecha, Descripción, Categoría, Monto ({currency}).
            {newCatCount > 0 && step === "preview" && (
              <> Se crearán {newCatCount} categorías nuevas automáticamente.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Step: select file */}
        {step === "select" && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-10 transition-colors hover:border-muted-foreground/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="size-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Arrastrá un archivo Excel aquí</p>
              <p className="text-xs text-muted-foreground">o hacé click para seleccionarlo</p>
            </div>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" data-icon="inline-start" />
              Seleccionar archivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>
        )}

        {/* Step: preview */}
        {step === "preview" && parsed && (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <CheckCircle2 className="size-3" data-icon="inline-start" />
                {validCount} válidas
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="size-3" data-icon="inline-start" />
                  {errorCount} con errores
                </Badge>
              )}
              {newCatCount > 0 && (
                <Badge variant="outline">
                  {newCatCount} categorías nuevas
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{fileName}</span>
            </div>

            {/* New categories to create */}
            {newCatCount > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Categorías nuevas que se crearán:</p>
                <div className="flex flex-wrap gap-2">
                  {parsed.newCategories.map((cat) => (
                    <CategoryBadge key={cat.id} name={cat.name} color={cat.color} />
                  ))}
                </div>
              </div>
            )}

            {/* Valid rows preview */}
            {validCount > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Vista previa de movimientos:</p>
                <div className="max-h-48 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Tipo</TableHead>
                        <TableHead className="w-24">Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsed.validRows.slice(0, 20).map((row) => (
                        <TableRow key={row.rowIndex}>
                          <TableCell>
                            <span
                              className={cn(
                                "text-xs font-medium",
                                row.kind === "income" ? "text-primary" : "text-destructive",
                              )}
                            >
                              {row.kind === "income" ? "Ingreso" : "Gasto"}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(row.date)}
                          </TableCell>
                          <TableCell className="max-w-40 truncate">{row.description}</TableCell>
                          <TableCell className="max-w-28 truncate">{row.categoryName}</TableCell>
                          <TableCell className="text-right">
                            <AmountDisplay value={row.amount} kind={row.kind} showSign />
                          </TableCell>
                        </TableRow>
                      ))}
                      {validCount > 20 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                            … y {validCount - 20} más
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Errors */}
            {errorCount > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Errores encontrados:</p>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {parsed.errors.map((err) => (
                    <div key={err.rowIndex} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0 text-destructive" />
                      <span>
                        Fila {err.rowIndex + 2}: {err.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <p className="text-xs text-muted-foreground">
              Las filas con errores no se importarán. Las categorías nuevas se crearán
              automáticamente con colores del sistema.
            </p>
          </div>
        )}

        {/* Step: done */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="size-12 text-primary" />
            <div className="text-center">
              <p className="text-lg font-semibold">Importación completada</p>
              <p className="text-sm text-muted-foreground">
                {validCount} movimientos importados correctamente.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "select" && (
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>
                Elegir otro archivo
              </Button>
              <Button onClick={handleConfirmImport} disabled={validCount === 0}>
                Importar {validCount} movimientos
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => handleClose(false)}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
