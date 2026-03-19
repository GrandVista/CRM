"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAX_SIGNED_CONTRACT_PDF_SIZE } from "@/lib/contract-attachment-constants";

const MAX_MB = MAX_SIGNED_CONTRACT_PDF_SIZE / 1024 / 1024;

type Props = {
  contractId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 上传成功后回调（如刷新列表） */
  onSuccess: () => void;
  /** 替换模式：上传成功后删除的附件 id */
  replaceAttachmentId?: string | null;
};

export function ContractPdfUploadDialog({
  contractId,
  open,
  onOpenChange,
  onSuccess,
  replaceAttachmentId,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isReplace = Boolean(replaceAttachmentId);

  const handleOpenChange = (next: boolean) => {
    if (!next && !isUploading) {
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("请选择 PDF 文件");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("仅允许上传 PDF 文件");
      return;
    }
    if (file.size > MAX_SIGNED_CONTRACT_PDF_SIZE) {
      setError(`文件大小不能超过 ${MAX_MB}MB`);
      return;
    }
    setError(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.set("file", file);

    fetch(`/api/contracts/${contractId}/attachments`, {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((b) => Promise.reject(new Error(b.error ?? "上传失败")));
        }
        return res.json();
      })
      .then(() => {
        if (replaceAttachmentId) {
          return fetch(`/api/contracts/${contractId}/attachments/${replaceAttachmentId}`, {
            method: "DELETE",
          }).then((r) => {
            if (!r.ok) throw new Error("替换时删除旧文件失败");
          });
        }
      })
      .then(() => {
        handleOpenChange(false);
        onSuccess();
      })
      .catch((err: Error) => {
        setError(err.message ?? "上传失败");
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showClose={!isUploading}>
        <DialogHeader>
          <DialogTitle>{isReplace ? "替换已签署合同 PDF" : "上传已签署合同 PDF"}</DialogTitle>
          <DialogDescription>
            仅支持 PDF 文件，大小不超过 {MAX_MB}MB。上传后将作为该合同的已签署留档。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="w-full text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground file:font-medium"
            disabled={isUploading}
            onChange={() => setError(null)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            取消
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? "上传中…" : isReplace ? "替换" : "上传"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
