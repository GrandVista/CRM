import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getContractSummaryReport } from "@/lib/actions/contract-summary";
import { ContractSummaryFilters } from "@/components/contracts/contract-summary-filters";
import { ContractSummaryReport } from "@/components/contracts/contract-summary-report";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

export default async function ContractSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; year?: string; month?: string; completedOnly?: string }>;
}) {
  const params = await searchParams;
  const mode = (params.mode === "year" ? "year" : "month") as "month" | "year";
  const year = params.year ? parseInt(params.year, 10) : CURRENT_YEAR;
  const month = params.month ? parseInt(params.month, 10) : CURRENT_MONTH;
  const completedOnly = params.completedOnly === "1" || params.completedOnly === "true";

  const hasValidParams =
    Number.isFinite(year) &&
    year >= 2000 &&
    year <= 2100 &&
    (mode !== "month" || (Number.isFinite(month) && month >= 1 && month <= 12));

  let report: Awaited<ReturnType<typeof getContractSummaryReport>> | null = null;
  let loadError: string | null = null;
  if (hasValidParams) {
    try {
      report = await getContractSummaryReport({
        mode,
        year,
        ...(mode === "month" && { month }),
        completedOnly,
      });
    } catch (err) {
      console.error("[contracts/summary] getContractSummaryReport failed:", err);
      loadError = err instanceof Error ? err.message : "汇总数据加载失败";
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="合同汇总" description="按时间范围汇总合同数量、重量与金额，支持导出报表">
        <Button variant="outline" asChild>
          <Link href="/contracts">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        <ContractSummaryFilters
          defaultMode={mode}
          defaultYear={year}
          defaultMonth={month}
          defaultCompletedOnly={completedOnly}
        />
        {loadError ? (
          <p className="text-destructive">
            汇总数据加载失败：{loadError}
          </p>
        ) : report ? (
          <>
            <p className="text-sm text-muted-foreground">
              汇总范围：{report.rangeLabel}
            </p>
            <ContractSummaryReport
              report={report}
              params={{ mode, year, ...(mode === "month" && { month }), completedOnly }}
            />
          </>
        ) : (
          <p className="text-muted-foreground">
            请选择统计维度与时间范围后点击「查询」查看汇总结果。
          </p>
        )}
      </div>
    </div>
  );
}
