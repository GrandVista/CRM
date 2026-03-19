"use client";

import React, { useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { calculateWeight, calculateAmount } from "@/lib/numbers";
import type { ContractFormData, ContractItemInput } from "@/lib/actions/contracts";
import type { ContractType } from "@prisma/client";
import type { Customer } from "@prisma/client";
import type { Product } from "@prisma/client";
import type { TemplateType } from "@prisma/client";
import { EXEC_OPTIONS as EXEC_STATUS_OPTIONS } from "@/lib/constants/execution-status";
import { ALLOW_OPTIONS as SHARED_ALLOW_OPTIONS } from "@/lib/allow-option";

export type TemplateOption = { id: string; name: string; content: string | null };

function recalcContractRow(
  row: ContractItemInput,
  product: Product | undefined,
  contractType: ContractType
): { quantityKg: number; amount: number } {
  if (contractType === "RESIN") {
    const quantityKg = Number(row.quantityKg) || 0;
    const amount = (row.unitPrice ?? 0) * quantityKg;
    return { quantityKg, amount };
  }
  const density = product?.density ?? undefined;
  const quantityKg =
    density != null && row.thickness != null && row.width != null && row.length != null
      ? calculateWeight({
          thickness: row.thickness,
          width: row.width,
          length: row.length,
          density,
          rollQty: row.rollQty ?? 0,
        })
      : 0;
  const amount = calculateAmount({
    unitPrice: row.unitPrice ?? 0,
    quantityKg: quantityKg > 0 ? quantityKg : undefined,
  });
  return { quantityKg, amount };
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SIGN_OPTIONS: { value: string; label: string }[] = [
  { value: "UNSIGNED", label: "未签署" },
  { value: "SIGNED", label: "已签署" },
  { value: "VOIDED", label: "作废" },
];

const ALLOW_OPTIONS_FORM: { value: string; label: string }[] = [
  { value: "", label: "—" },
  ...SHARED_ALLOW_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];

type QuotationOption = { id: string; quotationNo: string };

type Props = {
  customers: Customer[];
  products: Product[];
  quotations: QuotationOption[];
  defaultValues?: Partial<ContractFormData>;
  /** When provided with onChange, form is controlled (e.g. for edit page with live preview). */
  value?: Partial<ContractFormData>;
  onChange?: (updates: Partial<ContractFormData>) => void;
  onSubmit: (data: ContractFormData) => Promise<void>;
  submitLabel?: string;
  /** When true, hide the form's submit button (e.g. when using toolbar Save). */
  hideSubmitButton?: boolean;
  fetchQuotationData: (quotationId: string) => Promise<{
    customerId: string;
    currency: string;
    paymentTerm?: string;
    incoterm?: string;
    portOfShipment?: string;
    portOfDestination?: string;
    items: ContractItemInput[];
  } | null>;
  /** Clause templates by type; when set, each clause field shows a template dropdown. */
  templatesByType?: Partial<Record<TemplateType, TemplateOption[]>>;
  /** When true, hide the product items table and summary (e.g. edit page with items edited in right preview). */
  hideItemsTable?: boolean;
};

const defaultItems: ContractItemInput[] = [
  { productName: "", unitPrice: 0, rollQty: 0, quantityKg: 0, amount: 0, sortOrder: 0 },
];

export const ContractForm = React.forwardRef<HTMLFormElement, Props>(function ContractForm(
  {
    customers,
    products,
    quotations,
    defaultValues,
    value: controlledValue,
    onChange: controlledOnChange,
    onSubmit,
    submitLabel = "保存",
  hideSubmitButton = false,
  fetchQuotationData,
  templatesByType,
  hideItemsTable = false,
  },
  ref
) {
  const isControlled = controlledValue != null && controlledOnChange != null;
  const [isPending, startTransition] = useTransition();

  const [internalCustomerId, setInternalCustomerId] = React.useState(defaultValues?.customerId ?? "");
  const [internalContractType, setInternalContractType] = React.useState<ContractType>(defaultValues?.contractType ?? "FILM");
  const [internalCurrency, setInternalCurrency] = React.useState(defaultValues?.currency ?? "USD");
  const [internalPaymentMethod, setInternalPaymentMethod] = React.useState<string>(defaultValues?.paymentMethod ?? "");
  const [internalDepositRatio, setInternalDepositRatio] = React.useState<string>(defaultValues?.depositRatio != null ? String(defaultValues.depositRatio) : "");
  const [internalPaymentTerm, setInternalPaymentTerm] = React.useState(defaultValues?.paymentTerm ?? "");
  const [internalIncoterm, setInternalIncoterm] = React.useState(defaultValues?.incoterm ?? "");
  const [internalEstimatedShipmentDate, setInternalEstimatedShipmentDate] = React.useState(defaultValues?.estimatedShipmentDate ?? "");
  const [internalPortOfShipment, setInternalPortOfShipment] = React.useState(defaultValues?.portOfShipment ?? "");
  const [internalPortOfDestination, setInternalPortOfDestination] = React.useState(defaultValues?.portOfDestination ?? "");
  const [internalPartialShipment, setInternalPartialShipment] = React.useState<string>(defaultValues?.partialShipment ?? "ALLOWED");
  const [internalTranshipment, setInternalTranshipment] = React.useState<string>(defaultValues?.transhipment ?? "ALLOWED");
  const [internalPackingTerm, setInternalPackingTerm] = React.useState(defaultValues?.packingTerm ?? "");
  const [internalInsuranceTerm, setInternalInsuranceTerm] = React.useState(defaultValues?.insuranceTerm ?? "");
  const [internalDocumentRequirement, setInternalDocumentRequirement] = React.useState(defaultValues?.documentRequirement ?? "");
  const [internalBankInfo, setInternalBankInfo] = React.useState(defaultValues?.bankInfo ?? "");
  const [internalMoreOrLessPercent, setInternalMoreOrLessPercent] = React.useState<string>(
    defaultValues?.moreOrLessPercent != null ? String(defaultValues.moreOrLessPercent) : ""
  );
  const [internalItems, setInternalItems] = React.useState<ContractItemInput[]>(
    defaultValues?.items?.length ? defaultValues.items : defaultItems
  );

  const customerId = isControlled ? (controlledValue.customerId ?? "") : internalCustomerId;
  const contractType = isControlled ? (controlledValue.contractType ?? "FILM") : internalContractType;
  const currency = isControlled ? (controlledValue.currency ?? "USD") : internalCurrency;
  const paymentMethod = isControlled ? (controlledValue.paymentMethod ?? "") : internalPaymentMethod;
  const depositRatio = isControlled ? (controlledValue.depositRatio != null ? String(controlledValue.depositRatio) : "") : internalDepositRatio;
  const paymentTerm = isControlled ? (controlledValue.paymentTerm ?? "") : internalPaymentTerm;
  const incoterm = isControlled ? (controlledValue.incoterm ?? "") : internalIncoterm;
  const estimatedShipmentDate = isControlled ? (controlledValue.estimatedShipmentDate ?? "") : internalEstimatedShipmentDate;
  const portOfShipment = isControlled ? (controlledValue.portOfShipment ?? "") : internalPortOfShipment;
  const portOfDestination = isControlled ? (controlledValue.portOfDestination ?? "") : internalPortOfDestination;
  const partialShipment = isControlled ? (controlledValue.partialShipment ?? "ALLOWED") : internalPartialShipment;
  const transhipment = isControlled ? (controlledValue.transhipment ?? "ALLOWED") : internalTranshipment;
  const packingTerm = isControlled ? (controlledValue.packingTerm ?? "") : internalPackingTerm;
  const insuranceTerm = isControlled ? (controlledValue.insuranceTerm ?? "") : internalInsuranceTerm;
  const documentRequirement = isControlled ? (controlledValue.documentRequirement ?? "") : internalDocumentRequirement;
  const bankInfo = isControlled ? (controlledValue.bankInfo ?? "") : internalBankInfo;
  const moreOrLessPercentStr = isControlled
    ? (controlledValue.moreOrLessPercent != null ? String(controlledValue.moreOrLessPercent) : "")
    : internalMoreOrLessPercent;
  const items = isControlled ? (controlledValue.items ?? defaultItems) : internalItems;

  function setCustomerId(v: string) {
    if (isControlled) controlledOnChange({ customerId: v });
    else setInternalCustomerId(v);
  }
  function setContractType(v: ContractType) {
    if (isControlled) controlledOnChange({ contractType: v });
    else setInternalContractType(v);
  }
  function setCurrency(v: string) {
    if (isControlled) controlledOnChange({ currency: v });
    else setInternalCurrency(v);
  }
  function setPaymentMethod(v: string) {
    if (isControlled) controlledOnChange({ paymentMethod: (v || undefined) as ContractFormData["paymentMethod"] });
    else { setInternalPaymentMethod(v); if (v !== "TT") setInternalDepositRatio(""); }
  }
  function setDepositRatio(v: string) {
    const n = v === "" ? undefined : Number(v);
    if (isControlled) controlledOnChange({ depositRatio: n });
    else setInternalDepositRatio(v);
  }
  function setPaymentTerm(v: string) {
    if (isControlled) controlledOnChange({ paymentTerm: v });
    else setInternalPaymentTerm(v);
  }
  function setIncoterm(v: string) {
    if (isControlled) controlledOnChange({ incoterm: v });
    else setInternalIncoterm(v);
  }
  function setEstimatedShipmentDate(v: string) {
    if (isControlled) controlledOnChange({ estimatedShipmentDate: v });
    else setInternalEstimatedShipmentDate(v);
  }
  function setPortOfShipment(v: string) {
    if (isControlled) controlledOnChange({ portOfShipment: v });
    else setInternalPortOfShipment(v);
  }
  function setPortOfDestination(v: string) {
    if (isControlled) controlledOnChange({ portOfDestination: v });
    else setInternalPortOfDestination(v);
  }
  function setPartialShipment(v: string) {
    if (isControlled) controlledOnChange({ partialShipment: (v || undefined) as ContractFormData["partialShipment"] });
    else setInternalPartialShipment(v);
  }
  function setTranshipment(v: string) {
    if (isControlled) controlledOnChange({ transhipment: (v || undefined) as ContractFormData["transhipment"] });
    else setInternalTranshipment(v);
  }
  function setPackingTerm(v: string) {
    if (isControlled) controlledOnChange({ packingTerm: v });
    else setInternalPackingTerm(v);
  }
  function setInsuranceTerm(v: string) {
    if (isControlled) controlledOnChange({ insuranceTerm: v });
    else setInternalInsuranceTerm(v);
  }
  function setDocumentRequirement(v: string) {
    if (isControlled) controlledOnChange({ documentRequirement: v });
    else setInternalDocumentRequirement(v);
  }
  function setBankInfo(v: string) {
    if (isControlled) controlledOnChange({ bankInfo: v });
    else setInternalBankInfo(v);
  }
  function setMoreOrLessPercent(v: string) {
    const n = v === "" ? undefined : Number(v);
    if (isControlled) controlledOnChange({ moreOrLessPercent: n });
    else setInternalMoreOrLessPercent(v);
  }
  function setItems(updater: React.SetStateAction<ContractItemInput[]>) {
    if (isControlled) {
      const next = typeof updater === "function" ? updater(controlledValue.items ?? defaultItems) : updater;
      controlledOnChange({ items: next });
    } else {
      setInternalItems(updater);
    }
  }

  useEffect(() => {
    const c = customers.find((x) => x.id === customerId);
    if (!c) return;
    if (c.defaultPortOfShipment && (portOfShipment === "" || portOfShipment == null)) {
      if (isControlled) controlledOnChange({ portOfShipment: c.defaultPortOfShipment });
      else setInternalPortOfShipment(c.defaultPortOfShipment);
    }
    if (c.defaultPortOfDestination && (portOfDestination === "" || portOfDestination == null)) {
      if (isControlled) controlledOnChange({ portOfDestination: c.defaultPortOfDestination });
      else setInternalPortOfDestination(c.defaultPortOfDestination);
    }
  }, [customerId, portOfShipment, portOfDestination, isControlled, controlledOnChange, customers]);

  async function onQuotationChange(quotationId: string) {
    if (!quotationId) return;
    const data = await fetchQuotationData(quotationId);
    if (data) {
      if (isControlled) {
        controlledOnChange({
          customerId: data.customerId,
          currency: data.currency,
          paymentTerm: data.paymentTerm ?? "",
          incoterm: data.incoterm ?? "",
          portOfShipment: (controlledValue?.portOfShipment || data.portOfShipment) ?? "",
          portOfDestination: (controlledValue?.portOfDestination || data.portOfDestination) ?? "",
          items: data.items.length > 0 ? data.items : controlledValue?.items ?? defaultItems,
        });
      } else {
        setCustomerId(data.customerId);
        setCurrency(data.currency);
        setPaymentTerm(data.paymentTerm ?? "");
        setIncoterm(data.incoterm ?? "");
        if (data.portOfShipment && !portOfShipment) setInternalPortOfShipment(data.portOfShipment);
        if (data.portOfDestination && !portOfDestination) setInternalPortOfDestination(data.portOfDestination);
        if (data.items.length > 0) setItems(data.items);
      }
    }
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { productName: "", unitPrice: 0, rollQty: 0, quantityKg: 0, amount: 0, sortOrder: prev.length },
    ]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof ContractItemInput, value: string | number) {
    setItems((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, [field]: value } : r));
      const row = next[index];
      const product = row.productId ? products.find((p) => p.id === row.productId) : undefined;
      const { quantityKg, amount } = recalcContractRow(row, product, contractType);
      next[index] = { ...row, quantityKg, amount };
      return next;
    });
  }

  function onProductSelect(index: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => {
      const next = [...prev];
      const row = {
        ...next[index],
        productId: p.id,
        productName: p.name,
        category: p.category ?? undefined,
        thickness: undefined,
        width: undefined,
        length: undefined,
        unitPrice: p.defaultPrice ?? 0,
        quantityKg: 0,
        rollQty: 0,
        amount: 0,
      };
      const { quantityKg, amount } = recalcContractRow(row, p, contractType);
      next[index] = { ...row, quantityKg, amount };
      return next;
    });
  }

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const totalWeight = items.reduce((s, i) => s + (i.quantityKg || 0), 0);
  const totalRolls = items.reduce((s, i) => s + (i.rollQty || 0), 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pm = isControlled ? (controlledValue?.paymentMethod ?? "") : paymentMethod;
    const dr = isControlled ? (controlledValue?.depositRatio != null ? String(controlledValue.depositRatio) : "") : depositRatio;
    if (pm === "TT") {
      const ratio = dr === "" ? NaN : Number(dr);
      if (Number.isNaN(ratio) || ratio < 0 || ratio > 100) {
        alert("付款方式为 T/T 时，订金比例必填且须为 0～100 之间的数字");
        return;
      }
    }
    if (isControlled && controlledValue) {
      const data: ContractFormData = {
        customerId: controlledValue.customerId ?? "",
        contractDate: controlledValue.contractDate ?? "",
        contractType: controlledValue.contractType ?? "FILM",
        quotationId: controlledValue.quotationId,
        piId: controlledValue.piId,
        currency: controlledValue.currency ?? "USD",
        incoterm: controlledValue.incoterm,
        paymentMethod: (pm || undefined) as ContractFormData["paymentMethod"],
        depositRatio: pm === "TT" && dr !== "" ? Number(dr) : undefined,
        paymentTerm: controlledValue.paymentTerm,
        portOfShipment: controlledValue.portOfShipment,
        portOfDestination: controlledValue.portOfDestination,
        partialShipment: (controlledValue.partialShipment || "ALLOWED") as ContractFormData["partialShipment"],
        transhipment: (controlledValue.transhipment || "ALLOWED") as ContractFormData["transhipment"],
        estimatedShipmentDate: controlledValue.estimatedShipmentDate,
        packingTerm: controlledValue.packingTerm,
        insuranceTerm: controlledValue.insuranceTerm,
        documentRequirement: controlledValue.documentRequirement,
        bankInfo: controlledValue.bankInfo,
        moreOrLessPercent: moreOrLessPercentStr === "" ? undefined : (Number(moreOrLessPercentStr) || undefined),
        remark: controlledValue.remark,
        signStatus: controlledValue.signStatus ?? "UNSIGNED",
        executionStatus: controlledValue.executionStatus ?? "DRAFT",
        items: (controlledValue.items ?? []).map((row, idx) => {
          const product = row.productId ? products.find((p) => p.id === row.productId) : undefined;
          const { quantityKg, amount } = recalcContractRow(row, product, contractType);
          return { ...row, sortOrder: idx, quantityKg, amount };
        }),
      };
      startTransition(() => onSubmit(data));
      return;
    }
    const form = e.currentTarget;
    const formPm = (form.elements.namedItem("paymentMethod") as HTMLSelectElement)?.value || "";
    const formDr = (form.elements.namedItem("depositRatio") as HTMLInputElement)?.value ?? "";
    if (formPm === "TT") {
      const ratio = formDr === "" ? NaN : Number(formDr);
      if (Number.isNaN(ratio) || ratio < 0 || ratio > 100) {
        alert("付款方式为 T/T 时，订金比例必填且须为 0～100 之间的数字");
        return;
      }
    }
    const formContractType = (form.elements.namedItem("contractType") as HTMLSelectElement)?.value as ContractType;
    const data: ContractFormData = {
      customerId: (form.elements.namedItem("customerId") as HTMLSelectElement).value,
      contractDate: (form.elements.namedItem("contractDate") as HTMLInputElement).value,
      contractType: formContractType === "RESIN" ? "RESIN" : "FILM",
      quotationId: (form.elements.namedItem("quotationId") as HTMLSelectElement).value || undefined,
      piId: (form.elements.namedItem("piId") as HTMLSelectElement).value || undefined,
      currency: (form.elements.namedItem("currency") as HTMLSelectElement).value || "USD",
      incoterm: (form.elements.namedItem("incoterm") as HTMLInputElement).value || undefined,
      paymentMethod: (formPm || undefined) as ContractFormData["paymentMethod"],
      depositRatio: formPm === "TT" && formDr !== "" ? Number(formDr) : undefined,
      paymentTerm: (form.elements.namedItem("paymentTerm") as HTMLInputElement).value || undefined,
      portOfShipment: (form.elements.namedItem("portOfShipment") as HTMLInputElement).value || undefined,
      portOfDestination: (form.elements.namedItem("portOfDestination") as HTMLInputElement).value || undefined,
      partialShipment: ((form.elements.namedItem("partialShipment") as HTMLSelectElement).value || "ALLOWED") as ContractFormData["partialShipment"],
      transhipment: ((form.elements.namedItem("transhipment") as HTMLSelectElement).value || "ALLOWED") as ContractFormData["transhipment"],
      estimatedShipmentDate: (form.elements.namedItem("estimatedShipmentDate") as HTMLInputElement).value || undefined,
      packingTerm: (form.elements.namedItem("packingTerm") as HTMLInputElement).value || undefined,
      insuranceTerm: (form.elements.namedItem("insuranceTerm") as HTMLInputElement).value || undefined,
      documentRequirement: (form.elements.namedItem("documentRequirement") as HTMLInputElement).value || undefined,
      bankInfo: (form.elements.namedItem("bankInfo") as HTMLTextAreaElement).value || undefined,
      moreOrLessPercent: (() => {
        const raw = (form.elements.namedItem("moreOrLessPercent") as HTMLInputElement)?.value ?? "";
        if (raw === "") return undefined;
        const n = Number(raw);
        return Number.isNaN(n) ? undefined : n;
      })(),
      remark: (form.elements.namedItem("remark") as HTMLTextAreaElement).value || undefined,
      signStatus: (form.elements.namedItem("signStatus") as HTMLSelectElement).value as ContractFormData["signStatus"],
      executionStatus: (form.elements.namedItem("executionStatus") as HTMLSelectElement).value as ContractFormData["executionStatus"],
      items: items.map((row, idx) => {
        const product = row.productId ? products.find((p) => p.id === row.productId) : undefined;
        const { quantityKg, amount } = recalcContractRow(row, product, formContractType === "RESIN" ? "RESIN" : "FILM");
        return { ...row, sortOrder: idx, quantityKg, amount };
      }),
    };
    startTransition(() => onSubmit(data));
  }

  const formContractDate = isControlled ? (controlledValue.contractDate ?? "") : undefined;
  const formQuotationId = isControlled ? (controlledValue.quotationId ?? "") : undefined;
  const formSignStatus = isControlled ? (controlledValue.signStatus ?? "UNSIGNED") : undefined;
  const formExecutionStatus = isControlled ? (controlledValue.executionStatus ?? "DRAFT") : undefined;
  const formRemark = isControlled ? (controlledValue.remark ?? "") : undefined;

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <input
        type="hidden"
        name="piId"
        value={isControlled ? (controlledValue?.piId ?? "") : (defaultValues?.piId ?? "")}
        readOnly
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quotationId">来源报价单</Label>
          <select
            id="quotationId"
            name="quotationId"
            className={cn(inputClass)}
            {...(isControlled
              ? { value: formQuotationId }
              : { defaultValue: defaultValues?.quotationId ?? "" })}
            onChange={(e) => {
              const v = e.target.value;
              onQuotationChange(v);
              if (isControlled) controlledOnChange({ quotationId: v || undefined });
            }}
          >
            <option value="">不从报价单带出</option>
            {quotations.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quotationNo}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerId">客户 *</Label>
          <select
            id="customerId"
            name="customerId"
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className={cn(inputClass)}
          >
            <option value="">请选择客户</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName || c.nameEn || c.nameCn || c.customerCode}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractType">合同类型</Label>
          <select
            id="contractType"
            name="contractType"
            value={contractType}
            onChange={(e) => setContractType(e.target.value as ContractType)}
            className={cn(inputClass)}
          >
            <option value="FILM">薄膜（Film）</option>
            <option value="RESIN">树脂颗粒（Resin）</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractDate">合同日期 *</Label>
          <Input
            id="contractDate"
            name="contractDate"
            type="date"
            required
            {...(isControlled
              ? { value: formContractDate, onChange: (e) => controlledOnChange({ contractDate: e.target.value }) }
              : { defaultValue: defaultValues?.contractDate?.toString().slice(0, 10) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">币种</Label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={cn(inputClass)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">付款方式</Label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            className={cn(inputClass)}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">—</option>
            <option value="TT">T/T</option>
            <option value="LC">L/C</option>
          </select>
        </div>
        {paymentMethod === "TT" && (
          <div className="space-y-2">
            <Label htmlFor="depositRatio">订金比例 (%)</Label>
            <Input
              id="depositRatio"
              name="depositRatio"
              type="number"
              min={0}
              max={100}
              step={0.5}
              placeholder="例如 30"
              className={cn(inputClass)}
              value={depositRatio}
              onChange={(e) => setDepositRatio(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="paymentTerm">付款条款</Label>
          {templatesByType?.PAYMENT_TERM?.length ? (
            <select
              className={cn(inputClass, "mb-1")}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const t = templatesByType.PAYMENT_TERM!.find((x) => x.id === id);
                if (t) setPaymentTerm(t.content ?? "");
                e.target.value = "";
              }}
            >
              <option value="">选择模板...</option>
              {templatesByType.PAYMENT_TERM.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : null}
          <Input
            id="paymentTerm"
            name="paymentTerm"
            value={paymentTerm}
            onChange={(e) => setPaymentTerm(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incoterm">贸易条款</Label>
          {templatesByType?.INCOTERM?.length ? (
            <select
              className={cn(inputClass, "mb-1")}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const t = templatesByType.INCOTERM!.find((x) => x.id === id);
                if (t) setIncoterm(t.content ?? "");
                e.target.value = "";
              }}
            >
              <option value="">选择模板...</option>
              {templatesByType.INCOTERM.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : null}
          <Input
            id="incoterm"
            name="incoterm"
            value={incoterm}
            onChange={(e) => setIncoterm(e.target.value)}
            placeholder="CIF, FOB..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedShipmentDate">预计装运日期</Label>
          <Input
            id="estimatedShipmentDate"
            name="estimatedShipmentDate"
            type="date"
            className={cn(inputClass)}
            value={estimatedShipmentDate}
            onChange={(e) => setEstimatedShipmentDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portOfShipment">装运港</Label>
          <Input
            id="portOfShipment"
            name="portOfShipment"
            value={portOfShipment}
            onChange={(e) => setPortOfShipment(e.target.value)}
            placeholder="Port of Shipment"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portOfDestination">目的港</Label>
          <Input
            id="portOfDestination"
            name="portOfDestination"
            value={portOfDestination}
            onChange={(e) => setPortOfDestination(e.target.value)}
            placeholder="Port of Destination"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partialShipment">分批装运</Label>
          <select
            id="partialShipment"
            name="partialShipment"
            className={cn(inputClass)}
            value={partialShipment}
            onChange={(e) => setPartialShipment(e.target.value)}
          >
            {ALLOW_OPTIONS_FORM.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transhipment">转船</Label>
          <select
            id="transhipment"
            name="transhipment"
            className={cn(inputClass)}
            value={transhipment}
            onChange={(e) => setTranshipment(e.target.value)}
          >
            {ALLOW_OPTIONS_FORM.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="packingTerm">包装条款</Label>
          {templatesByType?.PACKING_TERM?.length ? (
            <select
              className={cn(inputClass, "mb-1")}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const t = templatesByType.PACKING_TERM!.find((x) => x.id === id);
                if (t) setPackingTerm(t.content ?? "");
                e.target.value = "";
              }}
            >
              <option value="">选择模板...</option>
              {templatesByType.PACKING_TERM.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : null}
          <Input
            id="packingTerm"
            name="packingTerm"
            value={packingTerm}
            onChange={(e) => setPackingTerm(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="insuranceTerm">保险条款</Label>
          {templatesByType?.INSURANCE_TERM?.length ? (
            <select
              className={cn(inputClass, "mb-1")}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const t = templatesByType.INSURANCE_TERM!.find((x) => x.id === id);
                if (t) setInsuranceTerm(t.content ?? "");
                e.target.value = "";
              }}
            >
              <option value="">选择模板...</option>
              {templatesByType.INSURANCE_TERM.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : null}
          <Input
            id="insuranceTerm"
            name="insuranceTerm"
            value={insuranceTerm}
            onChange={(e) => setInsuranceTerm(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="documentRequirement">单证要求</Label>
          {templatesByType?.DOCUMENT_REQUIREMENT?.length ? (
            <select
              className={cn(inputClass, "mb-1")}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const t = templatesByType.DOCUMENT_REQUIREMENT!.find((x) => x.id === id);
                if (t) setDocumentRequirement(t.content ?? "");
                e.target.value = "";
              }}
            >
              <option value="">选择模板...</option>
              {templatesByType.DOCUMENT_REQUIREMENT.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : null}
          <Input
            id="documentRequirement"
            name="documentRequirement"
            value={documentRequirement}
            onChange={(e) => setDocumentRequirement(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bankInfo">银行信息</Label>
          {templatesByType?.BANK_INFO?.length ? (
            <select
              className={cn(inputClass, "mb-1")}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const t = templatesByType.BANK_INFO!.find((x) => x.id === id);
                if (t) setBankInfo(t.content ?? "");
                e.target.value = "";
              }}
            >
              <option value="">选择模板...</option>
              {templatesByType.BANK_INFO.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : null}
          <Textarea
            id="bankInfo"
            name="bankInfo"
            rows={2}
            value={bankInfo}
            onChange={(e) => setBankInfo(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="moreOrLessPercent">More or Less Clause (%)</Label>
          <Input
            id="moreOrLessPercent"
            name="moreOrLessPercent"
            type="number"
            min={0}
            max={100}
            step={0.5}
            placeholder="e.g. 5"
            className={cn(inputClass)}
            value={moreOrLessPercentStr}
            onChange={(e) => setMoreOrLessPercent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signStatus">签署状态</Label>
          <select
            id="signStatus"
            name="signStatus"
            className={cn(inputClass)}
            {...(isControlled
              ? { value: formSignStatus, onChange: (e) => controlledOnChange({ signStatus: e.target.value as ContractFormData["signStatus"] }) }
              : { defaultValue: defaultValues?.signStatus ?? "UNSIGNED"})}
          >
            {SIGN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="executionStatus">执行状态</Label>
          <select
            id="executionStatus"
            name="executionStatus"
            className={cn(inputClass)}
            {...(isControlled
              ? { value: formExecutionStatus, onChange: (e) => controlledOnChange({ executionStatus: e.target.value as ContractFormData["executionStatus"] }) }
              : { defaultValue: defaultValues?.executionStatus ?? "DRAFT"})}
          >
            {EXEC_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="remark">备注</Label>
          <Textarea
            id="remark"
            name="remark"
            rows={2}
            {...(isControlled
              ? { value: formRemark, onChange: (e) => controlledOnChange({ remark: e.target.value }) }
              : { defaultValue: defaultValues?.remark })}
          />
        </div>
      </div>

      {!hideItemsTable && contractType === "FILM" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>明细（厚度μm / 宽度mm / 长度m，填规格后自动算重量与金额）</Label>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              添加行
            </Button>
          </div>
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">产品</th>
                  <th className="text-left p-2">名称</th>
                  <th className="text-left p-2">厚度</th>
                  <th className="text-left p-2">宽度</th>
                  <th className="text-left p-2">长度</th>
                  <th className="text-left p-2">单价</th>
                  <th className="text-left p-2">卷数</th>
                  <th className="text-left p-2">数量(kg)</th>
                  <th className="text-left p-2">金额</th>
                  <th className="text-left p-2">实际</th>
                  <th className="text-left p-2">确认</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-1">
                      <select
                        className={cn(inputClass, "min-w-[120px]")}
                        value={row.productId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) onProductSelect(index, v);
                        }}
                      >
                        <option value="">选择产品</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.productCode} - {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1">
                      <Input
                        className="h-9 min-w-[100px]"
                        value={row.productName}
                        onChange={(e) => updateRow(index, "productName", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        className="h-9 w-16"
                        placeholder="μm"
                        value={row.thickness ?? ""}
                        onChange={(e) => updateRow(index, "thickness", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        className="h-9 w-16"
                        placeholder="mm"
                        value={row.width ?? ""}
                        onChange={(e) => updateRow(index, "width", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        className="h-9 w-16"
                        placeholder="m"
                        value={row.length ?? ""}
                        onChange={(e) => updateRow(index, "length", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-20"
                        value={row.unitPrice || ""}
                        onChange={(e) => updateRow(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-16"
                        value={row.rollQty || ""}
                        onChange={(e) => updateRow(index, "rollQty", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-20"
                        readOnly
                        value={row.quantityKg || ""}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-20"
                        readOnly
                        value={row.amount || ""}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-16"
                        value={row.actualQty ?? ""}
                        onChange={(e) => updateRow(index, "actualQty", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-16"
                        value={row.confirmedQty ?? ""}
                        onChange={(e) => updateRow(index, "confirmedQty", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => removeRow(index)}
                        disabled={items.length <= 1}
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            合计：金额 {totalAmount.toFixed(2)} | 重量(kg) {totalWeight.toFixed(2)} | 卷数 {totalRolls.toFixed(2)}
          </div>
        </div>
      )}
      {!hideItemsTable && contractType === "RESIN" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>明细（Product Name / Unit Price / Quantity，金额 = 单价 × 数量）</Label>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              添加行
            </Button>
          </div>
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 w-10">No.</th>
                  <th className="text-left p-2 min-w-[160px]">Product Name</th>
                  <th className="text-left p-2 w-24">Unit Price</th>
                  <th className="text-left p-2 w-24">Quantity</th>
                  <th className="text-left p-2 w-24">Amount</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-1">{index + 1}</td>
                    <td className="p-1">
                      <select
                        className={cn(inputClass, "min-w-[140px]")}
                        value={row.productId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) onProductSelect(index, v);
                        }}
                      >
                        <option value="">选择或输入产品名称</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        className="h-9 min-w-[120px] mt-1"
                        placeholder="或直接输入产品名称"
                        value={row.productName}
                        onChange={(e) => updateRow(index, "productName", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-full"
                        value={row.unitPrice || ""}
                        onChange={(e) => updateRow(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-full"
                        value={row.quantityKg ?? ""}
                        onChange={(e) => updateRow(index, "quantityKg", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 w-full"
                        readOnly
                        value={row.amount != null ? row.amount.toFixed(2) : ""}
                      />
                    </td>
                    <td className="p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => removeRow(index)}
                        disabled={items.length <= 1}
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            合计金额：{totalAmount.toFixed(2)}
          </div>
        </div>
      )}

      {!hideSubmitButton && (
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : submitLabel}
        </Button>
      )}
    </form>
  );
});
