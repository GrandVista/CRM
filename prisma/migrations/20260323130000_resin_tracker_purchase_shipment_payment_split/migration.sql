-- CreateTable
CREATE TABLE "ResinPurchaseOrder" (
    "id" TEXT NOT NULL,
    "resinOrderId" TEXT NOT NULL,
    "customerPoNo" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResinPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResinOrderShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResinOrderShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResinOrderPaymentItem" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResinOrderPaymentItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ResinOrderShipment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ResinOrderPayment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ResinPurchaseOrder_resinOrderId_idx" ON "ResinPurchaseOrder"("resinOrderId");

-- CreateIndex
CREATE INDEX "ResinPurchaseOrder_resinOrderId_customerPoNo_idx" ON "ResinPurchaseOrder"("resinOrderId", "customerPoNo");

-- CreateIndex
CREATE UNIQUE INDEX "ResinOrderShipmentItem_shipmentId_purchaseOrderId_key" ON "ResinOrderShipmentItem"("shipmentId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "ResinOrderShipmentItem_purchaseOrderId_idx" ON "ResinOrderShipmentItem"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ResinOrderPaymentItem_paymentId_purchaseOrderId_key" ON "ResinOrderPaymentItem"("paymentId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "ResinOrderPaymentItem_purchaseOrderId_idx" ON "ResinOrderPaymentItem"("purchaseOrderId");

-- AddForeignKey
ALTER TABLE "ResinPurchaseOrder" ADD CONSTRAINT "ResinPurchaseOrder_resinOrderId_fkey" FOREIGN KEY ("resinOrderId") REFERENCES "ResinOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResinOrderShipmentItem" ADD CONSTRAINT "ResinOrderShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "ResinOrderShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResinOrderShipmentItem" ADD CONSTRAINT "ResinOrderShipmentItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "ResinPurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResinOrderPaymentItem" ADD CONSTRAINT "ResinOrderPaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ResinOrderPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResinOrderPaymentItem" ADD CONSTRAINT "ResinOrderPaymentItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "ResinPurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
