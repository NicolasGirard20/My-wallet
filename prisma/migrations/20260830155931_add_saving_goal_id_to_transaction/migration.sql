-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "savingGoalId" INTEGER;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_savingGoalId_fkey" FOREIGN KEY ("savingGoalId") REFERENCES "SavingGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
