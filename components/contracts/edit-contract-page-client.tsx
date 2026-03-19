"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ContractForm } from "@/components/contracts/contract-form";
import { ContractPreview } from "@/components/contracts/contract-preview";
import { ContractSignedAttachmentView } from "@/components/contracts/contract-signed-attachment-view";
import type { ContractFormData } from "@/lib/actions/contracts";
import type { TemplateOption } from "@/components/contracts/contract-form";
import type { CompanyProfile } from "@prisma/client";
import type { Customer } from "@prisma/client";
import type { Product } from "@prisma/client";
import type { TemplateType } from "@prisma/client";

type QuotationOption = { id: string; quotationNo: string };

type Props = {
  contractId: string;
  contractNo: string;
  defaultValues: Partial<ContractFormData>;
  templatesByType?: Partial<Record<TemplateType, TemplateOption[]>>;
  customers: Customer[];
  products: Product[];
  quotations: QuotationOption[];
  companyProfile: CompanyProfile | null;
  updateContract: (id: string, data: ContractFormData) => Promise<unknown>;
  fetchQuotationData: (quotationId: string) => Promise<{
    customerId: string;
    currency: string;
    paymentTerm?: string;
    incoterm?: string;
    items: import("@/lib/actions/contracts").ContractItemInput[];
  } | null>;
  /** When true, show top toolbar and use toolbar Save (no sidebar layout). */
  showToolbar?: boolean;
  /** 合同附件（已签署合同 PDF），编辑页仅展示查看/下载，上传与替换在列表页完成 */
  initialAttachments?: { id: string; fileName: string; fileUrl: string; category: string }[];
};

function toFormData(partial: Partial<ContractFormData>): ContractFormData {
  return {
    customerId: partial.customerId ?? "",
    contractType: (partial.contractType ?? "FILM") as ContractFormData["contractType"],
    contractDate: partial.contractDate ?? "",
    quotationId: partial.quotationId,
    piId: partial.piId,
    currency: partial.currency ?? "USD",
    incoterm: partial.incoterm,
    paymentMethod: partial.paymentMethod,
    depositRatio: partial.depositRatio,
    paymentTerm: partial.paymentTerm,
    portOfShipment: partial.portOfShipment,
    portOfDestination: partial.portOfDestination,
    partialShipment: partial.partialShipment ?? "ALLOWED",
    transhipment: partial.transhipment ?? "ALLOWED",
    estimatedShipmentDate: partial.estimatedShipmentDate,
    packingTerm: partial.packingTerm,
    insuranceTerm: partial.insuranceTerm,
    documentRequirement: partial.documentRequirement,
    bankInfo: partial.bankInfo,
    moreOrLessPercent: partial.moreOrLessPercent,
    remark: partial.remark,
    signStatus: partial.signStatus ?? "UNSIGNED",
    executionStatus: partial.executionStatus ?? "DRAFT",
    items: partial.items?.length ? partial.items : [{ productName: "", unitPrice: 0, rollQty: 0, quantityKg: 0, amount: 0, sortOrder: 0 }],
  };
}

export function EditContractPageClient({
  contractId,
  contractNo,
  defaultValues,
  templatesByType,
  customers,
  products,
  quotations,
  companyProfile,
  updateContract,
  fetchQuotationData,
  showToolbar = false,
  initialAttachments = [],
}: Props) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [formState, setFormState] = React.useState<ContractFormData>(() =>
    toFormData(defaultValues)
  );

  const signedAttachments = (initialAttachments ?? []).filter((a) => a.category === "SIGNED_CONTRACT");

  const handleSubmit = React.useCallback(
    async (data: ContractFormData) => {
      if (data.signStatus === "SIGNED" && signedAttachments.length === 0) {
        alert("合同状态为已签署时，必须上传已签署合同 PDF。请在合同列表页上传。");
        return;
      }
      await updateContract(contractId, data);
      router.push(`/contracts/${contractId}`);
      router.refresh();
    },
    [contractId, updateContract, router, signedAttachments.length]
  );

  const mainContent = (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
      {/* Left: 30%，最大宽度 480px — 仅合同基础字段 */}
      <div className="lg:flex-[0_0_30%] lg:max-w-[480px] min-w-0 overflow-y-auto pr-2">
        <div className="pb-6 space-y-4">
          <ContractForm
            ref={formRef}
            customers={customers}
            products={products}
            quotations={quotations}
            defaultValues={defaultValues}
            templatesByType={templatesByType}
            value={formState}
            onChange={(updates) =>
              setFormState((prev) => ({ ...prev, ...updates }))
            }
            onSubmit={handleSubmit}
            submitLabel="保存"
            hideSubmitButton={showToolbar}
            fetchQuotationData={fetchQuotationData}
            hideItemsTable
          />
          <ContractSignedAttachmentView
            attachments={signedAttachments.map((a) => ({ id: a.id, fileName: a.fileName, fileUrl: a.fileUrl }))}
          />
        </div>
      </div>

      {/* Right: 70% — A4 风格合同预览，明细表可编辑、所见即所得 */}
      <div className="lg:flex-[1_1_70%] min-w-0 min-h-0 flex flex-col border rounded-lg bg-muted/30 overflow-hidden">
        <div className="flex-shrink-0 px-4 py-2 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
          合同预览（明细表可直接编辑）
        </div>
        <div className="flex-1 min-h-0 overflow-auto flex justify-center py-4">
          <div className="w-[210mm] max-w-full shrink-0 px-2 print:px-0" style={{ maxWidth: "210mm" }}>
            <ContractPreview
              contractNo={contractNo}
              data={formState}
              customers={customers}
              companyProfile={companyProfile}
              editableItems={{
                items: formState.items,
                onItemsChange: (items) => setFormState((prev) => ({ ...prev, items })),
                products,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (showToolbar) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex-shrink-0 border-b border-border bg-card px-4 lg:px-6 py-3 flex flex-wrap items-center gap-3 shadow-sm">
          <Button variant="outline" size="sm" asChild>
            <Link href="/contracts">返回合同列表</Link>
          </Button>
          <span className="text-muted-foreground">|</span>
          <span className="font-medium text-sm truncate" title={contractNo}>
            {contractNo}
          </span>
          <div className="flex-1" />
          <Button
            type="button"
            size="sm"
            onClick={() => formRef.current?.requestSubmit()}
          >
            保存
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/contracts/${contractId}`}>取消</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/contracts/${contractId}/print`} target="_blank" rel="noopener noreferrer">
              打印 / 导出 PDF
            </Link>
          </Button>
        </header>
        <div className="flex-1 min-h-0 px-6 py-4 overflow-hidden flex flex-col">
          {mainContent}
        </div>
      </div>
    );
  }

  return mainContent;
}
