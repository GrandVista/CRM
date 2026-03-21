import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getResinOrderById } from "@/lib/actions/resin-orders";
import { formatAmount } from "@/lib/numbers";
import { formatDate, toDateInputValue } from "@/lib/utils/date";
import { RESIN_DELIVERY_STATUS_LABEL, RESIN_PAYMENT_STATUS_LABEL } from "@/lib/constants/resin-order-status";
import { ResinOrderShipmentForm } from "@/components/resin-orders/resin-order-shipment-form";
import { ResinOrderPaymentForm } from "@/components/resin-orders/resin-order-payment-form";
import { ResinShipmentRowActions } from "@/components/resin-orders/resin-shipment-row-actions";
import { getCurrentAuthUser } from "@/lib/server-auth";
import { Badge } from "@/components/ui/badge";

export default async function ResinOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, user] = await Promise.all([getResinOrderById(id), getCurrentAuthUser()]);
  if (!order) notFound();
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex flex-col">
      <Header title={order.orderNo} description="Resin Orders Tracker / 树脂颗粒订单跟踪">
        <Button asChild variant="outline">
          <Link href="/resin-orders">返回列表</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/resin-orders/${id}/edit`}>编辑</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>订单信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <p>客户：<span className="font-medium">{order.customerName}</span></p>
            <p>客户采购单号 / Customer PO No.：<span className="font-medium">{order.customerPoNo?.trim() || "—"}</span></p>
            <p>产品：<span className="font-medium">{order.productName}</span></p>
            <p>牌号：<span className="font-medium">{order.grade ?? "-"}</span></p>
            <p>订单数量：<span className="font-medium">{order.quantity.toFixed(2)} {order.unit}</span></p>
            <p>已发货：<span className="font-medium">{order.shippedQuantity.toFixed(2)} ({RESIN_DELIVERY_STATUS_LABEL[order.deliveryStatus]})</span></p>
            <p>总金额：<span className="font-medium">{formatAmount(order.totalAmount, order.currency)}</span></p>
            <p>已收款：<span className="font-medium">{formatAmount(order.paidAmount, order.currency)} ({RESIN_PAYMENT_STATUS_LABEL[order.paymentStatus]})</span></p>
            <p>订单日期：<span className="font-medium">{formatDate(order.orderDate)}</span></p>
            <p>计划交货：<span className="font-medium">{formatDate(order.deliveryDate)}</span></p>
            <p>仓库：<span className="font-medium">{order.warehouse ?? "-"}</span></p>
            <p>收货地点：<span className="font-medium">{order.destination ?? "-"}</span></p>
            <p>联系人/电话：<span className="font-medium">{order.contactPerson ?? "-"} / {order.contactPhone ?? "-"}</span></p>
            <p className="sm:col-span-2">备注：<span className="font-medium">{order.remarks ?? "-"}</span></p>
          </CardContent>
        </Card>

        <Card id="shipments">
          <CardHeader>
            <CardTitle>发货跟踪 / Shipments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? <ResinOrderShipmentForm resinOrderId={id} /> : null}
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>送货单号</TableHead>
                    <TableHead>发货日期</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>司机/车牌</TableHead>
                    <TableHead>发货人</TableHead>
                    <TableHead>审核</TableHead>
                    <TableHead>开票人</TableHead>
                    <TableHead>到货状态</TableHead>
                    <TableHead className="text-right min-w-[12rem]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-6">暂无发货记录</TableCell>
                    </TableRow>
                  ) : (
                    order.shipments.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium whitespace-nowrap">{s.deliveryNo}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(s.shipmentDate)}</TableCell>
                        <TableCell>{s.quantity.toFixed(2)}</TableCell>
                        <TableCell className="max-w-[10rem] text-sm">
                          {s.driverName ?? "-"} / {s.vehicleNo ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[6rem] truncate" title={s.shipper ?? ""}>
                          {s.shipper?.trim() || "—"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[6rem] truncate" title={s.reviewer ?? ""}>
                          {s.reviewer?.trim() || "—"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[6rem] truncate" title={s.invoicer ?? ""}>
                          {s.invoicer?.trim() || "—"}
                        </TableCell>
                        <TableCell>
                          {s.signedDeliveryNoteUrl || s.arrivalConfirmed ? (
                            <Badge variant="success">已到货</Badge>
                          ) : (
                            <Badge variant="secondary" className="font-normal text-muted-foreground">
                              运输中
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right align-top">
                          <ResinShipmentRowActions
                            isAdmin={isAdmin}
                            shipment={{
                              id: s.id,
                              deliveryNo: s.deliveryNo,
                              shipmentDate: toDateInputValue(new Date(s.shipmentDate)),
                              quantity: s.quantity,
                              vehicleNo: s.vehicleNo ?? "",
                              driverName: s.driverName ?? "",
                              driverPhone: s.driverPhone ?? "",
                              remarks: s.remarks ?? "",
                              shipper: s.shipper ?? "",
                              reviewer: s.reviewer ?? "",
                              invoicer: s.invoicer ?? "",
                              signedDeliveryNoteUrl: s.signedDeliveryNoteUrl,
                              signedDeliveryNoteName: s.signedDeliveryNoteName,
                              arrivalConfirmed: s.arrivalConfirmed,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card id="payments">
          <CardHeader>
            <CardTitle>收款跟踪 / Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? <ResinOrderPaymentForm resinOrderId={id} /> : null}
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>收款日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>方式</TableHead>
                    <TableHead>参考号</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">暂无收款记录</TableCell>
                    </TableRow>
                  ) : (
                    order.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell>{formatAmount(p.amount, order.currency)}</TableCell>
                        <TableCell>{p.method ?? "-"}</TableCell>
                        <TableCell>{p.referenceNo ?? "-"}</TableCell>
                        <TableCell>{p.remarks ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
