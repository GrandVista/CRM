"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAmount, formatWeight } from "@/lib/numbers";
import { ContractSummaryTable } from "./contract-summary-table";
import { exportContractSummaryExcel } from "@/lib/actions/contract-summary";
import type { ContractSummaryReport, ContractSummaryParams } from "@/lib/actions/contract-summary";
import { FileSpreadsheet, FileText } from "lucide-react";

function downloadBase64(base64: string, filename: string, mimeType: string) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ContractSummaryReport({
  report,
  params,
}: {
  report: ContractSummaryReport;
  params: ContractSummaryParams;
}) {
  const [isExportingExcel, startExportExcel] = useTransition();
  const { currency } = report;

  function handleExportExcel() {
    startExportExcel(async () => {
      const result = await exportContractSummaryExcel(params);
      if ("error" in result && result.error) {
        console.error("[export Excel]", result.error);
        alert("导出失败：" + result.error);
        return;
      }
      if (result.base64 && result.filename) {
        downloadBase64(
          result.base64,
          result.filename,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
      }
    });
  }

  function getPrintUrl(): string {
    const q = new URLSearchParams();
    q.set("mode", params.mode);
    q.set("year", String(params.year));
    if (params.mode === "month" && params.month != null) q.set("month", String(params.month));
    if (params.completedOnly) q.set("completedOnly", "1");
    return `/contracts/summary/print?${q.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* 顶部导出按钮 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={isExportingExcel}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {isExportingExcel ? "导出中..." : "导出 Excel"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={getPrintUrl()} target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4 mr-2" />
            导出 PDF
          </a>
        </Button>
      </div>

      {/* 总览卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">合同总数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.totalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">份</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总重量</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatWeight(report.totalWeightKg)}</p>
            <p className="text-xs text-muted-foreground mt-1">混合口径（已完成按 CI 实际，未完成按合同理论）</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总金额</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(report.totalAmount, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">混合口径</p>
          </CardContent>
        </Card>
      </div>

      {/* 明细拆分 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已完成（按 CI 实际）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>数量：{report.completedCount} 份</p>
            <p>重量：{formatWeight(report.completedActualWeightKg)}</p>
            <p>金额：{formatAmount(report.completedActualAmount, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">未完成（按合同理论）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>数量：{report.incompleteCount} 份</p>
            <p>重量：{formatWeight(report.incompleteTheoreticalWeightKg)}</p>
            <p>金额：{formatAmount(report.incompleteTheoreticalAmount, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 明细表 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">明细列表</h3>
        <ContractSummaryTable rows={report.rows} />
      </div>
    </div>
  );
}
