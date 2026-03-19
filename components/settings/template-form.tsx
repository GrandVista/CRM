"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DocumentTemplate } from "@prisma/client";
import type { TemplateType } from "@prisma/client";
import { getTemplateTypeLabel, TEMPLATE_TYPES } from "@/lib/template-utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Props = {
  initial?: DocumentTemplate | null;
  templateType?: TemplateType | null;
  onSave: (data: {
    name: string;
    templateType: TemplateType;
    content: string | null;
    isDefault: boolean;
  }) => Promise<unknown>;
  onCancel?: () => void;
};

export function TemplateForm({ initial, templateType, onSave, onCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initial?.id;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const type = (form.elements.namedItem("templateType") as HTMLSelectElement).value as TemplateType;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value.trim() || null;
    const isDefault = (form.elements.namedItem("isDefault") as HTMLInputElement).checked;
    startTransition(() => {
      void onSave({ name, templateType: type, content, isDefault });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4 bg-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="templateType">模板类型 *</Label>
          <select
            id="templateType"
            name="templateType"
            required
            disabled={isEdit}
            className={cn(inputClass)}
            defaultValue={initial?.templateType ?? templateType ?? ""}
          >
            <option value="">请选择</option>
            {TEMPLATE_TYPES.map((t) => (
              <option key={t} value={t}>
                {getTemplateTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">模板名称 *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="如：T/T 30% 预付"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">内容</Label>
        <Textarea
          id="content"
          name="content"
          rows={4}
          defaultValue={initial?.content ?? ""}
          placeholder="条款内容，选择此模板时将带入合同"
          className="resize-y"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          defaultChecked={initial?.isDefault ?? false}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isDefault" className="font-normal cursor-pointer">
          设为该类型的默认模板（新建合同时自动带出）
        </Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : isEdit ? "保存" : "新增"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
      </div>
    </form>
  );
}
