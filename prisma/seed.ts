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

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Sueldo", kind: "income", color: "--chart-1" },
  { name: "Freelance", kind: "income", color: "--chart-2" },
  { name: "Dividendos", kind: "income", color: "--chart-3" },
  { name: "Regalos", kind: "income", color: "--chart-4" },
]

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Comida", kind: "expense", color: "--chart-1" },
  { name: "Alquiler", kind: "expense", color: "--chart-2" },
  { name: "Transporte", kind: "expense", color: "--chart-3" },
  { name: "Ocio", kind: "expense", color: "--chart-4" },
  { name: "Servicios", kind: "expense", color: "--chart-5" },
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

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  await prisma.user.upsert({
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

  const adminUser = await prisma.user.findUnique({ where: { username: ADMIN_USERNAME } })
  if (!adminUser) throw new Error("Admin user not found")

  const existingCategories = await prisma.category.count({ where: { userId: adminUser.id } })
  if (existingCategories === 0) {
    const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]
    for (const cat of allCategories) {
      await prisma.category.create({ data: { ...cat, userId: adminUser.id } })
    }
    seedLog(`✓ Created ${allCategories.length} default categories for admin`)
  } else {
    seedLog(`→ ${existingCategories} categories already exist for admin, skipping`)
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