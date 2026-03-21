# Prisma 迁移基线说明（已有业务库 + 历史未对齐）

## 背景

仓库里曾有一条迁移 `20250316000000_add_contract_type`，内容仅为 `ALTER TABLE "Contract" ADD COLUMN ...`。  
在空库（含 Prisma **shadow database**）上按顺序执行时，**还没有 `Contract` 表**，因此 `migrate dev` 会报 **P3006**。

现已改为单一基线迁移：

- `20250101000000_baseline_init`：由 `prisma migrate diff --from-empty --to-schema-datamodel` 生成，**包含当前 `schema.prisma` 的完整建表脚本**（含树脂订单相关表）。

这样在 shadow DB 上从 0 应用迁移可以成功。

---

## 你最少需要执行的命令（二选一）

### 情况 A：数据库里**还没有** `_prisma_migrations` 记录，或你愿意让 Prisma 在**空库/新库**上跑迁移

```bash
npx prisma migrate dev
```

（会应用 `20250101000000_baseline_init`，创建全部表。仅适用于**无重要数据**或**新库**。）

### 情况 B：**已有线上/本地业务数据**，库结构已与当前 `schema.prisma` 一致（或只差树脂订单表）

**不要**对已有库直接跑 baseline 的 `migrate deploy`（会报「表已存在」）。

1. 若库里**缺少**树脂订单等对象，先生成并执行「当前库 → 目标 schema」的增量 SQL：

```bash
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/fix_drift.sql
```

人工快速检查 `fix_drift.sql` 后执行（任选其一）：

```bash
npx prisma db execute --file prisma/fix_drift.sql --schema prisma/schema.prisma
```

2. 把基线迁移**标记为已应用**（不再次执行 SQL）：

```bash
npx prisma migrate resolve --applied 20250101000000_baseline_init
```

3. 之后日常开发可用：

```bash
npx prisma migrate dev
```

---

## 若 `_prisma_migrations` 里仍有**已删除**的旧迁移名

例如仍记录 `20250316000000_add_contract_type` 或 `20260320120000_add_resin_orders_tracker`，需在数据库中删掉这些行（或整表清空后仅保留 baseline 一条），再执行上面的 `migrate resolve --applied 20250101000000_baseline_init`。  
否则 `migrate status` 会报迁移目录与历史不一致。

---

## 验证树脂订单模块

1. 库中存在表：`ResinOrder`、`ResinOrderShipment`、`ResinOrderPayment`。
2. `npx prisma migrate status` 无 pending。
3. 打开 `/resin-orders`，能新建订单且无 Prisma 报错。
