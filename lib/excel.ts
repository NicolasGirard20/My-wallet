import * as XLSX from "xlsx"
import { CHART_COLORS } from "@/components/shared/color-picker"
import type { Category, Currency, Transaction, TransactionKind } from "./types"

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
  newCategories: Category[] // categories that need to be created
}

export interface ValidatedImportRow {
  rowIndex: number // 0-based data row index
  kind: TransactionKind
  description: string
  categoryName: string
  categoryId: number // id of existing category or placeholder (negative) for new one
  amount: number // in its own currency
  date: string // ISO
}

export interface ImportRowError {
  rowIndex: number
  reason: string
  raw: ExcelRow
}

/** Accepts a File and returns parsed rows */
export async function parseExcelFile(file: File): Promise<ExcelRow[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: "array" })
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" })
}

/** Validates parsed rows against existing categories, returns valid rows + errors + new categories needed */
export function validateExcelRows(
  rows: ExcelRow[],
  categories: Category[],
  currency: Currency,
): ParsedExcelResult {
  const validRows: ValidatedImportRow[] = []
  const errors: ImportRowError[] = []
  const newCategoryMap = new Map<string, Category>() // key: "kind:name"
  const montoKey = montoHeader(currency)

  const catLookup = new Map<string, Category>()
  for (const c of categories) {
    catLookup.set(`${c.kind}:${c.name.toLowerCase()}`, c)
  }

  let colorIdx = 0

  rows.forEach((row, rowIndex) => {
    // Skip empty rows
    const tipo = String(row.Tipo ?? "").trim()
    const fecha = String(row.Fecha ?? "").trim()
    const desc = String(row.Descripción ?? "").trim()
    const catName = String(row.Categoría ?? "").trim()
    const montoRaw = row[montoKey]

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
      errors.push({ rowIndex, reason: `Monto inválido: "${montoRaw}". Debe ser un número mayor a cero.`, raw: row })
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
        errors.push({ rowIndex, reason: `Fecha inválida: "${fecha}". Formato esperado: AAAA-MM-DD.`, raw: row })
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
    newCategories: Array.from(newCategoryMap.values()),
  }
}
