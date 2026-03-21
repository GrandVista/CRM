import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getCustomers, type CustomerListRow } from "@/lib/actions/customers";
import { getResinOrderById, updateResinOrder } from "@/lib/actions/resin-orders";
import { ResinOrderForm } from "@/components/resin-orders/resin-order-form";

export default async function EditResinOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customers, order] = await Promise.all([getCustomers({}), getResinOrderById(id)]);
  if (!order) notFound();

  async function handleUpdate(data: Parameters<typeof updateResinOrder>[1]) {
    "use server";
    await updateResinOrder(id, data);
    redirect(`/resin-orders/${id}`);
  }

  return (
    <div className="flex flex-col">
      <Header title={`Edit ${order.orderNo}`} description="编辑树脂颗粒订单">
        <Button asChild variant="outline">
          <Link href={`/resin-orders/${id}`}>返回详情</Link>
        </Button>
      </Header>
      <div className="p-6">
        <ResinOrderForm
          customers={customers.map((c: CustomerListRow) => ({
            id: c.id,
            shortName: c.shortName,
            nameEn: c.nameEn,
            nameCn: c.nameCn,
          }))}
          defaultValues={{
            customerId: order.customerId,
            customerName: order.customerName,
            customerPoNo: order.customerPoNo ?? "",
            productName: order.productName,
            grade: order.grade ?? "",
            quantity: order.quantity,
            unit: order.unit,
            unitPrice: order.unitPrice,
            currency: order.currency,
            totalAmount: order.totalAmount,
            orderDate: order.orderDate.toISOString().slice(0, 10),
            deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString().slice(0, 10) : "",
            warehouse: order.warehouse ?? "",
            destination: order.destination ?? "",
            contactPerson: order.contactPerson ?? "",
            contactPhone: order.contactPhone ?? "",
            remarks: order.remarks ?? "",
          }}
          submitLabel="保存修改"
          onSubmit={handleUpdate}
        />
      </div>
    </div>
  );
}
