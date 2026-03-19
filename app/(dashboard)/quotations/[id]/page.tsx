import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getQuotationById } from "@/lib/actions/quotations";
import { formatDate } from "@/lib/utils/date";
import { formatAmount } from "@/lib/numbers";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quotation = await getQuotationById(id);
  if (!quotation) notFound();

  return (
    <div className="flex flex-col">
      <Header title={quotation.quotationNo} description={`客户: ${quotation.customer?.shortName || quotation.customer?.nameEn || quotation.customer?.nameCn || "-"}`}>
        <Button asChild variant="outline">
          <Link href={`/quotations/${id}/edit`}>编辑</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/quotations">返回列表</Link>
        </Button>
        <Button variant="outline" size="sm" disabled>
          导出 PDF（预留）
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">报价单号</p>
              <p className="font-medium">{quotation.quotationNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">状态</p>
              <Badge variant="secondary">{quotation.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">客户</p>
              <p className="font-medium">
                {quotation.customer?.shortName || quotation.customer?.nameEn || quotation.customer?.nameCn || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">报价日期</p>
              <p className="font-medium">{formatDate(quotation.quotationDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">有效期至</p>
              <p className="font-medium">{formatDate(quotation.validUntil)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">币种</p>
              <p className="font-medium">{quotation.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">付款条款</p>
              <p className="font-medium text-sm">{quotation.paymentTerm ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">贸易条款</p>
              <p className="font-medium">{quotation.incoterm ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">合计</p>
              <p className="font-medium">{formatAmount(quotation.totalAmount, quotation.currency)}</p>
            </div>
            {quotation.remark && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">备注</p>
                <p className="font-medium">{quotation.remark}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>明细</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产品名称</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>单价</TableHead>
                  <TableHead>卷数</TableHead>
                  <TableHead>数量(kg)</TableHead>
                  <TableHead>金额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>
                      {[item.thickness, item.width, item.length].filter(Boolean).join(" / ") || "-"}
                    </TableCell>
                    <TableCell>{item.unitPrice}</TableCell>
                    <TableCell>{item.rollQty}</TableCell>
                    <TableCell>{item.quantityKg}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
