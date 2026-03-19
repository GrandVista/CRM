# Prisma 数据库连接排查与恢复

## 一、先检查配置

### 1. 需要检查的 .env 变量

| 变量 | 是否必填 | 说明 |
|------|----------|------|
| **DATABASE_URL** | 必填 | 应用和 Prisma 使用的连接串，当前用于连接 Supabase。 |
| **DIRECT_URL** | 可选 | 若使用 Supabase Pooler，迁移/推送建议用直连；项目当前 schema 未使用，可后续加。 |

### 2. 重点检查项

- **DATABASE_URL**
  - 格式必须为：`postgresql://[用户]:[密码]@[主机]:[端口]/[数据库名]?[查询参数]`
  - 密码中若有 `@`、`#`、`%` 等需 URL 编码（如 `@` → `%40`）。
  - 当前你使用的是 **pooler 地址**：`aws-1-us-east-1.pooler.supabase.com:5432`。

- **DIRECT_URL**
  - 项目当前 **未** 在 `prisma/schema.prisma` 的 `datasource` 里使用。
  - 若 P1001 持续出现，可改用 Supabase 的 **直连串** 作为 `DATABASE_URL` 做一次 `db push`，再视情况改回 pooler。

### 3. Supabase 连接串格式

- **Pooler（Session mode，端口 5432）**  
  `postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres`
- **Pooler（Transaction mode，端口 6543）**  
  同上，端口改为 `6543`。
- **Direct（直连，用于迁移/长时间连接）**  
  在 Supabase 后台：Project Settings → Database → **Connection string** 选 **URI**，复制 **“Direct connection”**（或 Host 为 `db.xxx.supabase.co` 的那一个），不要用带 `pooler` 的。

### 4. 当前是否用了 Pooler？

是。当前 `.env` 里是：

- 主机：`aws-1-us-east-1.pooler.supabase.com`
- 端口：`5432`

说明走的是 Supabase 的 **Session mode pooler**。

### 5. Pooler 与 Direct 使用场景

| 类型 | 适用场景 | 说明 |
|------|----------|------|
| **Pooler (5432/6543)** | 应用运行时、Serverless、短连接 | 连接数受限时用连接池，避免占满 DB。 |
| **Direct** | `prisma migrate` / `prisma db push`、长事务、建表/改表 | 不经 PgBouncer，部分 DDL 和迁移在直连下更稳定。 |

**建议**：应用用 pooler；做 schema 同步（migrate / db push）时若 P1001，可临时把 `DATABASE_URL` 换成 Supabase 的 **Direct connection** 再执行。

---

## 二、Terminal 检查步骤（按顺序执行）

### 步骤 1：查看 .env 是否存在且被加载

```bash
cd /Users/kwankitth/Desktop/景峻CRM/1
test -f .env && echo "OK: .env 存在" || echo "FAIL: .env 不存在"
# 只检查变量名是否存在（不打印值）
grep -q "DATABASE_URL" .env && echo "OK: DATABASE_URL 已设置" || echo "FAIL: 未设置 DATABASE_URL"
```

**预期**：两行都是 `OK`。  
**失败**：创建 `.env` 或补全 `DATABASE_URL`。

---

### 步骤 2：检查 DATABASE_URL 格式（不打印密码）

```bash
cd /Users/kwankitth/Desktop/景峻CRM/1
# 检查是否以 postgresql:// 开头且包含 @ 和 :5432（不输出具体内容）
grep "^DATABASE_URL=" .env | grep -q "postgresql://" && grep "^DATABASE_URL=" .env | grep -q "@.*:5432" && echo "OK: DATABASE_URL 格式类似 postgresql://...@host:5432/..." || echo "FAIL: 请检查 DATABASE_URL 是否为 postgresql://用户:密码@主机:5432/数据库"
```

**预期**：`OK: DATABASE_URL 格式类似 postgresql://...@host:5432/...`  
**失败**：检查 `.env` 里 `DATABASE_URL` 是否以 `postgresql://` 开头、是否包含 `@` 和 `:5432`、是否被引号包成一行、是否有换行或多余空格。

---

### 步骤 3：测试网络连通性（能否访问 Supabase 主机与端口）

```bash
# 测试 DNS 与端口（不暴露密码）
nc -zv aws-1-us-east-1.pooler.supabase.com 5432 2>&1 || true
# 若没有 nc，可用：
# curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://aws-1-us-east-1.pooler.supabase.com 2>/dev/null || echo "timeout"
```

**预期**：`Connection to aws-1-us-east-1.pooler.supabase.com port 5432 [tcp/postgresql] succeeded!` 或类似。  
**失败**：网络或防火墙问题；或 Supabase 项目暂停/被限制（见第三节）。

---

### 步骤 4：用 Prisma 测试连接（仅验证能否连上）

```bash
cd /Users/kwankitth/Desktop/景峻CRM/1
echo "SELECT 1 as ok;" | npx prisma db execute --schema=./prisma/schema.prisma --stdin
```

**预期**：无报错，或输出包含查询结果。  
**失败**：若为 **P1001**，表示 Prisma 连不上数据库，需结合步骤 3 和 Supabase 后台一起查（见第三节、第四节）。

---

### 步骤 5：数据库恢复后再做 Schema 同步（见第四节）

先完成「三、Supabase 后台检查」和「四、数据库恢复后要执行的命令」，再执行步骤 5。

---

## 三、Supabase 后台检查步骤

1. **Project 是否暂停 / 休眠**
   - 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
   - 找到项目（例如 ref 含 `ozelmaajyojnqefljmou`）。
   - 若项目显示 **Paused**，点击 **Restore project** 恢复后再试连接。

2. **数据库连接信息是否变更**
   - 进入 **Project Settings → Database**。
   - 查看 **Connection string**：
     - **URI**：复制 **Session pooler**（当前用的）和 **Direct connection** 各一份。
   - 确认密码与 `.env` 中一致（若曾改过数据库密码，需更新 `.env`）。
   - 确认 **Host / Port** 与 `.env` 中一致（例如 `aws-1-us-east-1.pooler.supabase.com`、`5432`）。

3. **是否改用 Direct connection 做迁移**
   - 若 **P1001** 仅在做 `prisma migrate` 或 `prisma db push` 时出现：
     - 把 **Connection string → URI → Direct connection** 复制到 `.env` 的 `DATABASE_URL`。
     - 再执行一次 `npx prisma db push`。
   - 成功后若要继续用 pooler 跑应用，可把 `DATABASE_URL` 改回 **Session pooler** 的 URI。

4. **是否有 IP / 网络限制**
   - **Project Settings → Database** 中查看是否有 **Restrict connections** / **Network** 等选项。
   - 若启用了 IP 白名单，确保你当前出口 IP 或部署环境 IP 在允许列表中。
   - 免费项目通常无 IP 限制，但需确认项目未暂停。

---

## 四、数据库恢复后要执行的命令（按顺序）

连接恢复后，在项目根目录执行：

```bash
cd /Users/kwankitth/Desktop/景峻CRM/1

# 1. 将 schema 同步到数据库（创建/更新表与枚举，如 ContractType、contractType）
npx prisma db push

# 2. 重新生成 Prisma Client（保证类型与 schema 一致）
npx prisma generate

# 3. 启动开发服务器
npm run dev
```

**预期**：
- `db push`：输出 `Your database is now in sync with your schema.` 或列出已应用的变更。
- `generate`：`Generated Prisma Client ...`
- `npm run dev`：Next 正常启动，访问合同相关页面不再出现 `Contract.contractType does not exist`。

**若 `db push` 仍报 P1001**：  
- 将 `.env` 的 `DATABASE_URL` 临时改为 Supabase 的 **Direct connection**，再执行上述 1→2→3。  
**若报权限错误**：  
- 确认该数据库用户有 `CREATE TYPE`、`ALTER TABLE`、`CREATE TABLE` 等权限（Supabase 默认 postgres 用户具备）。

---

## 五、代码已使用但数据库可能尚未同步的字段/类型（一次性检查用）

以下均在当前 `prisma/schema.prisma` 中，若你从未成功执行过 `db push` 或 `migrate`，数据库中可能缺少对应列或枚举，需要按「四」执行 `db push` 后才会一致。

### Contract 表

| 字段 / 类型 | 说明 |
|-------------|------|
| **contractType**（枚举 **ContractType**） | FILM / RESIN，默认 FILM。 |
| **paymentMethod**（枚举 **PaymentMethod**） | TT / LC。 |
| **depositRatio** | Float，订金比例。 |
| **moreOrLessPercent** | Float，More or Less 条款比例。 |

### 其他表（若 schema 曾改过且未同步，也需一起同步）

- **CommercialInvoice**：paymentMethod、depositRatio 等（若你改过 schema）。
- 所有 **枚举**：ContractType、PaymentMethod、AllowOption、SignStatus、ExecutionStatus、CustomerStatus、QuotationStatus、PiStatus、ShipmentStatus、TemplateType、TodoType、TodoStatus 等，会在 `db push` 时按 schema 创建或更新。

**建议**：在连接恢复后执行 **一次** `npx prisma db push`，让当前完整 schema（含上述所有字段与枚举）与数据库一致，再 `prisma generate` 和 `npm run dev`。

---

## 六、检查清单与失败排查速查

### 检查清单

- [ ] `.env` 存在且含 `DATABASE_URL`。
- [ ] `DATABASE_URL` 格式正确（`postgresql://...`），密码特殊字符已 URL 编码。
- [ ] 能 ping 或 `nc -zv` 到 Supabase 主机和 5432 端口。
- [ ] Supabase 项目未暂停，已恢复则等待 1～2 分钟再试。
- [ ] 若用 pooler 仍 P1001，尝试改用 **Direct connection** 做 `db push`。
- [ ] 执行过 `npx prisma db push` 且成功。
- [ ] 执行过 `npx prisma generate`。
- [ ] 重启 `npm run dev` 后合同页不再报 `contractType does not exist`。

### 预期结果速查

| 步骤 | 命令/动作 | 成功时 |
|------|-----------|--------|
| 1 | 检查 .env | `OK: .env 存在`、`OK: DATABASE_URL 已设置` |
| 2 | 检查 URL 格式 | `OK: 主机= ... 端口= 5432 ...` |
| 3 | 网络 | `succeeded` 或端口可连 |
| 4 | `prisma db execute --stdin` | 无 P1001，查询执行成功 |
| 5 | `prisma db push` | `Your database is now in sync with your schema.` |
| 6 | `prisma generate` | `Generated Prisma Client` |
| 7 | `npm run dev` | 合同页无 contractType 列错误 |

### 失败时怎么排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| P1001: Can't reach database server | 项目暂停、网络/防火墙、错误主机或端口 | 恢复项目、检查网络/端口、改用 Direct 连接、核对 Supabase 连接串。 |
| 列不存在 (contractType / paymentMethod / …) | schema 未同步到数据库 | 连接正常后执行 `npx prisma db push`，再 `generate` 和重启 dev。 |
| 认证失败 (password / auth) | 密码错误或未编码 | 核对 Supabase Database 密码，`@` 等改为 `%40` 等。 |
| URL 格式错误 | .env 里换行、引号、多空格 | 保证 `DATABASE_URL="postgresql://..."` 单行、无多余换行。 |
| db push 成功但页面仍报错 | Client 未更新或未重启 | 再执行 `npx prisma generate` 并重启 `npm run dev`。 |

---

文档位置：`docs/PRISMA_DB_CONNECTION_TROUBLESHOOTING.md`。按「二」做 Terminal 检查，按「三」看 Supabase，按「四」在数据库恢复后执行同步与启动。
