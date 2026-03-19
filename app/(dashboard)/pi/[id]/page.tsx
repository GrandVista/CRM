import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { formatAmount } from "@/lib/numbers";

export default async function PiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pi = await prisma.proformaInvoice.findUnique({
    where: { id },
    include: { customer: true, piItems: true },
  });
  if (!pi) notFound();

  return (
    <div className="flex flex-col">
      <Header title={pi.piNo} description={`客户: ${pi.customer?.shortName || pi.customer?.nameEn || "-"}`}>
        <Button variant="outline" size="sm" disabled>导出 PDF（预留）</Button>
        <Button asChild variant="outline">
          <Link href="/pi">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">PI 编号</p><p className="font-medium">{pi.piNo}</p></div>
            <div><p className="text-sm text-muted-foreground">客户</p><p className="font-medium">{pi.customer?.shortName || pi.customer?.nameEn || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">日期</p><p className="font-medium">{formatDate(pi.issueDate)}</p></div>
            <div><p className="text-sm text-muted-foreground">合计</p><p className="font-medium">{formatAmount(pi.totalAmount, pi.currency)}</p></div>
          </CardContent>
        </Card>
        {pi.piItems.length > 0 && (
          <Card>
            <CardHeader><CardTitle>明细</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {pi.piItems.map((i) => (
                  <li key={i.id}>{i.productName} × {i.quantityKg || i.rollQty} = {i.amount}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
