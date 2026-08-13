"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, FileSpreadsheet, Upload, XCircle } from "lucide-react"
import { toast } from "sonner"

import { useData } from "@/context/data-context"
import { useCurrency } from "@/context/currency-context"
import {
  MAX_FILE_SIZE,
  ParseFileError,
  ParseErrorType,
  parseExcelFile,
  validateExcelRows,
  validateFileExtension,
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

function errorCountByReason(errors: ParsedExcelResult["errors"]) {
  const counts = new Map<string, number>()
  for (const err of errors) {
    const label = err.reason.startsWith("Tipo inválido")
      ? "Tipo inválido"
      : err.reason.startsWith("Monto inválido")
        ? "Monto inválido"
        : err.reason.startsWith("Fecha inválida")
          ? "Fecha inválida"
          : "Otro"
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return Array.from(counts.entries())
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { categories, addCategory, importTransactions } = useData()
  const { currency } = useCurrency()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("select")
  const [parsed, setParsed] = useState<ParsedExcelResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showRules, setShowRules] = useState(false)
  const [showAllErrors, setShowAllErrors] = useState(false)

  const reset = useCallback(() => {
    setStep("select")
    setParsed(null)
    setFileName(null)
    setFileError(null)
    setShowAllErrors(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  function handleClose(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  const errorSummary = useMemo(
    () => (parsed ? errorCountByReason(parsed.errors) : []),
    [parsed],
  )

  async function handleFile(file: File) {
    setFileError(null)

    // Validate extension
    const badExt = validateFileExtension(file.name)
    if (badExt) {
      setFileError(
        `Formato "${badExt}" no soportado. Usá archivos .xlsx, .xls o .csv.`,
      )
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      const mb = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0)
      setFileError(`El archivo es demasiado grande (máximo ${mb} MB)`)
      return
    }

    setFileName(file.name)
    setStep("preview")
    try {
      const rows = await parseExcelFile(file)
      const result = validateExcelRows(rows, categories, currency)
      setParsed(result)
    } catch (err) {
      if (err instanceof ParseFileError) {
        setFileError(err.message)
      } else {
        setFileError(
          `No se pudo leer el archivo. Asegurate de que sea un Excel válido (${file.name}). ` +
            "Si usás un formato muy antiguo (.xls), probá guardarlo como .xlsx.",
        )
      }
      reset()
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleConfirmImport() {
    if (!parsed) return
    setStep("importing")

    const catNameToId = new Map<string, number>()

    for (const c of categories) {
      catNameToId.set(`${c.kind}:${c.name.toLowerCase()}`, c.id)
    }

    for (const cat of parsed.newCategories) {
      const created = await addCategory(cat.name, cat.kind, cat.color)
      catNameToId.set(`${created.kind}:${created.name.toLowerCase()}`, created.id)
    }

    const txs = parsed.validRows.map((row) => ({
      kind: row.kind,
      amount: row.amount,
      description: row.description,
      categoryId: catNameToId.get(`${row.kind}:${row.categoryName.toLowerCase()}`) ?? row.categoryId,
      date: row.date,
    }))

    await importTransactions(txs)

    toast.success(`${parsed.validRows.length} movimientos importados correctamente`)
    setStep("done")
  }

const validCount = parsed?.validRows.length ?? 0
const errorCount = parsed?.errors.length ?? 0
const newCatCount = parsed?.newCategories.length ?? 0
const hasStructuralErrors = (parsed?.structuralErrors.length ?? 0) > 0

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
          <div className="space-y-4">
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

            {/* Persistent file error */}
            {fileError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <XCircle className="size-4" />
                  No se pudo importar el archivo
                </div>
                <p className="text-sm text-destructive/80">{fileError}</p>
                <p className="text-xs text-muted-foreground">
                  Corregí el problema e intentá de nuevo, o seleccioná otro archivo.
                </p>
              </div>
            )}

            {/* Rules panel */}
            <div className="px-1">
              <button
                type="button"
                onClick={() => setShowRules(!showRules)}
                className="flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showRules ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                Formato esperado del archivo
              </button>
              {showRules && (
                <div className="mt-2 space-y-1 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p><strong className="text-foreground">Columnas requeridas</strong> (en cualquier orden):</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li><strong>Tipo</strong> — "Ingreso" o "Gasto"</li>
                    <li><strong>Fecha</strong> — AAAA-MM-DD, DD/MM/AAAA o número de serie de Excel</li>
                    <li><strong>Descripción</strong> — texto libre (opcional)</li>
                    <li><strong>Categoría</strong> — si no existe, se crea automáticamente</li>
                    <li><strong>Monto ({currency})</strong> — número mayor a cero. Usá punto para decimales (ej: 1500.50)</li>
                  </ul>
                  <p className="mt-1 text-foreground">Las filas totalmente vacías se ignoran. Máximo 5000 filas, archivos de hasta 5 MB.</p>
                </div>
              )}
            </div>
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

            {/* Structural errors (missing columns, empty file, etc.) */}
            {parsed.structuralErrors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="size-4" />
                  Error en la estructura del archivo
                </div>
                <ul className="space-y-1">
                  {parsed.structuralErrors.map((err, i) => (
                    <li key={i} className="text-sm text-destructive/80">
                      {err}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Revisá que las columnas del archivo coincidan con el formato esperado.
                </p>
              </div>
            )}

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

            {/* Errors — grouped summary + collapsible list */}
            {errorCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="size-4" />
                  Errores por fila ({errorCount})
                </div>

                {/* Summary by error type */}
                <div className="flex flex-wrap gap-1.5">
                  {errorSummary.map(([label, count]) => (
                    <Badge key={label} variant="outline" className="border-destructive/30 text-destructive/80 text-xs">
                      {label}: {count}
                    </Badge>
                  ))}
                </div>

                {/* Collapsible list */}
                {errorCount <= 3 ? (
                  <div className="space-y-1">
                    {parsed.errors.map((err) => (
                      <div key={err.rowIndex} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="mt-0.5 size-3 shrink-0 text-destructive" />
                        <span>Fila {err.rowIndex + 2}: {err.reason}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {parsed.errors.slice(0, showAllErrors ? undefined : 5).map((err) => (
                      <div key={err.rowIndex} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="mt-0.5 size-3 shrink-0 text-destructive" />
                        <span>Fila {err.rowIndex + 2}: {err.reason}</span>
                      </div>
                    ))}
                    {!showAllErrors && errorCount > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllErrors(true)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pl-5"
                      >
                        <ChevronDown className="size-3" />
                        Mostrar todos ({errorCount})
                      </button>
                    )}
                    {showAllErrors && errorCount > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllErrors(false)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pl-5"
                      >
                        <ChevronRight className="size-3" />
                        Mostrar menos
                      </button>
                    )}
                  </div>
                )}
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
              <Button onClick={handleConfirmImport} disabled={validCount === 0 || hasStructuralErrors}>
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
