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
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/numbers";
import { formatDate } from "@/lib/utils/date";

export default async function PaymentsPage() {
  const list = await prisma.payment.findMany({
    orderBy: { paymentDate: "desc" },
    include: { customer: { select: { shortName: true, nameEn: true } } },
  });

  return (
    <div className="flex flex-col">
      <Header title="收款记录" description="Payments">
        <Button asChild>
          <Link href="/payments/new">新建收款</Link>
        </Button>
      </Header>
      <div className="p-6">
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>收款单号</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>金额</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    暂无收款记录
                  </TableCell>
                </TableRow>
              ) : (
                list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.paymentNo}</TableCell>
                    <TableCell>{row.customer?.shortName || row.customer?.nameEn || "-"}</TableCell>
                    <TableCell>{formatDate(row.paymentDate)}</TableCell>
                    <TableCell>{formatAmount(row.amount, row.currency)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/payments/${row.id}`}>详情</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
