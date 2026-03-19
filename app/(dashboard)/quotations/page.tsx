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
import { Badge } from "@/components/ui/badge";
import { getQuotations } from "@/lib/actions/quotations";
import { formatDate } from "@/lib/utils/date";
import { formatAmount } from "@/lib/numbers";

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const quotations = await getQuotations({
    search: params.search,
    status: params.status,
  });

  return (
    <div className="flex flex-col">
      <Header title="报价单" description="报价单列表">
        <Button asChild>
          <Link href="/quotations/new">新建报价单</Link>
        </Button>
      </Header>
      <div className="p-6">
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报价单号</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无报价单
                  </TableCell>
                </TableRow>
              ) : (
                quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.quotationNo}</TableCell>
                    <TableCell>
                      {q.customer?.shortName || q.customer?.nameEn || q.customer?.nameCn || "-"}
                    </TableCell>
                    <TableCell>{formatDate(q.quotationDate)}</TableCell>
                    <TableCell>{formatAmount(q.totalAmount, q.currency)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{q.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/quotations/${q.id}`}>详情</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/quotations/${q.id}/edit`}>编辑</Link>
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
