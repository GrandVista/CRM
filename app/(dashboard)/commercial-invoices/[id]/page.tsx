import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCommercialInvoiceById } from "@/lib/actions/commercial-invoices";
import { getCustomerDisplayName } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { formatAmount } from "@/lib/numbers";

export default async function CommercialInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ci = await getCommercialInvoiceById(id);
  if (!ci) notFound();

  const buyerName = ci.buyerName || getCustomerDisplayName(ci.customer ?? null) || "—";

  return (
    <div className="flex flex-col">
      <Header title={ci.invoiceNo} description="Commercial Invoice 详情">
        <Button asChild variant="outline">
          <Link href={`/commercial-invoices/${id}/edit`}>编辑</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/commercial-invoices/${id}/print`} target="_blank" rel="noopener noreferrer">
            打印 / 导出 PDF
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/commercial-invoices">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">发票号：</span>{ci.invoiceNo}</div>
            <div><span className="text-muted-foreground">发票日期：</span>{formatDate(ci.invoiceDate)}</div>
            <div><span className="text-muted-foreground">合同编号：</span>{ci.contract?.contractNo ?? "—"}</div>
            <div><span className="text-muted-foreground">客户：</span>{buyerName}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">地址：</span>{ci.buyerAddress ?? "—"}</div>
            {ci.paymentMethod && (
              <>
                <div><span className="text-muted-foreground">付款方式：</span>{ci.paymentMethod === "TT" ? "T/T" : ci.paymentMethod === "LC" ? "L/C" : ci.paymentMethod}</div>
                {ci.paymentMethod === "TT" && (
                  <>
                    {ci.depositRatio != null && <div><span className="text-muted-foreground">订金比例：</span>{ci.depositRatio}%</div>}
                    {ci.depositAmount != null && <div><span className="text-muted-foreground">订金金额：</span>{formatAmount(ci.depositAmount, ci.currency)}</div>}
                    {ci.balanceAmount != null && <div><span className="text-muted-foreground">尾款金额：</span>{formatAmount(ci.balanceAmount, ci.currency)}</div>}
                  </>
                )}
                {ci.paymentMethod === "LC" && ci.lcNo && <div><span className="text-muted-foreground">L/C No.：</span>{ci.lcNo}</div>}
              </>
            )}
            <div><span className="text-muted-foreground">付款条款：</span>{ci.paymentTerm ?? "—"}</div>
            <div><span className="text-muted-foreground">贸易条款：</span>{ci.tradeTerm ?? "—"}</div>
            <div><span className="text-muted-foreground">装运港：</span>{ci.fromPort ?? "—"}</div>
            <div><span className="text-muted-foreground">目的港：</span>{ci.destinationPort ?? "—"}</div>
            <div><span className="text-muted-foreground">总金额：</span>{formatAmount(ci.totalAmount, ci.currency)}</div>
            <div><span className="text-muted-foreground">预扣/定金：</span>{ci.depositDeduction != null ? formatAmount(ci.depositDeduction, ci.currency) : "—"}</div>
            <div><span className="text-muted-foreground">余额：</span>{ci.balanceAmount != null ? formatAmount(ci.balanceAmount, ci.currency) : "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>明细（实际出货数据）</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产品名称</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>实际重量(kg)</TableHead>
                  <TableHead>实际卷数</TableHead>
                  <TableHead>单价</TableHead>
                  <TableHead>金额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ci.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.specification || "—"}</TableCell>
                    <TableCell>{item.actualQuantityKg}</TableCell>
                    <TableCell>{item.actualRollQty}</TableCell>
                    <TableCell>{formatAmount(item.unitPrice, ci.currency)}</TableCell>
                    <TableCell>{formatAmount(item.amount, ci.currency)}</TableCell>
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
