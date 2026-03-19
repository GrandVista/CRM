import { notFound } from "next/navigation";
import { getCommercialInvoiceById } from "@/lib/actions/commercial-invoices";
import { getCompanyProfile } from "@/lib/actions/settings";
import { getCustomerDisplayName } from "@/lib/utils";
import { CommercialInvoicePrintView } from "@/components/commercial-invoices/commercial-invoice-print-view";

export default async function CommercialInvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ci, companyProfile] = await Promise.all([
    getCommercialInvoiceById(id),
    getCompanyProfile(),
  ]);
  if (!ci) notFound();

  const seller = {
    companyName: companyProfile?.companyName ?? "",
    companyAddress: companyProfile?.companyAddress ?? null,
    companyTel: companyProfile?.companyTel ?? null,
    companyEmail: companyProfile?.companyEmail ?? null,
  };
  const buyer = {
    name: ci.buyerName || getCustomerDisplayName(ci.customer ?? null) || "",
    address: ci.buyerAddress ?? null,
  };
  const items = ci.items.map((i) => ({
    productName: i.productName,
    specification: i.specification ?? "",
    actualQuantityKg: i.actualQuantityKg,
    actualRollQty: i.actualRollQty,
    unitPrice: i.unitPrice,
    amount: i.amount,
  }));

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <CommercialInvoicePrintView
        commercialInvoiceId={id}
        invoiceNo={ci.invoiceNo}
        invoiceDate={ci.invoiceDate.toISOString().slice(0, 10)}
        contractNo={ci.contract?.contractNo ?? ""}
        seller={seller}
        buyer={buyer}
        paymentMethod={ci.paymentMethod ?? null}
        depositRatio={ci.depositRatio ?? null}
        depositAmount={ci.depositAmount ?? null}
        lcNo={ci.lcNo ?? null}
        paymentTerm={ci.paymentTerm ?? ""}
        tradeTerm={ci.tradeTerm ?? ""}
        packingTerm={ci.packingTerm ?? ""}
        fromPort={ci.fromPort ?? ""}
        destinationPort={ci.destinationPort ?? ""}
        vesselVoyageNo={ci.vesselVoyageNo ?? ""}
        departureDate={ci.departureDate?.toISOString().slice(0, 10) ?? ""}
        items={items}
        totalAmount={ci.totalAmount}
        totalAmountInWords={ci.totalAmountInWords ?? ""}
        depositDeduction={ci.depositDeduction ?? 0}
        balanceAmount={ci.balanceAmount ?? ci.totalAmount}
        balanceAmountInWords={ci.balanceAmountInWords ?? ""}
        shippingMarks={ci.shippingMarks ?? ""}
        currency={ci.currency}
      />
    </div>
  );
}
