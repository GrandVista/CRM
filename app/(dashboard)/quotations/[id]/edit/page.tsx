import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getQuotationById, updateQuotation } from "@/lib/actions/quotations";
import { getCustomers } from "@/lib/actions/customers";
import { getProducts } from "@/lib/actions/products";
import { QuotationEditWrapper } from "@/components/quotations/quotation-edit-wrapper";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quotation, customers, products] = await Promise.all([
    getQuotationById(id),
    getCustomers({}),
    getProducts({ activeOnly: false }),
  ]);
  if (!quotation) notFound();

  const defaultValues = {
    customerId: quotation.customerId,
    quotationDate: quotation.quotationDate.toISOString().slice(0, 10),
    validUntil: quotation.validUntil?.toISOString().slice(0, 10),
    currency: quotation.currency,
    paymentTerm: quotation.paymentTerm ?? undefined,
    incoterm: quotation.incoterm ?? undefined,
    remark: quotation.remark ?? undefined,
    status: quotation.status,
    items: quotation.items.map((i) => ({
      productId: i.productId ?? undefined,
      productName: i.productName,
      category: i.category ?? undefined,
      thickness: i.thickness ?? undefined,
      width: i.width ?? undefined,
      length: i.length ?? undefined,
      unitPrice: i.unitPrice,
      rollQty: i.rollQty,
      quantityKg: i.quantityKg,
      amount: i.amount,
      remark: i.remark ?? undefined,
      sortOrder: i.sortOrder,
    })),
  };

  return (
    <div className="flex flex-col">
      <Header title="编辑报价单" description={quotation.quotationNo}>
        <Button asChild variant="outline">
          <Link href={`/quotations/${id}`}>取消</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/quotations">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <QuotationEditWrapper
          quotationId={id}
          customers={customers}
          products={products}
          defaultValues={defaultValues}
          updateQuotation={updateQuotation}
        />
      </div>
    </div>
  );
}
