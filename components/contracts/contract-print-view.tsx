"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContractDocument } from "@/components/contracts/contract-document";
import type {
  ContractDocumentSeller,
  ContractDocumentBuyer,
  ContractDocumentItem,
  ContractDocumentTerms,
} from "@/components/contracts/contract-document";

type Props = {
  contractId: string;
  seller: ContractDocumentSeller;
  contractNo: string;
  contractDate: string;
  buyer: ContractDocumentBuyer;
  items: ContractDocumentItem[];
  totalRolls: number;
  totalWeight: number;
  totalAmount: number;
  currency: string;
  terms: ContractDocumentTerms;
  contractType?: "FILM" | "RESIN";
};

export function ContractPrintView({
  contractId,
  seller,
  contractNo,
  contractDate,
  buyer,
  items,
  totalRolls,
  totalWeight,
  totalAmount,
  currency,
  terms,
  contractType = "FILM",
}: Props) {
  return (
    <>
      {/* Top toolbar (screen only) */}
      <div className="sticky top-0 z-10 flex-shrink-0 border-b bg-card px-4 py-3 flex items-center gap-3 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/contracts/${contractId}`}>返回合同</Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          打印 / 导出 PDF
        </Button>
      </div>

      {/* Screen: centered A4 paper with shadow; Print: no background/shadow, white only */}
      <div className="flex justify-center items-start px-6 lg:px-12 py-8 bg-gray-100 print:bg-transparent print:px-0 print:py-0">
        <ContractDocument
          seller={seller}
          contractNo={contractNo}
          contractDate={contractDate}
          buyer={buyer}
          items={items}
          totalRolls={totalRolls}
          totalWeight={totalWeight}
          totalAmount={totalAmount}
          currency={currency}
          terms={terms}
          contractType={contractType}
          forPrint
          className="shadow-md rounded-md my-2 print:shadow-none print:rounded-none"
        />
      </div>
    </>
  );
}
