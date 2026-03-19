"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TemplateForm } from "@/components/settings/template-form";
import { TemplateList } from "@/components/settings/template-list";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from "@/lib/actions/templates";
import type { DocumentTemplate } from "@prisma/client";
import type { TemplateType } from "@prisma/client";

type Grouped = Record<TemplateType, DocumentTemplate[]>;

type Props = {
  initialGrouped: Grouped;
};

export function TemplatesPageClient({ initialGrouped }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);

  async function handleCreate(data: {
    name: string;
    templateType: TemplateType;
    content: string | null;
    isDefault: boolean;
  }) {
    await createTemplate(data);
    setShowAdd(false);
    router.refresh();
  }

  async function handleUpdate(data: {
    name: string;
    templateType: TemplateType;
    content: string | null;
    isDefault: boolean;
  }) {
    if (!editing) return;
    await updateTemplate(editing.id, {
      name: data.name,
      content: data.content,
      isDefault: data.isDefault,
    });
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(t: DocumentTemplate) {
    if (!confirm(`确定删除模板「${t.name}」？`)) return;
    await deleteTemplate(t.id);
    router.refresh();
  }

  async function handleSetDefault(t: DocumentTemplate) {
    await setDefaultTemplate(t.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          在合同编辑页可选择模板快速填入付款、装运、单证等条款；保存时保存的是合同中的最终文本。
        </p>
        {!showAdd && !editing && (
          <Button onClick={() => setShowAdd(true)}>新增模板</Button>
        )}
      </div>

      {showAdd && (
        <TemplateForm
          onSave={handleCreate}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {editing && (
        <TemplateForm
          initial={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      <TemplateList
        grouped={initialGrouped}
        onEdit={setEditing}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />
    </div>
  );
}
