"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** 编辑页仅展示已签署合同 PDF，不上传/替换；主入口在合同列表页 */
export type SignedAttachmentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
};

type Props = {
  attachments: SignedAttachmentItem[];
};

export function ContractSignedAttachmentView({ attachments }: Props) {
  if (attachments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <p className="text-sm font-medium">已签署合同 PDF 留档</p>
        <p className="text-sm text-muted-foreground">暂无留档。上传或替换请在合同列表页操作。</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/contracts">前往合同列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <p className="text-sm font-medium">已签署合同 PDF 留档</p>
      <ul className="space-y-1.5 text-sm">
        {attachments.map((att) => (
          <li key={att.id} className="flex items-center gap-2">
            <span className="truncate flex-1 min-w-0" title={att.fileName}>
              {att.fileName}
            </span>
            <Button variant="outline" size="sm" asChild>
              <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                查看
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={att.fileUrl} download={att.fileName}>
                下载
              </a>
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">上传或替换请在合同列表页操作。</p>
    </div>
  );
}
