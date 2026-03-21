import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentAuthUser } from "@/lib/server-auth";
import { getResinOrders, type ResinOrderListRow } from "@/lib/actions/resin-orders";
import { formatAmount } from "@/lib/numbers";
import { formatDate } from "@/lib/utils/date";
import { RESIN_DELIVERY_STATUS_LABEL, RESIN_PAYMENT_STATUS_LABEL } from "@/lib/constants/resin-order-status";
import { ResinOrdersSearchForm } from "@/components/resin-orders/resin-orders-search-form";
import { ResinOrderActions } from "@/components/resin-orders/resin-order-actions";

export default async function ResinOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; deliveryStatus?: string; paymentStatus?: string }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentAuthUser();
  const role = currentUser?.role ?? "staff";
  const isAdmin = role === "admin";

  const list = await getResinOrders({
    search: params.search,
    deliveryStatus: params.deliveryStatus,
    paymentStatus: params.paymentStatus,
  });

  return (
    <div className="flex flex-col">
      <Header title="Resin Orders Tracker" description="树脂颗粒订单跟踪">
        {isAdmin && (
          <Button asChild>
            <Link href="/resin-orders/new">新建订单</Link>
          </Button>
        )}
      </Header>
      <div className="p-6 space-y-4">
        <ResinOrdersSearchForm />
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单编号</TableHead>
                <TableHead>客户 PO</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>产品</TableHead>
                <TableHead>牌号</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>已发货</TableHead>
                <TableHead>发货状态</TableHead>
                <TableHead>总金额</TableHead>
                <TableHead>已收款</TableHead>
                <TableHead>收款状态</TableHead>
                <TableHead>订单日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                    暂无树脂订单
                  </TableCell>
                </TableRow>
              ) : (
                list.map((row: ResinOrderListRow) => {
                  const canDeleteDirectly = row._count.shipments === 0 && row._count.payments === 0 && isAdmin;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.orderNo}</TableCell>
                      <TableCell className="text-muted-foreground">{row.customerPoNo?.trim() || "—"}</TableCell>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell>{row.grade ?? "-"}</TableCell>
                      <TableCell>{row.quantity.toFixed(2)} {row.unit}</TableCell>
                      <TableCell>{row.shippedQuantity.toFixed(2)}</TableCell>
                      <TableCell>{RESIN_DELIVERY_STATUS_LABEL[row.deliveryStatus]}</TableCell>
                      <TableCell>{formatAmount(row.totalAmount, row.currency)}</TableCell>
                      <TableCell>{formatAmount(row.paidAmount, row.currency)}</TableCell>
                      <TableCell>{RESIN_PAYMENT_STATUS_LABEL[row.paymentStatus]}</TableCell>
                      <TableCell>{formatDate(row.orderDate)}</TableCell>
                      <TableCell className="text-right">
                        <ResinOrderActions
                          id={row.id}
                          orderNo={row.orderNo}
                          canDeleteDirectly={canDeleteDirectly}
                          isAdmin={isAdmin}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
