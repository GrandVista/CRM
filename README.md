# 景峻 CRM - 外贸业务管理系统

适用于外贸/贸易/包装材料行业的轻量 ERP，管理客户、产品、报价单、PI、合同、CL、出货与收款。

## 技术栈

- **Next.js 15** (App Router)
- **TypeScript**
- **React 19**
- **Tailwind CSS 3** + shadcn/ui 风格组件
- **Prisma** + **PostgreSQL**

## 快速开始

### 1. 环境变量

复制 `.env.example` 为 `.env`，并填写 PostgreSQL 连接：

```bash
cp .env.example .env
# 编辑 .env，设置 DATABASE_URL="postgresql://用户:密码@localhost:5432/crm_erp"
```

### 2. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 3. 数据库

```bash
npx prisma generate
npx prisma db push
npm run db:seed   # 可选：写入示例客户与产品（需先安装 ts-node）
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000，将跳转到 `/dashboard`。

## 项目结构

```
├── app/
│   ├── (dashboard)/          # 后台布局组
│   │   ├── layout.tsx        # 侧边栏 + 主内容区
│   │   ├── dashboard/        # 仪表盘
│   │   ├── customers/        # 客户管理（完整 CRUD）
│   │   ├── products/         # 产品管理（完整 CRUD）
│   │   ├── quotations/       # 报价单（列表/新建/编辑/详情）
│   │   ├── pi/               # PI 列表与详情
│   │   ├── contracts/        # 合同列表
│   │   ├── cl/               # CL/装箱单列表与详情
│   │   ├── shipments/        # 出货记录列表与详情
│   │   ├── payments/         # 收款记录列表与详情
│   │   └── settings/         # 设置占位
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── layout/               # 侧边栏、Header
│   ├── ui/                   # Button, Card, Input, Table, Badge, Select 等
│   ├── customers/            # 客户表单、搜索、删除
│   ├── products/             # 产品表单、搜索、删除
│   └── quotations/           # 报价单表单（含明细行）
├── lib/
│   ├── prisma.ts             # Prisma 单例
│   ├── utils.ts              # cn()
│   ├── numbers.ts            # 金额/重量/卷数计算与格式化
│   ├── doc-no.ts             # 单据编号生成（QT/PI/CT/CL/SH/PA）
│   └── actions/              # Server Actions
│       ├── customers.ts
│       ├── products.ts
│       └── quotations.ts
├── prisma/
│   ├── schema.prisma         # 数据模型与枚举
│   └── seed.ts               # 示例数据
└── types/
    └── index.ts
```

## 已实现功能

- **Dashboard**：本月/本年合同与回款金额、未完成合同与未收款、最近合同列表
- **客户**：列表、搜索/筛选、新建、编辑、详情、删除；详情页展示报价单/合同/收款
- **产品**：列表、搜索、新建、编辑、详情、删除
- **报价单**：列表、新建（带客户/产品选择与多行明细）、编辑、详情；自动编号与金额汇总
- **PI / 合同 / CL / 出货 / 收款**：列表与详情占位，预留「从报价单生成 PI」「从合同生成 CL」等扩展点

## 合同执行状态枚举

- `DRAFT` → `SENT` → `CONFIRMED` → `PENDING_PAYMENT` → `PAID` → `IN_PRODUCTION` → `READY_TO_SHIP` → `SHIPPED` → `DOCUMENT_COMPLETED` → `PARTIALLY_RECEIVED` / `FULLY_RECEIVED` → `COMPLETED` / `CANCELLED`  
- 签署状态：`UNSIGNED` / `SIGNED` / `VOIDED`

## 后续可扩展

- 从报价单生成 PI、从报价单/PI 生成合同、从合同生成 CL
- 合同详情页：基本信息、明细、出货记录、收款记录、执行日志
- 合同/报价单/PI/CL 导出 PDF（已预留按钮与模板化结构）
- 月度/年度汇总报表与图表（Dashboard 已预留组件接口）

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发（Turbopack） |
| `npm run build` | 生产构建 |
| `npm run start` | 生产启动 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步 schema 到数据库 |
| `npm run db:seed` | 执行 seed（需 ts-node） |
| `npm run db:studio` | 打开 Prisma Studio |
