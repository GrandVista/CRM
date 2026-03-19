# 数据库结构同步说明

## 报错原因

`The column contract.paymentMethod does not exist in the current database` 表示：

- **代码**（Prisma Client + 应用）已按新 schema 使用 `Contract.paymentMethod`、`Contract.depositRatio` 等字段
- **数据库**里 `Contract` 表尚未包含这些列，即 schema 修改后未成功同步到数据库

## 当前 Contract 模型（schema 中）

```prisma
model Contract {
  id                    String           @id @default(cuid())
  contractNo            String           @unique
  contractDate          DateTime
  customerId            String
  quotationId           String?
  piId                  String?          @unique
  currency              String           @default("USD")
  incoterm              String?
  paymentMethod         PaymentMethod?   // 新增：TT / LC
  depositRatio          Float?           // 新增：订金比例
  paymentTerm           String?
  portOfShipment        String?
  portOfDestination    String?
  partialShipment       AllowOption   @default(ALLOWED)
  transhipment          AllowOption   @default(ALLOWED)
  estimatedShipmentDate String?
  packingTerm           String?
  insuranceTerm         String?
  documentRequirement   String?
  bankInfo              String?
  totalAmount           Float            @default(0)
  totalWeight           Float            @default(0)
  totalRolls            Float            @default(0)
  signStatus            SignStatus       @default(UNSIGNED)
  executionStatus       ExecutionStatus  @default(DRAFT)
  remark                String?
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  customer              Customer         @relation(...)
  pi                    ProformaInvoice? @relation(...)
  quotation             Quotation?       @relation(...)
  items                 ContractItem[]
  logs                  ContractLog[]
  commercialInvoices    CommercialInvoice[]
  packingLists          PackingList[]
  payments              Payment[]
  shipments             Shipment[]
  documentTodos         DocumentTodo[]
  attachments           ContractAttachment[]
}
```

说明：合同表**不再包含** `lcNo`，L/C No. 仅在 CI/PL 中维护。

## 必须执行的命令顺序

在项目根目录执行（确保已配置 `.env` 中的 `DATABASE_URL`）：

```bash
# 1. 根据当前 schema 重新生成 Prisma Client（保证代码用的类型和 schema 一致）
npx prisma generate

# 2. 将 schema 同步到数据库（创建/修改表与列、枚举等）
npx prisma db push
```

若第 2 步报错或提示存在数据冲突/丢失风险，在**开发环境**且可接受数据重置时，可尝试：

```bash
npx prisma db push --accept-data-loss
```

（生产环境请勿随意使用 `--accept-data-loss`，应先备份并用 migration 评估变更。）

## 若 db push 被阻塞

常见情况：

1. **枚举不存在**：schema 中新增了 `enum PaymentMethod { TT LC }`，而库里没有该枚举。`db push` 会创建枚举并给 `Contract` 增加 `paymentMethod`、`depositRatio` 等列，一般无需单独处理。
2. **迁移历史与当前库不一致**：若之前用过 `prisma migrate`，又直接改过库或在不同分支执行过不同迁移，可能出现 “drift”。此时可以：
   - 在开发环境：用 `npx prisma db push --force-reset` 重置库并重新应用 schema（会清空数据），或
   - 根据提示先解决 drift，再执行 `db push`。
3. **权限不足**：确保 `DATABASE_URL` 对应用户有 CREATE/ALTER 表、类型的权限。

同步成功后，合同编辑页、`getContractById` 等使用 `paymentMethod`、`depositRatio` 的代码会与数据库一致，不再出现“代码有字段、库没字段”的错误。
