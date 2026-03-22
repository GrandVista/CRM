"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResinOrderFormData } from "@/lib/actions/resin-orders";
import { formatAmount } from "@/lib/numbers";

type CustomerOption = {
  id: string;
  shortName: string | null;
  nameEn: string | null;
  nameCn: string | null;
};

type Props = {
  customers: CustomerOption[];
  defaultValues?: Partial<ResinOrderFormData>;
  submitLabel: string;
  onSubmit: (data: ResinOrderFormData) => Promise<void>;
};

export function ResinOrderForm({ customers, defaultValues, submitLabel, onSubmit }: Props) {
  const [isPending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState(defaultValues?.customerId ?? "");
  const [customerName, setCustomerName] = useState(defaultValues?.customerName ?? "");
  const [productName, setProductName] = useState(defaultValues?.productName ?? "");
  const [grade, setGrade] = useState(defaultValues?.grade ?? "");
  const [quantity, setQuantity] = useState(String(defaultValues?.quantity ?? 0));
  const [unit, setUnit] = useState(defaultValues?.unit ?? "KG");
  const [unitPrice, setUnitPrice] = useState(String(defaultValues?.unitPrice ?? 0));
  const [currency, setCurrency] = useState(defaultValues?.currency ?? "USD");
  const [orderDate, setOrderDate] = useState(defaultValues?.orderDate ?? new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState(defaultValues?.deliveryDate ?? "");
  const [warehouse, setWarehouse] = useState(defaultValues?.warehouse ?? "");
  const [destination, setDestination] = useState(defaultValues?.destination ?? "");
  const [contactPerson, setContactPerson] = useState(defaultValues?.contactPerson ?? "");
  const [contactPhone, setContactPhone] = useState(defaultValues?.contactPhone ?? "");
  const [remarks, setRemarks] = useState(defaultValues?.remarks ?? "");

  const computedReceivable = useMemo(() => {
    const q = Number(quantity) || 0;
    const p = Number(unitPrice) || 0;
    return q * p;
  }, [quantity, unitPrice]);

  function onCustomerChange(v: string) {
    setCustomerId(v);
    const customer = customers.find((c) => c.id === v);
    if (customer) {
      const name = customer.shortName || customer.nameEn || customer.nameCn || "";
      setCustomerName(name);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!customerId || !productName || !orderDate) {
      alert("请填写必填字段");
      return;
    }
    const q = Number(quantity) || 0;
    const up = Number(unitPrice) || 0;
    const payload: ResinOrderFormData = {
      customerId,
      customerName,
      productName,
      grade: grade || undefined,
      quantity: q,
      unit: unit || "KG",
      unitPrice: up,
      currency: currency || "USD",
      totalAmount: q * up,
      orderDate,
      deliveryDate: deliveryDate || undefined,
      warehouse: warehouse || undefined,
      destination: destination || undefined,
      contactPerson: contactPerson || undefined,
      contactPhone: contactPhone || undefined,
      remarks: remarks || undefined,
    };
    startTransition(async () => {
      await onSubmit(payload);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>客户 *</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={customerId}
            onChange={(e) => onCustomerChange(e.target.value)}
          >
            <option value="">请选择客户</option>
            {customers.map((c: CustomerOption) => (
              <option key={c.id} value={c.id}>
                {c.shortName || c.nameEn || c.nameCn || c.id}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>客户名称 *</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>产品名称 *</Label>
          <Input value={productName} onChange={(e) => setProductName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>牌号/型号</Label>
          <Input value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>总量 *</Label>
          <Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>单位</Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="KG">KG</option>
            <option value="MT">MT</option>
            <option value="TON">TON</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>单价 *</Label>
          <Input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>币种</Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="CNY">CNY</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>订单应收总额（自动）</Label>
          <p className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium">
            {formatAmount(computedReceivable, currency || "USD")}
            <span className="ml-2 text-xs font-normal text-muted-foreground">总量 × 单价</span>
          </p>
        </div>
        <div className="space-y-2">
          <Label>订单日期 *</Label>
          <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>计划交货日期</Label>
          <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>仓库/发货地点</Label>
          <Input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>收货地点</Label>
          <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>联系人</Label>
          <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>联系电话</Label>
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>备注</Label>
          <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : submitLabel}
      </Button>
    </form>
  );
}
