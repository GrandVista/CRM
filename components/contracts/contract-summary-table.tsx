"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatWeight } from "@/lib/numbers";
import type { ContractSummaryRow } from "@/lib/actions/contract-summary";

export function ContractSummaryTable({ rows }: { rows: ContractSummaryRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border py-8 text-center text-muted-foreground">
        该时间范围内暂无合同
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>合同编号</TableHead>
            <TableHead>客户</TableHead>
            <TableHead>合同日期</TableHead>
            <TableHead>执行状态</TableHead>
            <TableHead>统计口径</TableHead>
            <TableHead className="text-right">重量</TableHead>
            <TableHead className="text-right">金额</TableHead>
            <TableHead>CI 编号</TableHead>
            <TableHead className="text-right">详情</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.contractId}>
              <TableCell className="font-medium">{r.contractNo}</TableCell>
              <TableCell>{r.customerName}</TableCell>
              <TableCell>{r.contractDate}</TableCell>
              <TableCell>
                <Badge variant="secondary">{r.executionStatus}</Badge>
              </TableCell>
              <TableCell>
                {r.statBasis}
                {r.missingCi && (
                  <span className="ml-1 text-xs text-amber-600">(缺少CI实际数据)</span>
                )}
              </TableCell>
              <TableCell className="text-right">{formatWeight(r.weightKg)}</TableCell>
              <TableCell className="text-right">{formatAmount(r.amount, r.currency)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.ciNos || "—"}</TableCell>
              <TableCell className="text-right">
                <Link
                  href={r.detailHref}
                  className="text-primary hover:underline text-sm"
                >
                  详情
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
