-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "investmentContributionId" INTEGER;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_investmentContributionId_fkey" FOREIGN KEY ("investmentContributionId") REFERENCES "InvestmentContribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
