import { prisma } from "@/app/service/db"
import { logger } from "@/app/imports/dev"

export async function getInvestments(currency?: string) {
  try {
    return await prisma.investment.findMany({
      where: currency ? { currency } : undefined,
      include: {
        contributions: { orderBy: { date: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    logger.error("getInvestments failed:", error)
    throw new Error("Error al obtener las inversiones")
  }
}

export async function getInvestmentById(id: number) {
  try {
    return await prisma.investment.findUnique({
      where: { id },
      include: {
        contributions: { orderBy: { date: "asc" } },
      },
    })
  } catch (error) {
    logger.error("getInvestmentById failed:", error)
    throw new Error("Error al obtener la inversión")
  }
}

export async function createInvestment(data: {
  name: string
  description: string
  invested: number
  currentValue: number
  currency: string
}) {
  try {
    return await prisma.investment.create({ data })
  } catch (error) {
    logger.error("createInvestment failed:", error)
    throw new Error("Error al crear la inversión")
  }
}

export async function updateInvestment(
  id: number,
  data: Partial<{
    name: string
    description: string
    invested: number
    currentValue: number
    currency: string
  }>,
) {
  try {
    return await prisma.investment.update({ where: { id }, data })
  } catch (error) {
    logger.error("updateInvestment failed:", error)
    throw new Error("Error al actualizar la inversión")
  }
}

export async function deleteInvestment(id: number) {
  try {
    await prisma.investment.delete({ where: { id } })
  } catch (error) {
    logger.error("deleteInvestment failed:", error)
    throw new Error("Error al eliminar la inversión")
  }
}

export async function addContribution(investmentId: number, data: {
  date: Date
  amount: number
  currency: string
  note?: string
}) {
  try {
    const amount = data.amount

    const [contribution] = await prisma.$transaction([
      prisma.investmentContribution.create({
        data: { ...data, amount, investmentId },
      }),
      prisma.investment.update({
        where: { id: investmentId },
        data: {
          invested: { increment: amount },
          currentValue: { increment: data.amount },
        },
      }),
    ])

    return contribution
  } catch (error) {
    logger.error("addContribution failed:", error)
    throw new Error("Error al agregar el aporte")
  }
}

export async function deleteContribution(contributionId: number) {
  try {
    const contribution = await prisma.investmentContribution.findUnique({
      where: { id: contributionId },
    })
    if (!contribution) throw new Error("Aporte no encontrado")

    const amount = contribution.amount

    await prisma.$transaction([
      prisma.investmentContribution.delete({ where: { id: contributionId } }),
      prisma.investment.update({
        where: { id: contribution.investmentId },
        data: {
          invested: { decrement: amount },
          currentValue: { decrement: contribution.amount },
        },
      }),
    ])
  } catch (error) {
    logger.error("deleteContribution failed:", error)
    throw new Error("Error al eliminar el aporte")
  }
}