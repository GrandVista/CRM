import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/numbers";
import { getPendingPiTodos } from "@/lib/actions/document-todos";
import { formatDate } from "@/lib/utils/date";
import { CompleteTodoButton } from "@/components/document-todos/complete-todo-button";

export default async function PiListPage() {
  const [list, pendingTodos] = await Promise.all([
    prisma.proformaInvoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { shortName: true, nameEn: true, nameCn: true } } },
    }),
    getPendingPiTodos(),
  ]);

  const customerName = (c: { shortName: string | null; nameEn: string | null; nameCn: string | null } | null) =>
    c?.shortName || c?.nameEn || c?.nameCn || "—";

  return (
    <div className="flex flex-col">
      <Header title="Proforma Invoices" description="PI 列表">
        <Button asChild>
          <Link href="/pi/new">新建 PI</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        {pendingTodos.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">待处理 PI 合同</h2>
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
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/contracts/${t.contractId}`}>生成 PI</Link>
                        </Button>
                        <CompleteTodoButton todoId={t.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">PI 列表</h2>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PI 编号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无 PI
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.piNo}</TableCell>
                      <TableCell>{p.customer?.shortName || p.customer?.nameEn || p.customer?.nameCn || "-"}</TableCell>
                      <TableCell>{formatDate(p.issueDate)}</TableCell>
                      <TableCell>{formatAmount(p.totalAmount, p.currency)}</TableCell>
                      <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/pi/${p.id}`}>详情</Link>
                        </Button>
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
