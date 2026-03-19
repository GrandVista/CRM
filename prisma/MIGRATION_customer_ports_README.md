# 数据库迁移说明

## 一、Customer 港口字段（如已执行可跳过）

Schema 已统一为：Customer 使用 `defaultPortOfShipment`、`defaultPortOfDestination`（删除 `defaultPortOfLoading` 与重复的 `portOfShipment`/`portOfDestination`）。

若使用 `prisma db push` 且库中已有旧字段数据，在首次 push 前可先执行：

```sql
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "defaultPortOfShipment" TEXT;
UPDATE "Customer"
SET "defaultPortOfShipment" = COALESCE("defaultPortOfLoading", "portOfShipment")
WHERE "defaultPortOfShipment" IS NULL AND ("defaultPortOfLoading" IS NOT NULL OR "portOfShipment" IS NOT NULL);
```

再执行 `npx prisma db push`。

---

## 二、Contract 字段调整

- **已删除**：`paymentMethod`（合同不再使用；收款记录 Payment 表仍保留 paymentMethod）
- **已重命名**：`shipmentTerm` → `estimatedShipmentDate`（预计装运日期）

若库中已有 `Contract.shipmentTerm` 数据，在首次 `npx prisma db push` 前可先执行以下 SQL 保留数据：

```sql
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "estimatedShipmentDate" TEXT;
UPDATE "Contract" SET "estimatedShipmentDate" = "shipmentTerm" WHERE "shipmentTerm" IS NOT NULL;
```

再执行 `npx prisma db push`（会删除 `shipmentTerm` 和 `paymentMethod` 列）。若为全新库，可直接 `npx prisma db push`。

---

## 三、Contract：Partial Shipment / Transhipment 默认值

字段已改为必填且默认 `ALLOWED`：`partialShipment AllowOption @default(ALLOWED)`，`transhipment AllowOption @default(ALLOWED)`。

若库中已有合同且这两列为 NULL，在执行 `npx prisma db push` **之前**先执行以下 SQL，避免非空约束报错：

```sql
UPDATE "Contract" SET "partialShipment" = 'ALLOWED' WHERE "partialShipment" IS NULL;
UPDATE "Contract" SET "transhipment" = 'ALLOWED' WHERE "transhipment" IS NULL;
```

然后再执行 `npx prisma db push`。新库无需执行上述 SQL。
