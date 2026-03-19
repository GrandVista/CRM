import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { SHIPMENT_STATUS_OPTIONS } from "@/lib/constants/shipment-status";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await prisma.shipment.findUnique({
    where: { id },
    include: { contract: { select: { contractNo: true } }, customer: { select: { shortName: true, nameEn: true } } },
  });
  if (!s) notFound();

  const statusLabel = SHIPMENT_STATUS_OPTIONS.find((o) => o.value === s.status)?.label ?? s.status;

  return (
    <div className="flex flex-col">
      <Header title={s.shipmentNo} description={`合同: ${s.contract?.contractNo ?? "-"}`}>
        <Button asChild variant="outline">
          <Link href="/shipments">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">出货单号</p><p className="font-medium">{s.shipmentNo}</p></div>
            <div><p className="text-sm text-muted-foreground">状态</p><Badge variant="secondary">{statusLabel}</Badge></div>
            <div><p className="text-sm text-muted-foreground">合同</p><p className="font-medium">{s.contract?.contractNo ?? "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">船舶航号</p><p className="font-medium">{s.vesselVoyage ?? "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">ETD / ETA</p><p className="font-medium">{formatDate(s.etd)} / {formatDate(s.eta)}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
