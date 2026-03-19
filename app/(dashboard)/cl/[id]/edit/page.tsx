import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getPackingListById } from "@/lib/actions/packing-lists";
import { PackingListEditForm } from "@/components/packing-lists/packing-list-edit-form";

export default async function PackingListEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pl = await getPackingListById(id);
  if (!pl) notFound();

  const defaultValues = {
    documentDate: (pl.documentDate ?? pl.shipmentDate ?? new Date()).toISOString().slice(0, 10),
    invoiceNo: pl.invoiceNo ?? "",
    buyerName: pl.buyerName ?? "",
    buyerAddress: pl.buyerAddress ?? "",
    paymentTerm: pl.paymentTerm ?? "",
    paymentMethod: pl.paymentMethod ?? null,
    lcNo: pl.lcNo ?? "",
    tradeTerm: pl.tradeTerm ?? "",
    packingTerm: pl.packingTerm ?? "",
    fromPort: pl.fromPort ?? "",
    destinationPort: pl.destinationPort ?? "",
    vesselVoyageNo: pl.vesselVoyageNo ?? "",
    departureDate: pl.departureDate?.toISOString().slice(0, 10) ?? "",
    containerNo: pl.containerNo ?? "",
    sealNo: pl.sealNo ?? "",
    totalPallets: pl.totalPallets ?? undefined,
    totalRolls: pl.totalRolls ?? undefined,
    totalNetWeight: pl.totalNetWeight ?? pl.netWeight ?? undefined,
    totalGrossWeight: pl.totalGrossWeight ?? pl.grossWeight ?? undefined,
    totalCbm: pl.totalCbm ?? pl.volume ?? undefined,
    shippingMarks: pl.shippingMarks ?? "",
    remark: pl.remark ?? "",
    items: (pl.items ?? []).map((i) => ({
      productName: i.productName,
      specification: i.specification ?? "",
      contractNetWeightKg: i.contractNetWeightKg,
      actualNetWeightKg: i.actualNetWeightKg,
      contractRollQty: i.contractRollQty,
      actualRollQty: i.actualRollQty,
      palletQty: i.palletQty ?? undefined,
      grossWeightKg: i.grossWeightKg ?? undefined,
      cbm: i.cbm ?? undefined,
      remark: i.remark ?? "",
      sortOrder: i.sortOrder,
    })),
  };

  return (
    <div className="flex flex-col">
      <Header title={`编辑 PL: ${pl.clNo}`} description={pl.contract?.contractNo ?? ""}>
        <Button asChild variant="outline">
          <Link href={`/cl/${id}`}>取消</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cl">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <PackingListEditForm
          packingListId={id}
          contractNo={pl.contract?.contractNo ?? ""}
          defaultValues={defaultValues}
          updatePackingList={await import("@/lib/actions/packing-lists").then((m) => m.updatePackingList)}
        />
      </div>
    </div>
  );
}
