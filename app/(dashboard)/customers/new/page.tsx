import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { createCustomer } from "@/lib/actions/customers";
import { NewCustomerFormWrapper } from "@/components/customers/new-customer-form-wrapper";

export default function NewCustomerPage() {
  return (
    <div className="flex flex-col">
      <Header title="新建客户" description="添加新客户资料">
        <Button asChild variant="outline">
          <Link href="/customers">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <NewCustomerFormWrapper createCustomer={createCustomer} />
      </div>
    </div>
  );
}
