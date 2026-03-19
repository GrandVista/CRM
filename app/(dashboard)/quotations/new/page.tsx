import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { createQuotation } from "@/lib/actions/quotations";
import { getCustomers } from "@/lib/actions/customers";
import { getProducts } from "@/lib/actions/products";
import { QuotationNewWrapper } from "@/components/quotations/quotation-new-wrapper";

export default async function NewQuotationPage() {
  const [customers, products] = await Promise.all([
    getCustomers({}),
    getProducts({ activeOnly: true }),
  ]);

  return (
    <div className="flex flex-col">
      <Header title="新建报价单" description="创建新报价单">
        <Button asChild variant="outline">
          <Link href="/quotations">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <QuotationNewWrapper
          customers={customers}
          products={products}
          createQuotation={createQuotation}
        />
      </div>
    </div>
  );
}
