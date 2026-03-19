-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FILM', 'RESIN');

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "contractType" "ContractType" NOT NULL DEFAULT 'FILM';
