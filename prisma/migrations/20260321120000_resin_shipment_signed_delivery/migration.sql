-- AlterTable
ALTER TABLE "ResinOrderShipment" ADD COLUMN "signedDeliveryNoteUrl" TEXT;
ALTER TABLE "ResinOrderShipment" ADD COLUMN "signedDeliveryNoteName" TEXT;
ALTER TABLE "ResinOrderShipment" ADD COLUMN "signedDeliveryUploadedAt" TIMESTAMP(3);
ALTER TABLE "ResinOrderShipment" ADD COLUMN "arrivalConfirmed" BOOLEAN NOT NULL DEFAULT false;
