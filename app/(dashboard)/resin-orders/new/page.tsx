import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getCustomers, type CustomerListRow } from "@/lib/actions/customers";
import { createResinOrder } from "@/lib/actions/resin-orders";
import { ResinOrderForm } from "@/components/resin-orders/resin-order-form";
import { redirect } from "next/navigation";

export default async function NewResinOrderPage() {
  const customers = await getCustomers({});

  async function handleCreate(data: Parameters<typeof createResinOrder>[0]) {
    "use server";
    const order = await createResinOrder(data);
    redirect(`/resin-orders/${order.id}`);
  }

  return (
    <div className="flex flex-col">
      <Header title="New Resin Order" description="新建树脂颗粒订单">
        <Button asChild variant="outline">
          <Link href="/resin-orders">返回列表</Link>
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
          submitLabel="创建订单"
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
