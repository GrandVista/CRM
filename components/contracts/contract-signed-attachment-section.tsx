"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CONTRACT_ATTACHMENT_CATEGORY } from "@/lib/contract-attachment-constants";
import { MAX_SIGNED_CONTRACT_PDF_SIZE } from "@/lib/contract-attachment-constants";

const MAX_MB = MAX_SIGNED_CONTRACT_PDF_SIZE / 1024 / 1024;

export type ContractAttachmentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  category: string;
  uploadedAt: Date;
};

type Props = {
  contractId: string;
  signStatus: string;
  attachments: ContractAttachmentItem[];
  onAttachmentsChange: (list: ContractAttachmentItem[]) => void;
  disabled?: boolean;
};

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContractSignedAttachmentSection({
  contractId,
  signStatus,
  attachments,
  onAttachmentsChange,
  disabled,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [replacingId, setReplacingId] = React.useState<string | null>(null);

  const signedList = attachments.filter((a) => a.category === CONTRACT_ATTACHMENT_CATEGORY.SIGNED_CONTRACT);
  const isSigned = signStatus === "SIGNED";
  const canDelete = !isSigned || signedList.length > 1;

  const doUpload = (file: File, replaceId: string | null) => {
    if (file.type !== "application/pdf") {
      setUploadError("仅允许上传 PDF 文件");
      return;
    }
    if (file.size > MAX_SIGNED_CONTRACT_PDF_SIZE) {
      setUploadError(`文件大小不能超过 ${MAX_MB}MB`);
      return;
    }
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    fetch(`/api/contracts/${contractId}/attachments`, {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(new Error(b.error ?? "上传失败")));
        return res.json();
      })
      .then((att: ContractAttachmentItem) => {
        const next = replaceId
          ? [...attachments.filter((a) => a.id !== replaceId), att]
          : [...attachments, att];
        onAttachmentsChange(next);
        if (replaceId) {
          return fetch(`/api/contracts/${contractId}/attachments/${replaceId}`, { method: "DELETE" });
        }
      })
      .catch((err: Error) => {
        setUploadError(err.message ?? "上传失败");
      })
      .finally(() => {
        setUploading(false);
        setReplacingId(null);
      });
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    doUpload(file, replacingId);
  };

  const handleDelete = (attachmentId: string) => {
    if (!canDelete && signedList.length <= 1) return;
    fetch(`/api/contracts/${contractId}/attachments/${attachmentId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("删除失败");
        onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
      })
      .catch(() => {
        setUploadError("删除失败");
      });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          已签署合同 PDF 留档
          {isSigned && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      {isSigned && signedList.length === 0 && (
        <p className="text-sm text-destructive">签署状态为「已签署」时，必须上传已签署合同 PDF</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleSelectFile}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(inputClass, "w-auto")}
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "上传中…" : "上传 PDF"}
        </Button>
        <span className="text-xs text-muted-foreground">仅 PDF，最大 {MAX_MB}MB</span>
      </div>
      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}
      {signedList.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {signedList.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
            >
              <span className="truncate flex-1 min-w-0" title={att.fileName}>
                {att.fileName}
              </span>
              <a
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline shrink-0"
              >
                查看
              </a>
              <a
                href={att.fileUrl}
                download={att.fileName}
                className="text-primary hover:underline shrink-0"
              >
                下载
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0"
                disabled={disabled || uploading}
                onClick={() => {
                  setReplacingId(att.id);
                  fileInputRef.current?.click();
                }}
              >
                替换
              </Button>
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive shrink-0"
                  disabled={disabled || uploading}
                  onClick={() => handleDelete(att.id)}
                >
                  删除
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
