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
import { getPackingLists } from "@/lib/actions/packing-lists";
import { getPendingClTodos } from "@/lib/actions/document-todos";
import { formatDate } from "@/lib/utils/date";
import { CreatePlFromContractButton } from "@/components/packing-lists/create-pl-from-contract-button";
import { DeletePlButton } from "@/components/packing-lists/delete-pl-button";
import { formatAmount } from "@/lib/numbers";

export default async function ClListPage() {
  const [list, pendingTodos] = await Promise.all([
    getPackingLists(),
    getPendingClTodos(),
  ]);

  const customerName = (c: { shortName: string | null; nameEn: string | null; nameCn: string | null } | null) =>
    c?.shortName || c?.nameEn || c?.nameCn || "—";

  return (
    <div className="flex flex-col">
      <Header title="Packing Lists" description="装箱单列表">
        <Button asChild>
          <Link href="/cl/new">新建 PL</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        {pendingTodos.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">待处理 Packing List</h2>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>合同编号</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>合同日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTodos.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.contract?.contractNo ?? "—"}</TableCell>
                      <TableCell>{t.contract ? customerName(t.contract.customer) : "—"}</TableCell>
                      <TableCell>{formatDate(t.contract?.contractDate)}</TableCell>
                      <TableCell>
                        {t.contract ? formatAmount(t.contract.totalAmount, t.contract.currency) : "—"}
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <CreatePlFromContractButton contractId={t.contractId} />
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/contracts/${t.contractId}`}>查看合同</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">Packing List 列表</h2>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead>PL 编号</TableHead>
                <TableHead>合同编号</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>总卷数</TableHead>
                <TableHead>总净重(kg)</TableHead>
                <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      暂无 PL，可从上方待处理合同生成
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.clNo}</TableCell>
                      <TableCell>{row.contract?.contractNo ?? "-"}</TableCell>
                      <TableCell>{row.customer ? customerName(row.customer) : "—"}</TableCell>
                      <TableCell>{formatDate(row.documentDate ?? row.shipmentDate)}</TableCell>
                      <TableCell>{row.totalRolls ?? "-"}</TableCell>
                      <TableCell>{row.totalNetWeight ?? row.netWeight ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/cl/${row.id}`}>详情</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/cl/${row.id}/edit`}>编辑</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/cl/${row.id}/print`} target="_blank" rel="noopener noreferrer">打印</Link>
                        </Button>
                        <DeletePlButton id={row.id} clNo={row.clNo} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
