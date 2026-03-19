import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getCommercialInvoiceById } from "@/lib/actions/commercial-invoices";
import { CommercialInvoiceEditForm } from "@/components/commercial-invoices/commercial-invoice-edit-form";

export default async function CommercialInvoiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ci = await getCommercialInvoiceById(id);
  if (!ci) notFound();

  const contractPaymentMethod = (ci.contract as { paymentMethod?: string | null } | null)?.paymentMethod ?? null;
  const rawPm = ci.paymentMethod ?? contractPaymentMethod;
  const paymentMethod = rawPm === "L/C" ? "LC" : rawPm === "T/T" ? "TT" : rawPm;
  const defaultValues = {
    invoiceDate: ci.invoiceDate.toISOString().slice(0, 10),
    buyerName: ci.buyerName ?? "",
    buyerAddress: ci.buyerAddress ?? "",
    paymentTerm: ci.paymentTerm ?? "",
    paymentMethod: paymentMethod ?? null,
    depositRatio: ci.depositRatio ?? null,
    depositAmount: ci.depositAmount ?? null,
    balanceAmount: ci.balanceAmount ?? null,
    lcNo: ci.lcNo ?? "",
    tradeTerm: ci.tradeTerm ?? "",
    packingTerm: ci.packingTerm ?? "",
    fromPort: ci.fromPort ?? "",
    destinationPort: ci.destinationPort ?? "",
    vesselVoyageNo: ci.vesselVoyageNo ?? "",
    departureDate: ci.departureDate?.toISOString().slice(0, 10) ?? "",
    depositDeduction: ci.depositDeduction ?? ci.depositAmount ?? 0,
    shippingMarks: ci.shippingMarks ?? "",
    currency: ci.currency,
    remark: ci.remark ?? "",
    items: ci.items.map((i) => ({
      productId: i.productId ?? undefined,
      productName: i.productName,
      specification: i.specification ?? "",
      contractQuantityKg: i.contractQuantityKg,
      actualQuantityKg: i.actualQuantityKg,
      contractRollQty: i.contractRollQty,
      actualRollQty: i.actualRollQty,
      unitPrice: i.unitPrice,
      amount: i.amount,
      hsCode: i.hsCode ?? "",
      remark: i.remark ?? "",
      sortOrder: i.sortOrder,
    })),
  };

  return (
    <div className="flex flex-col">
      <Header title={`编辑 CI: ${ci.invoiceNo}`} description={ci.contract?.contractNo ?? ""}>
        <Button asChild variant="outline">
          <Link href={`/commercial-invoices/${id}`}>取消</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/commercial-invoices">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <CommercialInvoiceEditForm
          commercialInvoiceId={id}
          contractNo={ci.contract?.contractNo ?? ""}
          defaultValues={defaultValues}
          updateCommercialInvoice={await import("@/lib/actions/commercial-invoices").then((m) => m.updateCommercialInvoice)}
        />
      </div>
    </div>
  );
}
