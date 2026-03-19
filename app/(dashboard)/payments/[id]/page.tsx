import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { formatAmount } from "@/lib/numbers";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await prisma.payment.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!p) notFound();

  return (
    <div className="flex flex-col">
      <Header title={p.paymentNo} description={`客户: ${p.customer?.shortName || p.customer?.nameEn || "-"}`}>
        <Button asChild variant="outline">
          <Link href="/payments">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">收款单号</p><p className="font-medium">{p.paymentNo}</p></div>
            <div><p className="text-sm text-muted-foreground">客户</p><p className="font-medium">{p.customer?.shortName || p.customer?.nameEn || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">日期</p><p className="font-medium">{formatDate(p.paymentDate)}</p></div>
            <div><p className="text-sm text-muted-foreground">金额</p><p className="font-medium">{formatAmount(p.amount, p.currency)}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
