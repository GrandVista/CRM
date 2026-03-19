"use client";

import React from "react";
import type { ContractFormData, ContractItemInput } from "@/lib/actions/contracts";
import type { Customer } from "@prisma/client";
import type { CompanyProfile } from "@prisma/client";
import type { Product } from "@prisma/client";
import {
  ContractDocument,
  type ContractDocumentSeller,
  type ContractDocumentBuyer,
  type ContractDocumentItem,
  type ContractDocumentTerms,
} from "@/components/contracts/contract-document";
import { ContractItemsTable } from "@/components/contracts/contract-items-table";
import { getCustomerDisplayName } from "@/lib/utils";

type CompanyProfileLike = Pick<
  CompanyProfile,
  "companyName" | "companyAddress" | "companyTel" | "companyEmail" | "companyFax"
> | null;

type Props = {
  contractNo: string;
  data: ContractFormData;
  customers: Customer[];
  companyProfile: CompanyProfileLike;
  /** When set, the items table is editable in the preview and totals are derived from these items. */
  editableItems?: {
    items: ContractItemInput[];
    onItemsChange: (items: ContractItemInput[]) => void;
    products: Product[];
  };
};

function toDocumentItem(item: ContractItemInput): ContractDocumentItem {
  return {
    productName: item.productName ?? "",
    thickness: item.thickness ?? undefined,
    width: item.width ?? undefined,
    length: item.length ?? undefined,
    unitPrice: item.unitPrice ?? 0,
    rollQty: item.rollQty ?? 0,
    quantityKg: item.quantityKg ?? 0,
    amount: item.amount ?? 0,
  };
}

export function ContractPreview({ contractNo, data, customers, companyProfile, editableItems }: Props) {
  const customer = data.customerId
    ? customers.find((c) => c.id === data.customerId)
    : null;
  const buyer: ContractDocumentBuyer = {
    name: getCustomerDisplayName(customer ?? null),
    address: customer?.address ?? undefined,
    phone: customer?.phone ?? undefined,
  };
  const seller: ContractDocumentSeller = {
    companyName: companyProfile?.companyName ?? undefined,
    companyAddress: companyProfile?.companyAddress ?? undefined,
    companyTel: companyProfile?.companyTel ?? undefined,
    companyEmail: companyProfile?.companyEmail ?? undefined,
    companyFax: companyProfile?.companyFax ?? undefined,
  };
  const itemsSource = editableItems?.items ?? data.items;
  const items: ContractDocumentItem[] = itemsSource.map(toDocumentItem);
  const totalAmount = itemsSource.reduce((s, i) => s + (i.amount ?? 0), 0);
  const totalWeight = itemsSource.reduce((s, i) => s + (i.quantityKg ?? 0), 0);
  const totalRolls = itemsSource.reduce((s, i) => s + (i.rollQty ?? 0), 0);
  const terms: ContractDocumentTerms = {
    estimatedShipmentDate: data.estimatedShipmentDate ?? undefined,
    incoterm: data.incoterm ?? undefined,
    portOfShipment: data.portOfShipment ?? undefined,
    portOfDestination: data.portOfDestination ?? undefined,
    partialShipment: data.partialShipment ?? "ALLOWED",
    transhipment: data.transhipment ?? "ALLOWED",
    packingTerm: data.packingTerm ?? undefined,
    paymentTerm: data.paymentTerm ?? undefined,
    documentRequirement: data.documentRequirement ?? undefined,
    insuranceTerm: data.insuranceTerm ?? undefined,
    bankInfo: data.bankInfo ?? undefined,
    moreOrLessPercent: data.moreOrLessPercent ?? undefined,
    remark: data.remark ?? undefined,
  };

  const contractType = data.contractType ?? "FILM";
  const itemsTableSlot =
    editableItems != null ? (
      <ContractItemsTable
        mode="edit"
        items={editableItems.items}
        onItemsChange={editableItems.onItemsChange}
        products={editableItems.products}
        currency={data.currency ?? "USD"}
        contractType={contractType}
      />
    ) : undefined;

  return (
    <div className="mx-auto w-full max-w-[800px] bg-white text-gray-900 shadow-sm rounded-md overflow-hidden flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <ContractDocument
          seller={seller}
          contractNo={contractNo}
          contractDate={data.contractDate ?? ""}
          buyer={buyer}
          items={items}
          totalRolls={totalRolls}
          totalWeight={totalWeight}
          totalAmount={totalAmount}
          currency={data.currency ?? "USD"}
          terms={terms}
          contractType={contractType}
          forPrint={false}
          itemsTable={itemsTableSlot}
        />
      </div>
    </div>
  );
}
