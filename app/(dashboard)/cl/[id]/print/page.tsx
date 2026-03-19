import { notFound } from "next/navigation";
import { getPackingListById } from "@/lib/actions/packing-lists";
import { getCompanyProfile } from "@/lib/actions/settings";
import { getCustomerDisplayName } from "@/lib/utils";
import { PackingListPrintView } from "@/components/packing-lists/packing-list-print-view";

export default async function PackingListPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pl, companyProfile] = await Promise.all([
    getPackingListById(id),
    getCompanyProfile(),
  ]);
  if (!pl) notFound();

  const seller = {
    companyName: companyProfile?.companyName ?? "",
    companyAddress: companyProfile?.companyAddress ?? null,
  };
  const buyer = {
    name: pl.buyerName || getCustomerDisplayName(pl.customer ?? null) || "",
    address: pl.buyerAddress ?? null,
  };
  const items = (pl.items ?? []).map((i) => ({
    productName: i.productName,
    specification: i.specification ?? "",
    actualRollQty: i.actualRollQty,
    actualNetWeightKg: i.actualNetWeightKg,
    palletQty: i.palletQty ?? undefined,
    grossWeightKg: i.grossWeightKg ?? undefined,
    cbm: i.cbm ?? undefined,
  }));

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <PackingListPrintView
        packingListId={id}
        plNo={pl.clNo}
        documentDate={(pl.documentDate ?? pl.shipmentDate ?? new Date()).toISOString().slice(0, 10)}
        contractNo={pl.contract?.contractNo ?? ""}
        invoiceNo={pl.invoiceNo ?? ""}
        seller={seller}
        buyer={buyer}
        paymentMethod={pl.paymentMethod ?? null}
        lcNo={pl.lcNo ?? null}
        paymentTerm={pl.paymentTerm ?? ""}
        tradeTerm={pl.tradeTerm ?? ""}
        packingTerm={pl.packingTerm ?? ""}
        fromPort={pl.fromPort ?? ""}
        destinationPort={pl.destinationPort ?? ""}
        vesselVoyageNo={pl.vesselVoyageNo ?? ""}
        departureDate={pl.departureDate?.toISOString().slice(0, 10) ?? ""}
        containerNo={pl.containerNo ?? ""}
        sealNo={pl.sealNo ?? ""}
        items={items}
        totalPallets={pl.totalPallets ?? undefined}
        totalRolls={pl.totalRolls ?? 0}
        totalNetWeight={pl.totalNetWeight ?? pl.netWeight ?? 0}
        totalGrossWeight={pl.totalGrossWeight ?? pl.grossWeight ?? undefined}
        totalCbm={pl.totalCbm ?? pl.volume ?? undefined}
        shippingMarks={pl.shippingMarks ?? ""}
      />
    </div>
  );
}
