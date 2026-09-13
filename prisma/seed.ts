import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is not set")

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const ADMIN_USERNAME = "adminWallet"
const ADMIN_PASSWORD = process.env.ADMIN_INIT_PASSWORD

if (!ADMIN_PASSWORD) throw new Error("ADMIN_INIT_PASSWORD is not set")

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Comida", kind: "expense", color: "--chart-1" },
  { name: "Alquiler", kind: "expense", color: "--chart-2" },
  { name: "Transporte", kind: "expense", color: "--chart-3" },
  { name: "Ocio", kind: "expense", color: "--chart-4" },
  { name: "Servicios", kind: "expense", color: "--chart-5" },
  { name: "Ahorros", kind: "expense", color: "--chart-5" },
  { name: "Inversiones", kind: "expense", color: "--chart-3" },
]

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Sueldo", kind: "income", color: "--chart-1" },
  { name: "Freelance", kind: "income", color: "--chart-2" },
  { name: "Dividendos", kind: "income", color: "--chart-3" },
  { name: "Regalos", kind: "income", color: "--chart-4" },
  { name: "Ahorros", kind: "income", color: "--chart-5" },
  { name: "Inversiones", kind: "income", color: "--chart-3" },
]

const SEED = !process.env.NODE_ENV || process.env.NODE_ENV !== "production"

function seedLog(...args: unknown[]) {
  if (SEED) console.log(...args)
}

function seedError(...args: unknown[]) {
  if (SEED) console.error(...args)
}

async function main() {
  seedLog("Starting My Wallet seeding...")

  const password = ADMIN_PASSWORD
  if (!password) throw new Error("ADMIN_INIT_PASSWORD is not set")

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: { passwordHash, email: "adminWalletNic@gmail.com", role: "admin" },
    create: {
      username: ADMIN_USERNAME,
      passwordHash,
      name: "Administrador",
      email: "adminWalletNic@gmail.com",
      role: "admin",
    },
  })
  seedLog("✓ Admin user ready")

  const existingCategories = await prisma.category.count({ where: { userId: user.id } })
  if (existingCategories === 0) {
    const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]
    for (const cat of allCategories) {
      await prisma.category.create({ data: { ...cat, userId: user.id } })
    }
    seedLog(`✓ Created ${allCategories.length} default categories for admin`)
  } else {
    seedLog(`→ ${existingCategories} categories already exist for admin, skipping`)
  }

  const existingAccounts = await prisma.checkingAccount.count({ where: { userId: user.id } })
  if (existingAccounts === 0) {
    await prisma.checkingAccount.createMany({
      data: [
        {
          name: "Cuenta Corriente (ARS)",
          bankName: "Banco Principal",
          currency: "ARS",
          initialBalance: 0,
          overdraftLimit: 100000,
          color: "--chart-1",
          isDefault: true,
          isActive: true,
          userId: user.id,
        },
        {
          name: "Caja de Ahorro (USD)",
          bankName: "Banco Principal",
          currency: "USD",
          initialBalance: 0,
          overdraftLimit: 0,
          color: "--chart-2",
          isDefault: false,
          isActive: true,
          userId: user.id,
        },
      ],
    })
    seedLog("✓ Created default checking accounts for admin")
  } else {
    seedLog(`→ ${existingAccounts} checking accounts already exist, skipping`)
  }

  seedLog("✅ Seeding completed successfully")
}

main()
  .catch((e) => {
    seedError("❌ Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })