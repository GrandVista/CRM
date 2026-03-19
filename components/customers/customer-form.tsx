"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CustomerFormData } from "@/lib/actions/customers";

type Props = {
  defaultValues?: Partial<CustomerFormData> & { id?: string };
  onSubmit: (data: CustomerFormData) => Promise<void>;
  submitLabel?: string;
};

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function CustomerForm({ defaultValues, onSubmit, submitLabel = "保存" }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data: CustomerFormData = {
      customerCode: (form.elements.namedItem("customerCode") as HTMLInputElement).value,
      nameCn: (form.elements.namedItem("nameCn") as HTMLInputElement).value || undefined,
      nameEn: (form.elements.namedItem("nameEn") as HTMLInputElement).value || undefined,
      shortName: (form.elements.namedItem("shortName") as HTMLInputElement).value || undefined,
      country: (form.elements.namedItem("country") as HTMLInputElement).value || undefined,
      city: (form.elements.namedItem("city") as HTMLInputElement).value || undefined,
      address: (form.elements.namedItem("address") as HTMLInputElement).value || undefined,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value || undefined,
      email: (form.elements.namedItem("email") as HTMLInputElement).value || undefined,
      website: (form.elements.namedItem("website") as HTMLInputElement).value || undefined,
      taxNo: (form.elements.namedItem("taxNo") as HTMLInputElement).value || undefined,
      contactPerson: (form.elements.namedItem("contactPerson") as HTMLInputElement).value || undefined,
      contactTitle: (form.elements.namedItem("contactTitle") as HTMLInputElement).value || undefined,
      defaultCurrency: (form.elements.namedItem("defaultCurrency") as HTMLSelectElement)?.value || "USD",
      defaultPaymentTerm: (form.elements.namedItem("defaultPaymentTerm") as HTMLInputElement).value || undefined,
      defaultIncoterm: (form.elements.namedItem("defaultIncoterm") as HTMLInputElement).value || undefined,
      defaultPortOfShipment: (form.elements.namedItem("defaultPortOfShipment") as HTMLInputElement).value || undefined,
      defaultPortOfDestination: (form.elements.namedItem("defaultPortOfDestination") as HTMLInputElement).value || undefined,
      defaultInsuranceTerm: (form.elements.namedItem("defaultInsuranceTerm") as HTMLInputElement).value || undefined,
      defaultPackingTerm: (form.elements.namedItem("defaultPackingTerm") as HTMLInputElement).value || undefined,
      defaultDocumentRequirement: (form.elements.namedItem("defaultDocumentRequirement") as HTMLInputElement).value || undefined,
      customerLevel: (form.elements.namedItem("customerLevel") as HTMLInputElement).value || undefined,
      status: (form.elements.namedItem("status") as HTMLSelectElement)?.value || "ACTIVE",
      remark: (form.elements.namedItem("remark") as HTMLTextAreaElement).value || undefined,
    };
    startTransition(() => onSubmit(data));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerCode">客户编号 *</Label>
          <Input
            id="customerCode"
            name="customerCode"
            required
            defaultValue={defaultValues?.customerCode}
            placeholder="CUS001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "ACTIVE"}
            className={cn(inputClass)}
          >
            <option value="ACTIVE">有效</option>
            <option value="INACTIVE">无效</option>
            <option value="PENDING">待定</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nameCn">中文名称</Label>
          <Input id="nameCn" name="nameCn" defaultValue={defaultValues?.nameCn} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameEn">英文名称</Label>
          <Input id="nameEn" name="nameEn" defaultValue={defaultValues?.nameEn} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortName">简称</Label>
        <Input id="shortName" name="shortName" defaultValue={defaultValues?.shortName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">国家</Label>
          <Input id="country" name="country" defaultValue={defaultValues?.country} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">城市</Label>
          <Input id="city" name="city" defaultValue={defaultValues?.city} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">地址</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">电话</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">网站</Label>
        <Input id="website" name="website" type="url" defaultValue={defaultValues?.website} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">联系人</Label>
          <Input id="contactPerson" name="contactPerson" defaultValue={defaultValues?.contactPerson} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactTitle">联系人职位</Label>
          <Input id="contactTitle" name="contactTitle" defaultValue={defaultValues?.contactTitle} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxNo">税号</Label>
        <Input id="taxNo" name="taxNo" defaultValue={defaultValues?.taxNo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="defaultCurrency">默认币种</Label>
          <select
            id="defaultCurrency"
            name="defaultCurrency"
            defaultValue={defaultValues?.defaultCurrency ?? "USD"}
            className={cn(inputClass)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerLevel">客户等级</Label>
          <Input id="customerLevel" name="customerLevel" defaultValue={defaultValues?.customerLevel} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultPaymentTerm">默认付款条款</Label>
        <Input id="defaultPaymentTerm" name="defaultPaymentTerm" defaultValue={defaultValues?.defaultPaymentTerm} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultIncoterm">默认贸易条款</Label>
        <Input id="defaultIncoterm" name="defaultIncoterm" defaultValue={defaultValues?.defaultIncoterm} placeholder="e.g. CIF, FOB" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="defaultPortOfShipment">默认装运港</Label>
          <Input id="defaultPortOfShipment" name="defaultPortOfShipment" defaultValue={defaultValues?.defaultPortOfShipment} placeholder="Port of Shipment" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultPortOfDestination">默认目的港</Label>
          <Input id="defaultPortOfDestination" name="defaultPortOfDestination" defaultValue={defaultValues?.defaultPortOfDestination} placeholder="Port of Destination" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultInsuranceTerm">默认保险条款</Label>
        <Input id="defaultInsuranceTerm" name="defaultInsuranceTerm" defaultValue={defaultValues?.defaultInsuranceTerm} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultPackingTerm">默认包装条款</Label>
        <Input id="defaultPackingTerm" name="defaultPackingTerm" defaultValue={defaultValues?.defaultPackingTerm} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultDocumentRequirement">默认单证要求</Label>
        <Input id="defaultDocumentRequirement" name="defaultDocumentRequirement" defaultValue={defaultValues?.defaultDocumentRequirement} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remark">备注</Label>
        <Textarea id="remark" name="remark" rows={3} defaultValue={defaultValues?.remark} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
