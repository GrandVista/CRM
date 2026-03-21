-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'PENDING_PAYMENT', 'PAID', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'DOCUMENT_COMPLETED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'COMPLETED', 'CANCELLED', 'DEPOSIT_RECEIVED', 'LC_RECEIVED', 'COMPLETED_PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TT', 'LC');

-- CreateEnum
CREATE TYPE "AllowOption" AS ENUM ('ALLOWED', 'NOT_ALLOWED');

-- CreateEnum
CREATE TYPE "SignStatus" AS ENUM ('UNSIGNED', 'SIGNED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FILM', 'RESIN');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PiStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('BOOKED', 'STUFFED', 'SAILED');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('PAYMENT_TERM', 'INCOTERM', 'SHIPMENT_TERM', 'PACKING_TERM', 'INSURANCE_TERM', 'DOCUMENT_REQUIREMENT', 'BANK_INFO');

-- CreateEnum
CREATE TYPE "TodoType" AS ENUM ('PI', 'CL');

-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResinDeliveryStatus" AS ENUM ('NOT_SHIPPED', 'PARTIAL', 'SHIPPED');

-- CreateEnum
CREATE TYPE "ResinPaymentStatus" AS ENUM ('NOT_PAID', 'PARTIAL', 'PAID');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "nameCn" TEXT,
    "nameEn" TEXT,
    "shortName" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "taxNo" TEXT,
    "contactPerson" TEXT,
    "contactTitle" TEXT,
    "defaultCurrency" TEXT DEFAULT 'USD',
    "defaultPaymentTerm" TEXT,
    "defaultIncoterm" TEXT,
    "defaultPortOfDestination" TEXT,
    "defaultInsuranceTerm" TEXT,
    "defaultPackingTerm" TEXT,
    "defaultDocumentRequirement" TEXT,
    "customerLevel" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defaultPortOfShipment" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "material" TEXT,
    "density" DOUBLE PRECISION,
    "unit" TEXT DEFAULT 'kg',
    "defaultPrice" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "weightFormulaType" TEXT,
    "pricingMethod" TEXT,
    "packingMethod" TEXT,
    "remark" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quotationDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTerm" TEXT,
    "incoterm" TEXT,
    "remark" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "thickness" TEXT,
    "width" TEXT,
    "length" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "rollQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "remark" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaInvoice" (
    "id" TEXT NOT NULL,
    "piNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quotationId" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTerm" TEXT,
    "bankInfo" TEXT,
    "status" "PiStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProformaInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiItem" (
    "id" TEXT NOT NULL,
    "piId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "thickness" TEXT,
    "width" TEXT,
    "length" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "rollQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "remark" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PiItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contractNo" TEXT NOT NULL,
    "contractDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "quotationId" TEXT,
    "piId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "incoterm" TEXT,
    "paymentTerm" TEXT,
    "packingTerm" TEXT,
    "insuranceTerm" TEXT,
    "documentRequirement" TEXT,
    "bankInfo" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRolls" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "signStatus" "SignStatus" NOT NULL DEFAULT 'UNSIGNED',
    "executionStatus" "ExecutionStatus" NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estimatedShipmentDate" TEXT,
    "partialShipment" "AllowOption" NOT NULL DEFAULT 'ALLOWED',
    "portOfDestination" TEXT,
    "portOfShipment" TEXT,
    "transhipment" "AllowOption" NOT NULL DEFAULT 'ALLOWED',
    "depositRatio" DOUBLE PRECISION,
    "paymentMethod" "PaymentMethod",
    "moreOrLessPercent" DOUBLE PRECISION,
    "contractType" "ContractType" NOT NULL DEFAULT 'FILM',

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractItem" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "thickness" TEXT,
    "width" TEXT,
    "length" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "rollQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualQty" DOUBLE PRECISION DEFAULT 0,
    "confirmedQty" DOUBLE PRECISION DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "remark" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContractItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractLog" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "content" TEXT,
    "operator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAttachment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileSize" INTEGER DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "ContractAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTodo" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "todoType" "TodoType" NOT NULL,
    "status" "TodoStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "contractId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "buyerName" TEXT,
    "buyerAddress" TEXT,
    "paymentTerm" TEXT,
    "tradeTerm" TEXT,
    "packingTerm" TEXT,
    "fromPort" TEXT,
    "destinationPort" TEXT,
    "vesselVoyageNo" TEXT,
    "departureDate" TIMESTAMP(3),
    "depositDeduction" DOUBLE PRECISION DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmountInWords" TEXT,
    "balanceAmount" DOUBLE PRECISION,
    "balanceAmountInWords" TEXT,
    "shippingMarks" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "depositAmount" DOUBLE PRECISION,
    "depositRatio" DOUBLE PRECISION,
    "lcNo" TEXT,
    "paymentMethod" "PaymentMethod",

    CONSTRAINT "CommercialInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialInvoiceItem" (
    "id" TEXT NOT NULL,
    "commercialInvoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "specification" TEXT,
    "contractQuantityKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualQuantityKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contractRollQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualRollQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hsCode" TEXT,
    "remark" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommercialInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingList" (
    "id" TEXT NOT NULL,
    "clNo" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "shipmentDate" TIMESTAMP(3),
    "batchNo" TEXT,
    "packageCount" INTEGER,
    "netWeight" DOUBLE PRECISION,
    "grossWeight" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "containerNo" TEXT,
    "sealNo" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "buyerAddress" TEXT,
    "buyerName" TEXT,
    "customerId" TEXT,
    "departureDate" TIMESTAMP(3),
    "destinationPort" TEXT,
    "documentDate" TIMESTAMP(3),
    "fromPort" TEXT,
    "invoiceNo" TEXT,
    "packingTerm" TEXT,
    "paymentTerm" TEXT,
    "shippingMarks" TEXT,
    "totalCbm" DOUBLE PRECISION,
    "totalGrossWeight" DOUBLE PRECISION,
    "totalNetWeight" DOUBLE PRECISION,
    "totalPallets" INTEGER,
    "totalRolls" DOUBLE PRECISION,
    "tradeTerm" TEXT,
    "vesselVoyageNo" TEXT,
    "lcNo" TEXT,
    "paymentMethod" "PaymentMethod",

    CONSTRAINT "PackingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingListItem" (
    "id" TEXT NOT NULL,
    "packingListId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "specification" TEXT,
    "contractNetWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualNetWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contractRollQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualRollQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "palletQty" DOUBLE PRECISION,
    "grossWeightKg" DOUBLE PRECISION,
    "cbm" DOUBLE PRECISION,
    "remark" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PackingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNo" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "shippingDate" TIMESTAMP(3),
    "vesselVoyage" TEXT,
    "billOfLadingNo" TEXT,
    "portOfLoading" TEXT,
    "portOfDestination" TEXT,
    "containerNo" TEXT,
    "sealNo" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'BOOKED',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateType" "TemplateType" NOT NULL,
    "content" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyTel" TEXT,
    "companyEmail" TEXT,
    "companyFax" TEXT,
    "companyBank" TEXT,
    "companyAccount" TEXT,
    "companySwift" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contractId" TEXT,
    "piId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DOUBLE PRECISION DEFAULT 1,
    "paymentMethod" TEXT,
    "bankReference" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" VARCHAR(100),
    "role" VARCHAR(50) NOT NULL DEFAULT 'staff',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResinOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "grade" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "deliveryStatus" "ResinDeliveryStatus" NOT NULL DEFAULT 'NOT_SHIPPED',
    "paymentStatus" "ResinPaymentStatus" NOT NULL DEFAULT 'NOT_PAID',
    "shippedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warehouse" TEXT,
    "destination" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResinOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResinOrderShipment" (
    "id" TEXT NOT NULL,
    "resinOrderId" TEXT NOT NULL,
    "deliveryNo" TEXT NOT NULL,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vehicleNo" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResinOrderShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResinOrderPayment" (
    "id" TEXT NOT NULL,
    "resinOrderId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "method" TEXT,
    "referenceNo" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResinOrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNo_key" ON "Quotation"("quotationNo");

-- CreateIndex
CREATE UNIQUE INDEX "ProformaInvoice_piNo_key" ON "ProformaInvoice"("piNo");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNo_key" ON "Contract"("contractNo");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_piId_key" ON "Contract"("piId");

-- CreateIndex
CREATE INDEX "ContractAttachment_contractId_category_idx" ON "ContractAttachment"("contractId", "category");

-- CreateIndex
CREATE INDEX "DocumentTodo_todoType_status_idx" ON "DocumentTodo"("todoType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTodo_contractId_todoType_key" ON "DocumentTodo"("contractId", "todoType");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialInvoice_invoiceNo_key" ON "CommercialInvoice"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "PackingList_clNo_key" ON "PackingList"("clNo");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNo_key" ON "Shipment"("shipmentNo");

-- CreateIndex
CREATE INDEX "DocumentTemplate_templateType_isActive_idx" ON "DocumentTemplate"("templateType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNo_key" ON "Payment"("paymentNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ResinOrder_orderNo_key" ON "ResinOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "ResinOrderShipment_deliveryNo_key" ON "ResinOrderShipment"("deliveryNo");

-- CreateIndex
CREATE INDEX "ResinOrderShipment_resinOrderId_shipmentDate_idx" ON "ResinOrderShipment"("resinOrderId", "shipmentDate");

-- CreateIndex
CREATE INDEX "ResinOrderPayment_resinOrderId_paymentDate_idx" ON "ResinOrderPayment"("resinOrderId", "paymentDate");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiItem" ADD CONSTRAINT "PiItem_piId_fkey" FOREIGN KEY ("piId") REFERENCES "ProformaInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiItem" ADD CONSTRAINT "PiItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_piId_fkey" FOREIGN KEY ("piId") REFERENCES "ProformaInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractItem" ADD CONSTRAINT "ContractItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractItem" ADD CONSTRAINT "ContractItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLog" ADD CONSTRAINT "ContractLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAttachment" ADD CONSTRAINT "ContractAttachment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTodo" ADD CONSTRAINT "DocumentTodo_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoiceItem" ADD CONSTRAINT "CommercialInvoiceItem_commercialInvoiceId_fkey" FOREIGN KEY ("commercialInvoiceId") REFERENCES "CommercialInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoiceItem" ADD CONSTRAINT "CommercialInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingList" ADD CONSTRAINT "PackingList_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingList" ADD CONSTRAINT "PackingList_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingListItem" ADD CONSTRAINT "PackingListItem_packingListId_fkey" FOREIGN KEY ("packingListId") REFERENCES "PackingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingListItem" ADD CONSTRAINT "PackingListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_piId_fkey" FOREIGN KEY ("piId") REFERENCES "ProformaInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResinOrder" ADD CONSTRAINT "ResinOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResinOrderShipment" ADD CONSTRAINT "ResinOrderShipment_resinOrderId_fkey" FOREIGN KEY ("resinOrderId") REFERENCES "ResinOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResinOrderPayment" ADD CONSTRAINT "ResinOrderPayment_resinOrderId_fkey" FOREIGN KEY ("resinOrderId") REFERENCES "ResinOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

