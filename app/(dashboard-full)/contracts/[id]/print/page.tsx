import { notFound } from "next/navigation";
import { getContractById } from "@/lib/actions/contracts";
import { getCompanyProfile } from "@/lib/actions/settings";
import { getCustomerDisplayName } from "@/lib/utils";
import { ContractPrintView } from "@/components/contracts/contract-print-view";

/**
 * Contract print page: same template as preview, optimized for print/PDF.
 * No sidebar; A4-width content; Print and Back buttons.
 */
export default async function ContractPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contract, companyProfile] = await Promise.all([
    getContractById(id),
    getCompanyProfile(),
  ]);
  if (!contract) notFound();

  const customer = contract.customer;
  const seller = {
    companyName: companyProfile?.companyName ?? null,
    companyAddress: companyProfile?.companyAddress ?? null,
    companyTel: companyProfile?.companyTel ?? null,
    companyEmail: companyProfile?.companyEmail ?? null,
    companyFax: companyProfile?.companyFax ?? null,
  };
  const buyer = {
    name: getCustomerDisplayName(customer ?? null),
    address: customer?.address ?? null,
    phone: customer?.phone ?? null,
  };
  const contractType = contract.contractType ?? "FILM";
  const items = contract.items.map((i) => ({
    productName: i.productName,
    thickness: i.thickness ?? null,
    width: i.width ?? null,
    length: i.length ?? null,
    unitPrice: i.unitPrice,
    rollQty: i.rollQty,
    quantityKg: i.quantityKg,
    amount: i.amount,
  }));
  const terms = {
    estimatedShipmentDate: contract.estimatedShipmentDate ?? null,
    incoterm: contract.incoterm ?? null,
    portOfShipment: contract.portOfShipment ?? null,
    portOfDestination: contract.portOfDestination ?? null,
    partialShipment: contract.partialShipment ?? "ALLOWED",
    transhipment: contract.transhipment ?? "ALLOWED",
    packingTerm: contract.packingTerm ?? null,
    paymentTerm: contract.paymentTerm ?? null,
    documentRequirement: contract.documentRequirement ?? null,
    insuranceTerm: contract.insuranceTerm ?? null,
    bankInfo: contract.bankInfo ?? null,
    moreOrLessPercent: contract.moreOrLessPercent ?? null,
    remark: contract.remark ?? null,
  };

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <ContractPrintView
        contractId={id}
        seller={seller}
        contractNo={contract.contractNo}
        contractDate={contract.contractDate.toISOString().slice(0, 10)}
        buyer={buyer}
        items={items}
        totalRolls={contract.totalRolls}
        totalWeight={contract.totalWeight}
        totalAmount={contract.totalAmount}
        currency={contract.currency}
        terms={terms}
        contractType={contractType}
      />
    </div>
  );
}
