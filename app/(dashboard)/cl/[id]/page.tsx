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
import { getPackingListById } from "@/lib/actions/packing-lists";
import { getCustomerDisplayName } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { PdfActionButtons } from "@/components/pdf/pdf-action-buttons";

export default async function ClDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pl = await getPackingListById(id);
  if (!pl) notFound();

  const buyerName = pl.buyerName || getCustomerDisplayName(pl.customer ?? null) || "—";

  return (
    <div className="flex flex-col">
      <Header title={pl.clNo} description={`合同: ${pl.contract?.contractNo ?? "-"}`}>
        <Button asChild variant="outline">
          <Link href={`/cl/${id}/edit`}>编辑</Link>
        </Button>
        <PdfActionButtons
          previewUrl={`/api/packing-lists/${id}/pdf`}
          downloadUrl={`/api/packing-lists/${id}/pdf?download=1`}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={`/cl/${id}/print`} target="_blank" rel="noopener noreferrer">
            打印网页
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cl">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">PL 编号</span><p className="font-medium">{pl.clNo}</p></div>
            <div><span className="text-muted-foreground">合同编号</span><p className="font-medium">{pl.contract?.contractNo ?? "—"}</p></div>
            <div><span className="text-muted-foreground">发票号</span><p className="font-medium">{pl.invoiceNo ?? "—"}</p></div>
            <div><span className="text-muted-foreground">日期</span><p className="font-medium">{formatDate(pl.documentDate ?? pl.shipmentDate)}</p></div>
            <div><span className="text-muted-foreground">买方</span><p className="font-medium">{buyerName}</p></div>
            {pl.paymentMethod && (
              <div><span className="text-muted-foreground">付款方式</span><p className="font-medium">{pl.paymentMethod === "TT" ? "T/T" : pl.paymentMethod === "LC" ? "L/C" : pl.paymentMethod}{pl.paymentMethod === "LC" && pl.lcNo ? ` · L/C No. ${pl.lcNo}` : ""}</p></div>
            )}
            <div><span className="text-muted-foreground">付款/贸易条款</span><p className="font-medium">{pl.paymentTerm ?? "—"} / {pl.tradeTerm ?? "—"}</p></div>
            <div><span className="text-muted-foreground">装运港 / 目的港</span><p className="font-medium">{pl.fromPort ?? "—"} / {pl.destinationPort ?? "—"}</p></div>
            <div><span className="text-muted-foreground">船名航次</span><p className="font-medium">{pl.vesselVoyageNo ?? "—"}</p></div>
            <div><span className="text-muted-foreground">柜号 / 封号</span><p className="font-medium">{pl.containerNo ?? "—"} / {pl.sealNo ?? "—"}</p></div>
            <div><span className="text-muted-foreground">总托盘数</span><p className="font-medium">{pl.totalPallets ?? "—"}</p></div>
            <div><span className="text-muted-foreground">总卷数</span><p className="font-medium">{pl.totalRolls ?? "—"}</p></div>
            <div><span className="text-muted-foreground">总净重(kg)</span><p className="font-medium">{pl.totalNetWeight ?? pl.netWeight ?? "—"}</p></div>
            <div><span className="text-muted-foreground">总毛重(kg)</span><p className="font-medium">{pl.totalGrossWeight ?? pl.grossWeight ?? "—"}</p></div>
            <div><span className="text-muted-foreground">总体积(CBM)</span><p className="font-medium">{pl.totalCbm ?? pl.volume ?? "—"}</p></div>
          </CardContent>
        </Card>

        {pl.items && pl.items.length > 0 && (
          <Card>
            <CardHeader><CardTitle>明细（实际出货数据）</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品名称</TableHead>
                    <TableHead>规格</TableHead>
                    <TableHead>实际卷数</TableHead>
                    <TableHead>实际净重(kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pl.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.specification || "—"}</TableCell>
                      <TableCell>{item.actualRollQty}</TableCell>
                      <TableCell>{item.actualNetWeightKg}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
