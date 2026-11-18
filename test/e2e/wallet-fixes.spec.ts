import "dotenv/config"
import fs from "node:fs"
import path from "node:path"
import { test, expect, type Page } from "@playwright/test"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "test/results/screenshots")

const TEST_USERNAME = `e2e_wallet_${Date.now()}`
const TEST_PASSWORD = "E2eTestPassword123!"

let pool: Pool
let prisma: PrismaClient
let testUserId: number

async function shot(page: Page, filename: string) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, filename),
    fullPage: true,
  })
}

async function loginAsTestUser(page: Page) {
  await page.goto("/login")
  await page.evaluate(() => {
    window.localStorage.setItem("mywallet.currency", "ARS")
  })
  await page.getByLabel("Usuario").fill(TEST_USERNAME)
  await page.getByLabel("Contraseña", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Ingresar" }).click()
  await page.waitForURL("**/inicio")
  await expect(page.getByRole("heading", { name: /Inicio/i })).toBeVisible()
}

test.describe.serial("My Wallet — Validación E2E de correcciones y nuevas funcionalidades", () => {
  test.beforeAll(async () => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error("DATABASE_URL is not set")

    pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    prisma = new PrismaClient({ adapter })

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)
    const user = await prisma.user.create({
      data: {
        username: TEST_USERNAME,
        passwordHash,
        name: "Usuario E2E",
        email: `${TEST_USERNAME}@example.com`,
        role: "user",
      },
    })
    testUserId = user.id

    await prisma.category.createMany({
      data: [
        { name: "Comida", kind: "expense", color: "--chart-1", userId: testUserId },
        { name: "Transporte", kind: "expense", color: "--chart-2", userId: testUserId },
        { name: "Sueldo", kind: "income", color: "--chart-1", userId: testUserId },
        { name: "Ahorros", kind: "expense", color: "--chart-5", userId: testUserId },
        { name: "Inversiones", kind: "expense", color: "--chart-3", userId: testUserId },
      ],
    })

    await prisma.checkingAccount.create({
      data: {
        name: "Cuenta E2E (ARS)",
        bankName: "Banco Test",
        currency: "ARS",
        initialBalance: 10000,
        overdraftLimit: 0,
        color: "--chart-1",
        isDefault: true,
        isActive: true,
        userId: testUserId,
      },
    })
  })

  test.afterAll(async () => {
    if (prisma && testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
      await prisma.$disconnect()
    }
    if (pool) {
      await pool.end()
    }
  })

  test("1. Cierre de sesión al salir del navegador (cookie de sesión efímera + sessionStorage)", async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await loginAsTestUser(page)

    // Verificar cookie de sesión sin Max-Age/Expires persistente (expires === -1)
    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name === "mywallet_session")
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie?.expires).toBe(-1)

    const activeFlag = await page.evaluate(() => sessionStorage.getItem("mywallet_active_session"))
    expect(activeFlag).toBe("1")

    // Simular cierre del navegador (sessionStorage se pierde al abrir nueva pestaña/navegador restaurado aunque mantenga cookie)
    await page.close()
    const newPage = await context.newPage()
    // En el mismo contexto, una nueva página creada tras vaciar sessionStorage emula reapertura tras cierre del navegador
    await newPage.addInitScript(() => {
      // solo al primer load antes de volver a loguear
      if (!window.name) {
        sessionStorage.removeItem("mywallet_active_session")
        window.name = "reopened"
      }
    })
    await newPage.goto("/inicio")
    await newPage.waitForURL("**/login")
    await expect(newPage.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible()
    await shot(newPage, "01-session-closed-login.png")

    await context.close()
  })

  test("2. Flujo completo: botón '+', ahorros/inversiones sin gastos, estadísticas, valor invertido inicial y presupuesto repetitivo", async ({ page }) => {
    await loginAsTestUser(page)

    // 2a. Botón '+' arriba del botón flotante de calculadora
    const quickCreateBtn = page.getByRole("button", { name: "Creación rápida" })
    const calcBtn = page.getByRole("button", { name: "Calculadora" })
    await expect(quickCreateBtn).toBeVisible()
    await expect(calcBtn).toBeVisible()

    const quickBox = await quickCreateBtn.boundingBox()
    const calcBox = await calcBtn.boundingBox()
    expect(quickBox).not.toBeNull()
    expect(calcBox).not.toBeNull()
    expect(quickBox!.y).toBeLessThan(calcBox!.y)

    await quickCreateBtn.click()
    await expect(page.getByRole("menuitem", { name: "Transferencias" })).toBeVisible()
    await expect(page.getByRole("menuitem", { name: "Ahorros" })).toBeVisible()
    await expect(page.getByRole("menuitem", { name: "Presupuestos" })).toBeVisible()
    await expect(page.getByRole("menuitem", { name: "Inversiones" })).toBeVisible()
    await shot(page, "02-quick-create-menu.png")

    // 2b. Crear un gasto real desde '+' -> Transferencias
    await page.getByRole("menuitem", { name: "Transferencias" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("button", { name: "Gasto", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Ingreso", exact: true })).toBeVisible()
    await shot(page, "03-quick-create-transferencias.png")

    await page.locator("#amount").fill("1500")
    await page.locator("#description").fill("Supermercado E2E")
    // Seleccionar explícitamente categoría "Comida" (para no quedar con "Ahorros" por orden alfabético)
    await page.getByRole("dialog").locator("[data-slot='select-trigger']").click()
    await page.getByRole("option", { name: "Comida" }).click()
    await page.getByRole("button", { name: "Agregar gasto" }).click()
    await expect(page.getByRole("dialog")).toBeHidden()

    // Verificar card Gastos = $1.500
    const expenseCard = page
      .locator("[data-slot='card']")
      .filter({ has: page.locator("[data-slot='card-title']", { hasText: /^Gastos$/ }) })
    await expect(expenseCard).toContainText(/1\.500/)

    // 2c. Crear meta de ahorro desde '+' -> Ahorros ($2.000)
    await quickCreateBtn.click()
    await page.getByRole("menuitem", { name: "Ahorros" }).click()
    await expect(page.getByRole("heading", { name: "Nueva meta de ahorro" })).toBeVisible()
    await page.locator("#saving-name").fill("Viaje E2E")
    await page.locator("#saving-target").fill("5000")
    await page.locator("#saving-saved").fill("2000")
    await page.getByRole("button", { name: "Guardar meta" }).click()
    await expect(page.getByRole("dialog")).toBeHidden()

    // 2d. Crear inversión desde '+' -> Inversiones ($3.000)
    await quickCreateBtn.click()
    await page.getByRole("menuitem", { name: "Inversiones" }).click()
    await expect(page.getByRole("heading", { name: "Nueva inversión" })).toBeVisible()
    await expect(page.getByText("Valor invertido inicial")).toBeVisible()
    // Verificar que el saldo de la cuenta corriente bajó solo por el gasto ($10.000 - $1.500 = $8.500), NO por el ahorro ($2.000)
    await expect(page.locator("#investment-account")).toContainText(/8\.500/)
    await page.locator("#investment-name").fill("CEDEARs E2E")
    await page.locator("#investment-value").fill("3000")
    await page.getByRole("button", { name: "Guardar" }).click()
    await expect(page.getByRole("dialog")).toBeHidden()

    // 2e. Verificar en Dashboard (/inicio):
    // - Gastos sigue en $1.500 (no sumó $2.000 ni $3.000)
    // - Ahorros + Inversiones muestra $5.000 ($2.000 + $3.000)
    const savingsInvCard = page
      .locator("[data-slot='card']")
      .filter({ has: page.locator("[data-slot='card-title']", { hasText: /^Ahorros \+ Inversiones$/ }) })
    await expect(savingsInvCard).toContainText(/5\.000/)
    await expect(expenseCard).toContainText(/1\.500/)
    await expect(expenseCard).not.toContainText(/6\.500/)

    await shot(page, "04-dashboard-stats.png")

    // 2f. Ir a /transferencias/gastos y verificar que NO hay registros de ahorro ni inversión en la tabla
    await page.goto("/transferencias/gastos")
    const expensesTable = page.locator("table")
    await expect(expensesTable.getByText("Supermercado E2E")).toBeVisible()
    await expect(expensesTable.getByText(/Viaje E2E|CEDEARs E2E|Ahorros|Inversiones/)).toHaveCount(0)
    await shot(page, "05-gastos-sin-ahorro-inversion.png")

    // 2g. Ir a /inversiones y verificar "Valor invertido inicial" y "Valor actual"
    await page.goto("/inversiones")
    await expect(page.getByText("CEDEARs E2E")).toBeVisible()
    await expect(page.getByText("Valor invertido inicial")).toBeVisible()
    await expect(page.getByText("Valor actual")).toBeVisible()
    await shot(page, "06-inversiones-lista.png")

    // Entrar al detalle de la inversión
    await page.getByRole("link", { name: /CEDEARs E2E/ }).first().click()
    await page.waitForURL("**/inversiones/**")
    await expect(page.getByText("Valor invertido inicial")).toBeVisible()

    const valorActualCard = page.locator("[data-slot='card']").filter({ hasText: "Valor actual" })
    const valorInicialCard = page.locator("[data-slot='card']").filter({ hasText: "Valor invertido inicial" })

    await expect(valorActualCard).toContainText(/3\.000/)
    await expect(valorInicialCard).toContainText(/3\.000/)

    // Hacer un Aporte de $1.200
    await page.getByRole("button", { name: "Aporte (+)" }).click()
    await page.locator("input[type='number']").first().fill("1200")
    await page.getByPlaceholder("Ej: aporte trimestral").fill("Aporte E2E")
    await page.getByRole("button", { name: "Registrar Aporte" }).click()

    await expect(valorActualCard).toContainText(/4\.200/)
    await expect(valorInicialCard).toContainText(/3\.000/)
    await shot(page, "07-inversion-detalle-aporte.png")

    // Hacer un Retiro de $400
    await page.getByRole("button", { name: "Retiro (-)" }).click()
    await page.locator("input[type='number']").first().fill("400")
    await page.getByPlaceholder("Ej: aporte trimestral").fill("Retiro E2E")
    await page.getByRole("button", { name: "Registrar Retiro" }).click()

    await expect(valorActualCard).toContainText(/3\.800/)
    await expect(valorInicialCard).toContainText(/3\.000/)
    await shot(page, "08-inversion-detalle-retiro.png")

    // Volver al inicio y confirmar que Ahorros + Inversiones actualizó a $5.800 ($2.000 + $3.800) y Gastos sigue en $1.500
    await page.goto("/inicio")
    await expect(
      page
        .locator("[data-slot='card']")
        .filter({ has: page.locator("[data-slot='card-title']", { hasText: /^Ahorros \+ Inversiones$/ }) }),
    ).toContainText(/5\.800/)
    await expect(
      page
        .locator("[data-slot='card']")
        .filter({ has: page.locator("[data-slot='card-title']", { hasText: /^Gastos$/ }) }),
    ).toContainText(/1\.500/)

    // 2h. Crear Presupuesto repetitivo desde '+' -> Presupuestos
    await page.getByRole("button", { name: "Creación rápida" }).click()
    await page.getByRole("menuitem", { name: "Presupuestos" }).click()
    await expect(page.getByRole("heading", { name: "Nuevo Presupuesto" })).toBeVisible()

    await page.locator("#budget-name").fill("Comida Mensual E2E")
    await page.locator("#budget-limit").fill("3000")
    await page.locator("#budget-category").selectOption({ label: "Comida" })
    await page.getByLabel("Presupuesto repetitivo").check()

    const freqSelect = page.locator("#budget-frequency")
    await expect(freqSelect).toBeVisible()
    await expect(freqSelect.locator("option")).toHaveCount(4)
    await freqSelect.selectOption("monthly")
    await shot(page, "09-presupuesto-repetitivo-modal.png")

    await page.getByRole("button", { name: "Crear presupuesto" }).click()
    await expect(page.getByRole("dialog")).toBeHidden()

    await page.goto("/presupuestos")
    const budgetCard = page.locator("[data-slot='card']").filter({ hasText: "Comida Mensual E2E" })
    await expect(budgetCard).toBeVisible()
    await expect(budgetCard).toContainText("Se repite cada mes")
    await expect(budgetCard).toContainText("50%")
    await shot(page, "10-presupuesto-repetitivo-card.png")
  })
})
