import { notFound } from "next/navigation";
import { getContractSummaryReport } from "@/lib/actions/contract-summary";
import { formatAmount, formatWeight } from "@/lib/numbers";
import { ContractSummaryPrintClient } from "@/components/contracts/contract-summary-print-client";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

export default async function ContractSummaryPrintPage({
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

  if (!hasValidParams) notFound();

  const report = await getContractSummaryReport({
    mode,
    year,
    ...(mode === "month" && { month }),
    completedOnly,
  });

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .min-h-screen > *:first-child { display: none !important; }
              .min-h-screen > main { padding-left: 0 !important; }
              .no-print { display: none !important; }
            }
          `,
        }}
      />
      <div className="contract-summary-print p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-bold mb-2">合同汇总报表</h1>
        <p className="text-sm text-muted-foreground mb-1">统计周期：{report.rangeLabel}</p>
        <p className="text-sm text-muted-foreground mb-6">
          范围：{completedOnly ? "仅已完成订单" : "全部订单"}
        </p>

        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3">汇总概览</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="py-1.5 font-medium">合同总数</td>
                <td className="py-1.5">{report.totalCount}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">汇总总重量 (kg)</td>
                <td className="py-1.5">{report.totalWeightKg.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">汇总总金额</td>
                <td className="py-1.5">{formatAmount(report.totalAmount, report.currency)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">已完成订单数</td>
                <td className="py-1.5">{report.completedCount}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">已完成订单实际总重量 (kg)</td>
                <td className="py-1.5">{report.completedActualWeightKg.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">已完成订单实际总金额</td>
                <td className="py-1.5">{formatAmount(report.completedActualAmount, report.currency)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">未完成订单数</td>
                <td className="py-1.5">{report.incompleteCount}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">未完成订单理论总重量 (kg)</td>
                <td className="py-1.5">{report.incompleteTheoreticalWeightKg.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">未完成订单理论总金额</td>
                <td className="py-1.5">{formatAmount(report.incompleteTheoreticalAmount, report.currency)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3">明细列表</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-2 text-left font-medium">合同编号</th>
                  <th className="border border-border px-2 py-2 text-left font-medium">客户</th>
                  <th className="border border-border px-2 py-2 text-left font-medium">合同日期</th>
                  <th className="border border-border px-2 py-2 text-left font-medium">执行状态</th>
                  <th className="border border-border px-2 py-2 text-left font-medium">统计口径</th>
                  <th className="border border-border px-2 py-2 text-right font-medium">重量 (kg)</th>
                  <th className="border border-border px-2 py-2 text-right font-medium">金额</th>
                  <th className="border border-border px-2 py-2 text-left font-medium">CI编号</th>
                  <th className="border border-border px-2 py-2 text-left font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-border px-2 py-4 text-center text-muted-foreground">
                      该时间范围内暂无合同
                    </td>
                  </tr>
                ) : (
                  report.rows.map((r, idx) => (
                    <tr key={r.contractId} className={idx % 2 === 1 ? "bg-muted/50" : ""}>
                      <td className="border border-border px-2 py-1.5">{r.contractNo}</td>
                      <td className="border border-border px-2 py-1.5">{r.customerName}</td>
                      <td className="border border-border px-2 py-1.5">{r.contractDate}</td>
                      <td className="border border-border px-2 py-1.5">{r.executionStatus}</td>
                      <td className="border border-border px-2 py-1.5">
                        {r.statBasis}
                        {r.missingCi && (
                          <span className="text-amber-600 ml-1">(缺少CI实际数据)</span>
                        )}
                      </td>
                      <td className="border border-border px-2 py-1.5 text-right">
                        {formatWeight(r.weightKg)}
                      </td>
                      <td className="border border-border px-2 py-1.5 text-right">
                        {formatAmount(r.amount, r.currency)}
                      </td>
                      <td className="border border-border px-2 py-1.5">{r.ciNos || "—"}</td>
                      <td className="border border-border px-2 py-1.5">
                        {r.missingCi ? "缺少CI实际数据" : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <ContractSummaryPrintClient />
      </div>
    </>
  );
}
