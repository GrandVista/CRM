import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getContracts } from "@/lib/actions/contracts";
import { ContractsSearchForm } from "@/components/contracts/contracts-search-form";
import { ContractListRow } from "@/components/contracts/contract-list-row";
import { getCurrentAuthUser } from "@/lib/server-auth";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; signStatus?: string; executionStatus?: string }>;
}) {
  const params = await searchParams;
  const contracts = await getContracts({
    search: params.search,
    signStatus: params.signStatus,
    executionStatus: params.executionStatus,
  });
  const currentUser = await getCurrentAuthUser();
  const currentUserRole = currentUser?.role ?? "staff";

  return (
    <div className="flex flex-col">
      <Header title="合同" description="合同列表">
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/contracts/summary">汇总 / 导出报表</Link>
          </Button>
          <Button asChild>
            <Link href="/contracts/new">新建合同</Link>
          </Button>
        </div>
      </Header>
      <div className="p-6 space-y-4">
        <ContractsSearchForm
          defaultSearch={params.search}
          defaultSignStatus={params.signStatus}
          defaultExecutionStatus={params.executionStatus}
        />
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>合同编号</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>签署状态</TableHead>
                <TableHead>执行状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    暂无合同
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => (
                  <ContractListRow key={c.id} contract={c} currentUserRole={currentUserRole} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
