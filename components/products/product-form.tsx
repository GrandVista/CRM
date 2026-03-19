"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProductFormData } from "@/lib/actions/products";

type Props = {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel?: string;
};

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function ProductForm({ defaultValues, onSubmit, submitLabel = "保存" }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data: ProductFormData = {
      productCode: (form.elements.namedItem("productCode") as HTMLInputElement).value,
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      category: (form.elements.namedItem("category") as HTMLInputElement).value || undefined,
      material: (form.elements.namedItem("material") as HTMLInputElement).value || undefined,
      density: parseFloat((form.elements.namedItem("density") as HTMLInputElement).value) || undefined,
      unit: (form.elements.namedItem("unit") as HTMLInputElement).value || "kg",
      defaultPrice: parseFloat((form.elements.namedItem("defaultPrice") as HTMLInputElement).value) || undefined,
      currency: (form.elements.namedItem("currency") as HTMLSelectElement)?.value || "USD",
      weightFormulaType: (form.elements.namedItem("weightFormulaType") as HTMLInputElement).value || undefined,
      pricingMethod: (form.elements.namedItem("pricingMethod") as HTMLInputElement).value || undefined,
      packingMethod: (form.elements.namedItem("packingMethod") as HTMLInputElement).value || undefined,
      remark: (form.elements.namedItem("remark") as HTMLTextAreaElement).value || undefined,
      isActive: (form.elements.namedItem("isActive") as HTMLInputElement)?.checked ?? true,
    };
    startTransition(() => onSubmit(data));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="productCode">产品编号 *</Label>
          <Input id="productCode" name="productCode" required defaultValue={defaultValues?.productCode} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">产品名称 *</Label>
          <Input id="name" name="name" required defaultValue={defaultValues?.name} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">类别</Label>
          <Input id="category" name="category" defaultValue={defaultValues?.category} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="material">材质</Label>
          <Input id="material" name="material" defaultValue={defaultValues?.material} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="density">密度 (g/cm³)</Label>
          <Input id="density" name="density" type="number" step="any" defaultValue={defaultValues?.density} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">单位</Label>
          <select id="unit" name="unit" defaultValue={defaultValues?.unit ?? "kg"} className={cn(inputClass)}>
            <option value="kg">kg</option>
            <option value="pcs">pcs</option>
            <option value="roll">roll</option>
            <option value="m">m</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="defaultPrice">默认单价</Label>
          <Input id="defaultPrice" name="defaultPrice" type="number" step="0.01" defaultValue={defaultValues?.defaultPrice} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">币种</Label>
          <select id="currency" name="currency" defaultValue={defaultValues?.currency ?? "USD"} className={cn(inputClass)}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="weightFormulaType">重量公式类型</Label>
          <Input id="weightFormulaType" name="weightFormulaType" defaultValue={defaultValues?.weightFormulaType} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricingMethod">计价方式</Label>
          <Input id="pricingMethod" name="pricingMethod" defaultValue={defaultValues?.pricingMethod} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="packingMethod">包装方式</Label>
        <Input id="packingMethod" name="packingMethod" defaultValue={defaultValues?.packingMethod} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="remark">备注</Label>
        <Textarea id="remark" name="remark" rows={3} defaultValue={defaultValues?.remark} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          defaultChecked={defaultValues?.isActive ?? true}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isActive">启用</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
