"use server";

import { prisma } from "@/lib/prisma";
import { getExecutionStatusLabel } from "@/lib/constants/execution-status";

/** 视为“已完成”的执行状态：使用 CI 实际值参与汇总 */
const COMPLETED_EXECUTION_STATUSES = ["COMPLETED", "COMPLETED_PAID"] as const;

export type ContractSummaryMode = "month" | "year";

export type ContractSummaryParams = {
  mode: ContractSummaryMode;
  year: number;
  month?: number; // 仅 mode=month 时必填
  /** 为 true 时仅统计/导出已完成订单 */
  completedOnly?: boolean;
};

export type ContractSummaryRow = {
  contractId: string;
  contractNo: string;
  customerName: string;
  contractDate: string;
  executionStatus: string;
  /** 统计口径：理论（合同）| 实际（CI） */
  statBasis: "理论（合同）" | "实际（CI）";
  weightKg: number;
  amount: number;
  currency: string;
  /** 关联的 CI 编号，多个用逗号分隔；无则空 */
  ciNos: string;
  /** 缺少 CI 实际数据时 true（已完成但无 CI，暂用合同值） */
  missingCi: boolean;
  /** 详情页路径 */
  detailHref: string;
};

export type ContractSummaryReport = {
  /** 时间范围描述，用于标题和导出文件名 */
  rangeLabel: string;
  /** 合同总数 */
  totalCount: number;
  /** 汇总总重量（混合口径：已完成用 CI 实际，未完成用合同理论） */
  totalWeightKg: number;
  /** 汇总总金额（同上混合口径） */
  totalAmount: number;
  /** 货币 */
  currency: string;
  /** 已完成订单数 */
  completedCount: number;
  /** 未完成订单数 */
  incompleteCount: number;
  /** 已完成订单实际总重量（仅 CI 实际） */
  completedActualWeightKg: number;
  /** 已完成订单实际总金额（仅 CI 实际） */
  completedActualAmount: number;
  /** 未完成订单理论总重量 */
  incompleteTheoreticalWeightKg: number;
  /** 未完成订单理论总金额 */
  incompleteTheoreticalAmount: number;
  rows: ContractSummaryRow[];
};

function getDateRange(params: ContractSummaryParams): { start: Date; end: Date } {
  if (params.mode === "month") {
    const month = params.month ?? 1;
    const start = new Date(params.year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(params.year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }
  const start = new Date(params.year, 0, 1, 0, 0, 0, 0);
  const end = new Date(params.year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

function toDateOnlyString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 从 CI 及 items 汇总实际重量：CI 表无 totalWeight，用 items 的 actualQuantityKg 之和 */
function sumCiActualWeightKg(
  items: { actualQuantityKg: number }[],
): number {
  return items.reduce((s, i) => s + (i.actualQuantityKg ?? 0), 0);
}

/** 确保数值可序列化（避免 NaN/Infinity 导致 RSC 序列化问题） */
function safeNumber(n: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return n;
}

/**
 * 获取合同汇总报表。
 * 规则：
 * - 已完成（COMPLETED / COMPLETED_PAID）：按关联 CI 的实际金额与重量汇总；多 CI 则加总；无 CI 时用合同值并标记 missingCi。
 * - 未完成：按合同 totalAmount / totalWeight。
 */
export async function getContractSummaryReport(
  params: ContractSummaryParams,
): Promise<ContractSummaryReport> {
  try {
    if (params.mode === "month" && (params.month == null || params.month < 1 || params.month > 12)) {
      throw new Error("按月考时请选择月份 1–12");
    }
    const { start, end } = getDateRange(params);
    const rangeLabel =
      params.mode === "month"
        ? `${params.year}年${params.month}月`
        : `${params.year}年`;

    const contracts = await prisma.contract.findMany({
    where: {
      contractDate: { gte: start, lte: end },
      executionStatus: params.completedOnly
        ? { in: [...COMPLETED_EXECUTION_STATUSES] }
        : { not: "CANCELLED" },
    },
    orderBy: { contractDate: "asc" },
    include: {
      customer: { select: { id: true, nameCn: true, nameEn: true, shortName: true } },
      commercialInvoices: {
        select: {
          id: true,
          invoiceNo: true,
          totalAmount: true,
          items: { select: { actualQuantityKg: true } },
        },
      },
    },
  });

  const rows: ContractSummaryRow[] = [];
  let totalWeightKg = 0;
  let totalAmount = 0;
  let completedCount = 0;
  let incompleteCount = 0;
  let completedActualWeightKg = 0;
  let completedActualAmount = 0;
  let incompleteTheoreticalWeightKg = 0;
  let incompleteTheoreticalAmount = 0;

  const isCompleted = (status: string) =>
    COMPLETED_EXECUTION_STATUSES.includes(status as (typeof COMPLETED_EXECUTION_STATUSES)[number]);

  for (const c of contracts) {
    const statusLabel = getExecutionStatusLabel(c.executionStatus);
    const completed = isCompleted(c.executionStatus);
    const ciList = c.commercialInvoices ?? [];

    let rowWeight: number;
    let rowAmount: number;
    let statBasis: ContractSummaryRow["statBasis"];
    let missingCi = false;
    const ciNos = ciList.map((ci) => ci.invoiceNo).join(", ");

    if (completed && ciList.length > 0) {
      rowAmount = ciList.reduce((s, ci) => s + (ci.totalAmount ?? 0), 0);
      rowWeight = ciList.reduce(
        (s, ci) => s + sumCiActualWeightKg(ci.items),
        0,
      );
      statBasis = "实际（CI）";
    } else if (completed && ciList.length === 0) {
      rowAmount = c.totalAmount ?? 0;
      rowWeight = c.totalWeight ?? 0;
      statBasis = "理论（合同）";
      missingCi = true;
    } else {
      rowAmount = c.totalAmount ?? 0;
      rowWeight = c.totalWeight ?? 0;
      statBasis = "理论（合同）";
    }

    totalWeightKg += rowWeight;
    totalAmount += rowAmount;
    if (completed) {
      completedCount += 1;
      if (ciList.length > 0) {
        completedActualWeightKg += ciList.reduce(
          (s, ci) => s + sumCiActualWeightKg(ci.items),
          0,
        );
        completedActualAmount += ciList.reduce((s, ci) => s + (ci.totalAmount ?? 0), 0);
      } else {
        completedActualWeightKg += c.totalWeight ?? 0;
        completedActualAmount += c.totalAmount ?? 0;
      }
    } else {
      incompleteCount += 1;
      incompleteTheoreticalWeightKg += c.totalWeight ?? 0;
      incompleteTheoreticalAmount += c.totalAmount ?? 0;
    }

    const customerName =
      c.customer.nameCn || c.customer.nameEn || c.customer.shortName || "-";
    rows.push({
      contractId: c.id,
      contractNo: c.contractNo,
      customerName,
      contractDate: toDateOnlyString(c.contractDate),
      executionStatus: statusLabel,
      statBasis,
      weightKg: rowWeight,
      amount: rowAmount,
      currency: c.currency,
      ciNos,
      missingCi,
      detailHref: `/contracts/${c.id}`,
    });
  }

    return {
      rangeLabel,
      totalCount: contracts.length,
      totalWeightKg: safeNumber(totalWeightKg),
      totalAmount: safeNumber(totalAmount),
      currency: contracts[0]?.currency ?? "USD",
      completedCount,
      incompleteCount,
      completedActualWeightKg: safeNumber(completedActualWeightKg),
      completedActualAmount: safeNumber(completedActualAmount),
      incompleteTheoreticalWeightKg: safeNumber(incompleteTheoreticalWeightKg),
      incompleteTheoreticalAmount: safeNumber(incompleteTheoreticalAmount),
      rows,
    };
  } catch (err) {
    console.error("[getContractSummaryReport] error:", err);
    throw err;
  }
}

/** 导出文件名（不含扩展名）：按月 合同汇总_2026-03，按年 合同汇总_2026；仅已完成时加 _已完成 */
function getExportFilenameBase(params: ContractSummaryParams): string {
  let base: string;
  if (params.mode === "month" && params.month != null) {
    base = `合同汇总_${params.year}-${String(params.month).padStart(2, "0")}`;
  } else {
    base = `合同汇总_${params.year}`;
  }
  if (params.completedOnly) {
    base += "_已完成";
  }
  return base;
}

/**
 * 导出合同汇总为 CSV（UTF-8 BOM），便于用 Excel 打开。
 * 包含：汇总概览 + 明细列表；中文表头。
 */
export async function exportContractSummaryReport(
  params: ContractSummaryParams,
): Promise<{ csv: string; filename: string }> {
  const report = await getContractSummaryReport(params);
  const currency = report.currency;

  const lines: string[] = [];
  const push = (cells: (string | number)[]) => {
    const escaped = cells.map((c) => {
      const s = String(c);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    });
    lines.push(escaped.join(","));
  };

  push(["合同汇总报表", report.rangeLabel]);
  push([]);
  push(["汇总概览", ""]);
  push(["合同总数", report.totalCount]);
  push(["总重量 (kg)", report.totalWeightKg.toFixed(2)]);
  push(["总金额", report.totalAmount.toFixed(2), currency]);
  push(["已完成订单数", report.completedCount]);
  push(["未完成订单数", report.incompleteCount]);
  push(["已完成订单实际总重量 (kg)", report.completedActualWeightKg.toFixed(2)]);
  push(["已完成订单实际总金额", report.completedActualAmount.toFixed(2), currency]);
  push(["未完成订单理论总重量 (kg)", report.incompleteTheoreticalWeightKg.toFixed(2)]);
  push(["未完成订单理论总金额", report.incompleteTheoreticalAmount.toFixed(2), currency]);
  push([]);
  push([
    "合同编号",
    "客户",
    "合同日期",
    "执行状态",
    "统计口径",
    "重量(kg)",
    "金额",
    "货币",
    "CI编号",
    "缺少CI实际数据",
  ]);
  for (const r of report.rows) {
    push([
      r.contractNo,
      r.customerName,
      r.contractDate,
      r.executionStatus,
      r.statBasis,
      r.weightKg.toFixed(2),
      r.amount.toFixed(2),
      r.currency,
      r.ciNos,
      r.missingCi ? "是" : "",
    ]);
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  const filename = getExportFilenameBase(params) + ".csv";
  return { csv, filename };
}

/**
 * 导出合同汇总为 Excel (.xlsx)。
 * 与 getContractSummaryReport 同一数据口径：已完成按 CI 实际，未完成按合同理论。
 * 内容：汇总概览 + 空行 + 明细表；表头加粗，列宽合理，重量/金额两位小数。
 */
export async function exportContractSummaryExcel(
  params: ContractSummaryParams,
): Promise<{ base64?: string; filename?: string; error?: string }> {
  try {
    const report = await getContractSummaryReport(params);
    const currency = report.currency;

    const XLSX = await import("xlsx");

    const data: (string | number)[][] = [];
    data.push(["合同汇总报表", report.rangeLabel]);
    data.push([]);
    data.push(["汇总概览", ""]);
    data.push(["统计周期", report.rangeLabel]);
    data.push(["合同总数", report.totalCount]);
    data.push(["汇总总重量 (kg)", report.totalWeightKg.toFixed(2)]);
    data.push(["汇总总金额", report.totalAmount.toFixed(2), currency]);
    data.push(["已完成订单数", report.completedCount]);
    data.push(["已完成订单实际总重量 (kg)", report.completedActualWeightKg.toFixed(2)]);
    data.push(["已完成订单实际总金额", report.completedActualAmount.toFixed(2), currency]);
    data.push(["未完成订单数", report.incompleteCount]);
    data.push(["未完成订单理论总重量 (kg)", report.incompleteTheoreticalWeightKg.toFixed(2)]);
    data.push(["未完成订单理论总金额", report.incompleteTheoreticalAmount.toFixed(2), currency]);
    data.push([]);
    data.push([
      "合同编号",
      "客户",
      "合同日期",
      "执行状态",
      "统计口径",
      "重量 (kg)",
      "金额",
      "对应 CI 编号",
      "备注/说明",
    ]);
    for (const r of report.rows) {
      data.push([
        r.contractNo,
        r.customerName,
        r.contractDate,
        r.executionStatus,
        r.statBasis,
        Number(r.weightKg.toFixed(2)),
        Number(r.amount.toFixed(2)),
        r.ciNos || "",
        r.missingCi ? "缺少CI实际数据" : "",
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths = [
      { wch: 16 },
      { wch: 20 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
    ];
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "合同汇总");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const base64 = buffer.toString("base64");
    const filename = getExportFilenameBase(params) + ".xlsx";
    return { base64, filename };
  } catch (err) {
    console.error("[exportContractSummaryExcel] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

/**
 * PDF 导出已改为「打印页 + 浏览器打印/保存为 PDF」方式，不再使用 pdfkit。
 * 使用 /contracts/summary/print 页面，点击「打印 / 导出 PDF」后选择「另存为 PDF」即可。
 */
