import * as XLSX from "xlsx"
import { CHART_COLORS } from "@/components/shared/color-picker"
import type { Category, Currency, Transaction, TransactionKind } from "./types"

// ─── Limits ───────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_ROWS = 5000

// ─── Export ───────────────────────────────────────────────────────────────────

function montoHeader(currency: Currency) {
  return `Monto (${currency})`
}

interface ExportRow {
  Tipo: string
  Fecha: string
  Descripción: string
  Categoría: string
  [monto: string]: string | number
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  categories: Category[],
  currency: Currency,
  filename?: string,
) {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const montoKey = montoHeader(currency)
  const headers = ["Tipo", "Fecha", "Descripción", "Categoría", montoKey]

  const rows: ExportRow[] = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((tx) => ({
      Tipo: tx.kind === "income" ? "Ingreso" : "Gasto",
      Fecha: tx.date.slice(0, 10),
      Descripción: tx.description,
      Categoría: catMap.get(tx.categoryId)?.name ?? "—",
      [montoKey]: Number(tx.amount.toFixed(2)),
    }))

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers })

  // Column widths
  ws["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Movimientos")

  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, filename ?? `my-wallet-backup-${date}.xlsx`)
}

// ─── Import ───────────────────────────────────────────────────────────────────

export const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const

export enum ParseErrorType {
  READ_FAILURE = "read_failure",
  NO_SHEETS = "no_sheets",
  EMPTY_FILE = "empty_file",
  INVALID_EXTENSION = "invalid_extension",
  FILE_TOO_LARGE = "file_too_large",
}

export class ParseFileError extends Error {
  type: ParseErrorType

  constructor(type: ParseErrorType, message: string) {
    super(message)
    this.name = "ParseFileError"
    this.type = type
  }
}

export function validateFileExtension(filename: string): string | null {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."))
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return ext || "(sin extensión)"
  }
  return null
}

export interface ExcelRow {
  Tipo?: string
  Fecha?: string
  Descripción?: string
  Categoría?: string
  [monto: string]: string | number | undefined
}

export interface ParsedExcelResult {
  validRows: ValidatedImportRow[]
  errors: ImportRowError[]
  structuralErrors: string[]
  newCategories: Category[]
}

export interface ValidatedImportRow {
  rowIndex: number
  kind: TransactionKind
  description: string
  categoryName: string
  categoryId: number
  amount: number
  date: string
}

export interface ImportRowError {
  rowIndex: number
  reason: string
  raw: ExcelRow
}

/** Accepts a File and returns parsed rows */
export async function parseExcelFile(file: File): Promise<ExcelRow[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: "array", cellDates: true })

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new ParseFileError(ParseErrorType.NO_SHEETS, "El archivo no contiene hojas de cálculo.")
  }

  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  if (!sheet || !sheet["!ref"]) {
    throw new ParseFileError(ParseErrorType.EMPTY_FILE, `La hoja "${sheetName}" está vacía.`)
  }

  return XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" })
}

/** Validates parsed rows against existing categories, returns valid rows + errors + new categories needed */
export function validateExcelRows(
  rows: ExcelRow[],
  categories: Category[],
  currency: Currency,
): ParsedExcelResult {
  const montoKey = montoHeader(currency)

  const catLookup = new Map<string, Category>()
  for (const c of categories) {
    catLookup.set(`${c.kind}:${c.name.toLowerCase()}`, c)
  }

  let colorIdx = 0

  // ── Structural checks ────────────────────────────────────────────────────
  const structuralErrors: string[] = []
  const validRows: ValidatedImportRow[] = []
  const errors: ImportRowError[] = []
  const newCategoryMap = new Map<string, Category>()

  let montoAlias: string | undefined

  // Validate monto column header exists — tolerate common variations
  if (rows.length > 0) {
    const firstRowKeys = Object.keys(rows[0])
    const hasMontoColumn = firstRowKeys.some((k) => k === montoKey)
    montoAlias = !hasMontoColumn
      ? firstRowKeys.find((k) => /^monto/i.test(k.trim()))
      : undefined

    if (!hasMontoColumn && !montoAlias) {
      structuralErrors.push(
        `No se encontró la columna "${montoKey}". Columnas detectadas: ${firstRowKeys.join(", ") || "(ninguna)"}. ` +
          `Asegurate de que el encabezado coincida exactamente, incluida la moneda entre paréntesis.`,
      )
    }
  } else {
    structuralErrors.push("El archivo no contiene filas de datos.")
  }

  if (structuralErrors.length > 0) {
    return { validRows: [], errors, structuralErrors, newCategories: [] }
  }

  // Validate row count
  if (rows.length > MAX_ROWS) {
    structuralErrors.push(
      `El archivo tiene ${rows.length} filas. El máximo permitido es ${MAX_ROWS}. ` +
        `Dividí el archivo en partes más chicas.`,
    )
    return { validRows: [], errors, structuralErrors, newCategories: [] }
  }

  rows.forEach((row, rowIndex) => {
    // Skip empty rows
    const tipo = String(row.Tipo ?? "").trim()
    const fecha = String(row.Fecha ?? "").trim()
    const desc = String(row.Descripción ?? "").trim()
    const catName = String(row.Categoría ?? "").trim()
    const montoRaw = row[montoAlias ?? montoKey]

    if (!tipo && !fecha && !desc && !catName && !montoRaw) return // fully empty

    // Validate Tipo
    const kind: TransactionKind | null =
      /ingreso/i.test(tipo)
        ? "income"
        : /gasto/i.test(tipo)
          ? "expense"
          : null

    if (!kind) {
      errors.push({ rowIndex, reason: `Tipo inválido: "${tipo}". Se espera "Ingreso" o "Gasto".`, raw: row })
      return
    }

    // Validate Monto
    const amount = typeof montoRaw === "number" ? montoRaw : Number(String(montoRaw).replace(",", "."))
    if (!Number.isFinite(amount) || amount <= 0) {
      const actualKey = montoAlias ?? montoKey
      const hint = !montoRaw
        ? ` El valor está vacío. Asegurate de que la columna "${actualKey}" tenga un número.`
        : " Debe ser un número mayor a cero (usá punto para decimales, ej: 1500.50)."
      errors.push({ rowIndex, reason: `Monto inválido: "${montoRaw}".${hint}`, raw: row })
      return
    }

    // Validate Fecha
    let date: string
    if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
      date = new Date(fecha).toISOString()
    } else if (/^\d{2}\/\d{2}\/\d{4}/.test(fecha)) {
      const [d, m, y] = fecha.split("/")
      date = new Date(`${y}-${m}-${d}`).toISOString()
    } else {
      // Try Excel serial date
      const serial = Number(fecha)
      if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
        const excelEpoch = new Date(1899, 11, 30)
        date = new Date(excelEpoch.getTime() + serial * 86400000).toISOString()
      } else {
        errors.push({
          rowIndex,
          reason: `Fecha inválida: "${fecha}". Formatos aceptados: AAAA-MM-DD (ej: 2026-08-13), DD/MM/AAAA (ej: 13/08/2026) o número de serie de Excel.`,
          raw: row,
        })
        return
      }
    }

    // Validate Categoría — find or mark for creation
    let categoryId: number
    const lookupKey = `${kind}:${catName.toLowerCase()}`
    const existing = catLookup.get(lookupKey)

    if (existing) {
      categoryId = existing.id
    } else {
      // Check if we already queued this new category
      let newCat = newCategoryMap.get(lookupKey)
      if (!newCat) {
        const color = CHART_COLORS[colorIdx % CHART_COLORS.length]
        colorIdx++
        newCat = {
          id: -colorIdx, // negative placeholder, remapped to real id on import
          name: catName,
          kind,
          color,
        }
        newCategoryMap.set(lookupKey, newCat)
      }
      categoryId = newCat.id
    }

    validRows.push({
      rowIndex,
      kind,
      description: desc || (kind === "income" ? "Ingreso" : "Gasto"),
      categoryName: catName,
      categoryId,
      amount,
      date,
    })
  })

  return {
    validRows,
    errors,
    structuralErrors,
    newCategories: Array.from(newCategoryMap.values()),
  }
}
