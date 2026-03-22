import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getResinOrderById } from "@/lib/actions/resin-orders";
import type { ResinOrderPaymentRow, ResinOrderShipmentRow } from "@/lib/resin-order-prisma";
import { formatAmount } from "@/lib/numbers";
import { formatDate, toDateInputValue } from "@/lib/utils/date";
import { RESIN_DELIVERY_STATUS_LABEL, RESIN_PAYMENT_STATUS_LABEL } from "@/lib/constants/resin-order-status";
import { ResinOrderShipmentForm } from "@/components/resin-orders/resin-order-shipment-form";
import { ResinOrderPaymentForm } from "@/components/resin-orders/resin-order-payment-form";
import { ResinShipmentRowActions } from "@/components/resin-orders/resin-shipment-row-actions";
import { ResinPurchaseOrdersPanel } from "@/components/resin-orders/resin-purchase-orders-panel";
import { getCurrentAuthUser } from "@/lib/server-auth";
import { Badge } from "@/components/ui/badge";
import {
  allocatedQuantityFromPurchaseOrders,
  computeResinMasterPaymentStatus,
  resinMasterAggregateLabel,
  resinOrderMasterReceivable,
  resinTotalPaidFromPayments,
  rollupResinPurchaseOrders,
} from "@/lib/resin-order-metrics";

export default async function ResinOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, user] = await Promise.all([getResinOrderById(id), getCurrentAuthUser()]);
  if (!order) notFound();
  const detail = order;
  const isAdmin = user?.role === "admin";

  const purchaseOrderOptions = detail.purchaseOrders.map((po) => ({
    id: po.id,
    customerPoNo: po.customerPoNo,
  }));
  const hasAnyPo = purchaseOrderOptions.length > 0;
  const allocated = allocatedQuantityFromPurchaseOrders(detail);
  const rollups = rollupResinPurchaseOrders(detail, detail.unitPrice);
  const orderReceivable = resinOrderMasterReceivable(detail.quantity, detail.unitPrice);
  const paidEffective = resinTotalPaidFromPayments(detail.payments);
  const unpaidMaster = Math.max(0, orderReceivable - paidEffective);
  const masterProgress = resinMasterAggregateLabel({
    quantity: detail.quantity,
    unitPrice: detail.unitPrice,
    shippedQuantity: detail.shippedQuantity,
    paidAmount: paidEffective,
    purchaseOrders: detail.purchaseOrders,
  });
  const masterPaymentStatus = computeResinMasterPaymentStatus(paidEffective, orderReceivable);
  const unshippedMaster = Math.max(0, detail.quantity - detail.shippedQuantity);
  const unallocatedToPo = Math.max(0, detail.quantity - allocated);

  function shipmentAllocSummary(s: ResinOrderShipmentRow): { text: string; legacy: boolean } {
    if (s.items.length > 0) {
      return {
        text: s.items
          .map((it) => `${it.purchaseOrder.customerPoNo}: ${it.quantity.toFixed(2)}`)
          .join("；"),
        legacy: false,
      };
    }
    if (hasAnyPo && s.quantity > 0) {
      return { text: "旧数据未完成分摊（仅总量）", legacy: true };
    }
    return { text: "—", legacy: false };
  }

  function paymentAllocSummary(p: ResinOrderPaymentRow): { text: string; legacy: boolean } {
    if (p.items.length > 0) {
      return {
        text: p.items
          .map(
            (it) =>
              `${it.purchaseOrder.customerPoNo}: ${formatAmount(it.amount, detail.currency)}`,
          )
          .join("；"),
        legacy: false,
      };
    }
    if (hasAnyPo && p.amount > 0) {
      return { text: "旧数据未完成分摊（仅总额）", legacy: true };
    }
    return { text: "—", legacy: false };
  }

  return (
    <div className="flex flex-col">
      <Header title={detail.orderNo} description="Resin Orders Tracker / 树脂颗粒订单跟踪">
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
            <CardTitle className="flex flex-wrap items-center gap-2">
              主订单信息（总量订单）
              <Badge variant="secondary" className="font-normal">
                汇总：{masterProgress}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <p>
              总订单号：<span className="font-medium font-mono">{detail.orderNo}</span>
            </p>
            <p>
              客户：<span className="font-medium">{detail.customerName}</span>
            </p>
            <p>
              产品：<span className="font-medium">{detail.productName}</span>
            </p>
            <p>
              牌号/型号：<span className="font-medium">{detail.grade ?? "-"}</span>
            </p>
            <p>
              总量：<span className="font-medium">
                {detail.quantity.toFixed(2)} {detail.unit}
              </span>
            </p>
            <p>
              已分配到小订单：<span className="font-medium">{allocated.toFixed(2)}</span>{" "}
              <span className="text-muted-foreground text-sm">（未分配 {unallocatedToPo.toFixed(2)}）</span>
            </p>
            <p>
              已发货：<span className="font-medium">{detail.shippedQuantity.toFixed(2)}</span>{" "}
              <span className="text-muted-foreground">
                （{RESIN_DELIVERY_STATUS_LABEL[detail.deliveryStatus]}，未发 {unshippedMaster.toFixed(2)}）
              </span>
            </p>
            <p>
              单价 / 币种：
              <span className="font-medium">
                {formatAmount(detail.unitPrice, detail.currency)} / {detail.currency}
              </span>
            </p>
            <p>
              订单应收总额：
              <span className="font-medium">{formatAmount(orderReceivable, detail.currency)}</span>
              <span className="text-muted-foreground text-sm ml-1">（总量 × 单价）</span>
            </p>
            <p>
              已收款：<span className="font-medium">{formatAmount(paidEffective, detail.currency)}</span>{" "}
              <span className="text-muted-foreground">
                （{RESIN_PAYMENT_STATUS_LABEL[masterPaymentStatus]}，未收{" "}
                {formatAmount(unpaidMaster, detail.currency)}）
              </span>
            </p>
            <p>
              订单日期：<span className="font-medium">{formatDate(detail.orderDate)}</span>
            </p>
            <p>
              计划交货：<span className="font-medium">{formatDate(detail.deliveryDate)}</span>
            </p>
            <p>
              仓库/发货地点：<span className="font-medium">{detail.warehouse ?? "-"}</span>
            </p>
            <p>
              收货地址：<span className="font-medium">{detail.destination ?? "-"}</span>
            </p>
            <p>
              联系人 / 电话：
              <span className="font-medium">
                {detail.contactPerson ?? "-"} / {detail.contactPhone ?? "-"}
              </span>
            </p>
            <p className="sm:col-span-2">
              备注：<span className="font-medium">{detail.remarks ?? "-"}</span>
            </p>
            {detail.customerPoNo?.trim() ? (
              <p className="sm:col-span-2 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                <strong>兼容字段</strong>：历史主订单级客户采购单号为「{detail.customerPoNo.trim()}
                」。新业务请在下方「小订单」中维护客户采购单号。
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card id="purchase-orders">
          <CardHeader>
            <CardTitle>小订单（客户采购单号）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResinPurchaseOrdersPanel
              resinOrderId={id}
              currency={detail.currency}
              masterQuantity={detail.quantity}
              purchaseOrders={detail.purchaseOrders.map((po) => ({
                id: po.id,
                customerPoNo: po.customerPoNo,
                quantity: po.quantity,
                orderDate: po.orderDate,
                remarks: po.remarks,
              }))}
              rollups={rollups}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>

        <Card id="shipments">
          <CardHeader>
            <CardTitle>发货跟踪 / Shipments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              <ResinOrderShipmentForm resinOrderId={id} purchaseOrderOptions={purchaseOrderOptions} />
            ) : null}
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>送货单号</TableHead>
                    <TableHead>发货日期</TableHead>
                    <TableHead>本单数量</TableHead>
                    <TableHead className="min-w-[10rem]">分摊明细</TableHead>
                    <TableHead>司机/车牌</TableHead>
                    <TableHead>发货人</TableHead>
                    <TableHead>审核</TableHead>
                    <TableHead>开票人</TableHead>
                    <TableHead>到货状态</TableHead>
                    <TableHead className="text-right min-w-[12rem]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-6">
                        暂无发货记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.shipments.map((s: ResinOrderShipmentRow) => {
                      const alloc = shipmentAllocSummary(s);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium whitespace-nowrap">{s.deliveryNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(s.shipmentDate)}</TableCell>
                          <TableCell>{s.quantity.toFixed(2)}</TableCell>
                          <TableCell className="max-w-[14rem] text-sm">
                            {alloc.legacy ? (
                              <span className="text-amber-800">{alloc.text}</span>
                            ) : (
                              alloc.text
                            )}
                          </TableCell>
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
                              purchaseOrderOptions={purchaseOrderOptions}
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
                                hasPurchaseOrders: hasAnyPo,
                                lines: s.items.map((it) => ({
                                  purchaseOrderId: it.purchaseOrderId,
                                  quantity: it.quantity,
                                  customerPoNo: it.purchaseOrder.customerPoNo,
                                })),
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
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
            {isAdmin ? (
              <ResinOrderPaymentForm resinOrderId={id} purchaseOrderOptions={purchaseOrderOptions} />
            ) : null}
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>收款日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead className="min-w-[10rem]">分摊明细</TableHead>
                    <TableHead>方式</TableHead>
                    <TableHead>参考号</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        暂无收款记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.payments.map((p: ResinOrderPaymentRow) => {
                      const alloc = paymentAllocSummary(p);
                      return (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.paymentDate)}</TableCell>
                          <TableCell>{formatAmount(p.amount, detail.currency)}</TableCell>
                          <TableCell className="max-w-[14rem] text-sm">
                            {alloc.legacy ? (
                              <span className="text-amber-800">{alloc.text}</span>
                            ) : (
                              alloc.text
                            )}
                          </TableCell>
                          <TableCell>{p.method ?? "-"}</TableCell>
                          <TableCell>{p.referenceNo ?? "-"}</TableCell>
                          <TableCell>{p.remarks ?? "-"}</TableCell>
                        </TableRow>
                      );
                    })
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
