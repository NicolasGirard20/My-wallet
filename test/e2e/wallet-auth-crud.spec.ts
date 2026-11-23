import "dotenv/config"
import { test, expect } from "@playwright/test"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const TEST_USERNAME = `e2e_crud_${Date.now()}`
const TEST_PASSWORD = "E2eCrudPassword123!"

let pool: Pool
let prisma: PrismaClient
let testUserId: number

test.describe.serial("My Wallet — Autenticación, rutas protegidas e ingresos E2E", () => {
  test.beforeAll(async () => {
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
        name: "Usuario CRUD E2E",
        email: `${TEST_USERNAME}@example.com`,
        role: "user",
      },
    })
    testUserId = user.id

    await prisma.category.createMany({
      data: [
        { name: "Sueldo", kind: "income", color: "--chart-1", userId: testUserId },
        { name: "Comida", kind: "expense", color: "--chart-2", userId: testUserId },
      ],
    })

    await prisma.checkingAccount.create({
      data: {
        name: "Cuenta Principal E2E",
        bankName: "Banco E2E",
        currency: "ARS",
        initialBalance: 5000,
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

  test("1. Rutas protegidas redirigen a /login sin sesión activa", async ({ page }) => {
    for (const route of ["/inicio", "/presupuestos", "/ahorros", "/transferencias/ingresos"]) {
      await page.goto(route)
      await page.waitForURL("**/login")
      await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible()
    }
  })

  test("2. Login con credenciales inválidas muestra error y no autentica", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Usuario").fill(TEST_USERNAME)
    await page.getByLabel("Contraseña", { exact: true }).fill("WrongPassword!")
    await page.getByRole("button", { name: "Ingresar" }).click()

    await expect(page.getByText("Credenciales inválidas")).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test("3. Login válido, creación de ingreso y navegación por secciones", async ({ page }) => {
    await page.goto("/login")
    await page.evaluate(() => {
      window.localStorage.setItem("mywallet.currency", "ARS")
    })
    await page.getByLabel("Usuario").fill(TEST_USERNAME)
    await page.getByLabel("Contraseña", { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Ingresar" }).click()
    await page.waitForURL("**/inicio")
    await expect(page.getByRole("heading", { name: /Inicio/i })).toBeVisible()

    // Registrar un ingreso desde Creación rápida -> Transferencias -> Ingreso
    await page.getByRole("button", { name: "Creación rápida" }).click()
    await page.getByRole("menuitem", { name: "Transferencias" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    await page.getByRole("button", { name: "Ingreso", exact: true }).click()
    await page.locator("#amount").fill("25000")
    await page.locator("#description").fill("Sueldo Mensual E2E")
    await page.getByRole("dialog").locator("[data-slot='select-trigger']").click()
    await page.getByRole("option", { name: "Sueldo" }).click()
    await page.getByRole("button", { name: "Agregar ingreso" }).click()
    await expect(page.getByRole("dialog")).toBeHidden()

    // Verificar ingreso reflejado en /transferencias/ingresos
    await page.goto("/transferencias/ingresos")
    const table = page.locator("table")
    await expect(table.getByText("Sueldo Mensual E2E")).toBeVisible()
    await expect(table).toContainText(/25\.000/)

    // Verificar navegación a /ahorros y /presupuestos sin errores
    await page.goto("/ahorros")
    await expect(page.getByRole("heading", { name: /Ahorros/i })).toBeVisible()

    await page.goto("/presupuestos")
    await expect(page.getByRole("heading", { name: /Presupuestos/i })).toBeVisible()
  })
})
