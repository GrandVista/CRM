"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentTemplate } from "@prisma/client";
import type { TemplateType } from "@prisma/client";
import { getTemplateTypeLabel, TEMPLATE_TYPES } from "@/lib/template-utils";

type Props = {
  grouped: Record<TemplateType, DocumentTemplate[]>;
  onEdit: (t: DocumentTemplate) => void;
  onDelete: (t: DocumentTemplate) => void;
  onSetDefault: (t: DocumentTemplate) => void;
};

export function TemplateList({ grouped, onEdit, onDelete, onSetDefault }: Props) {
  return (
    <div className="space-y-6">
      {TEMPLATE_TYPES.map((type) => {
        const items = grouped[type] ?? [];
        return (
          <Card key={type}>
            <CardHeader className="py-3">
              <CardTitle className="text-base">{getTemplateTypeLabel(type)}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无模板</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{t.name}</span>
                        {t.isDefault && (
                          <span className="ml-2 text-xs text-muted-foreground">(默认)</span>
                        )}
                        {t.content && (
                          <p className="mt-1 text-muted-foreground line-clamp-2">{t.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!t.isDefault && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onSetDefault(t)}
                          >
                            设为默认
                          </Button>
                        )}
                        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(t)}>
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(t)}
                        >
                          删除
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
