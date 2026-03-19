"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateContractStatus, deleteContract } from "@/lib/actions/contracts";
import { formatDate } from "@/lib/utils/date";
import { formatAmount } from "@/lib/numbers";
import { EXEC_OPTIONS } from "@/lib/constants/execution-status";
import { ContractPdfUploadDialog } from "@/components/contracts/contract-pdf-upload-dialog";
import type { SignStatus, ExecutionStatus } from "@prisma/client";

const SIGN_OPTIONS: { value: SignStatus; label: string }[] = [
  { value: "UNSIGNED", label: "未签署" },
  { value: "SIGNED", label: "已签署" },
  { value: "VOIDED", label: "作废" },
];

type ContractRow = {
  id: string;
  contractNo: string;
  contractDate: Date | string;
  totalAmount: number;
  currency: string;
  signStatus: SignStatus;
  executionStatus: ExecutionStatus;
  customer: { shortName: string | null; nameEn: string | null; nameCn: string | null } | null;
  attachments?: { id: string; fileName: string; fileUrl: string }[];
};

export function ContractListRow({ contract }: { contract: ContractRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [signStatus, setSignStatus] = useState<SignStatus>(contract.signStatus);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(contract.executionStatus);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfDialogReplaceId, setPdfDialogReplaceId] = useState<string | null>(null);

  const hasChange =
    signStatus !== contract.signStatus || executionStatus !== contract.executionStatus;
  const signedAttachments = contract.attachments ?? [];
  const hasPdf = signedAttachments.length > 0;
  const firstPdf = signedAttachments[0];
  const needsPdfForSigned = signStatus === "SIGNED" && !hasPdf;

  function handleUpdate() {
    if (!hasChange) return;
    if (signStatus === "SIGNED" && !hasPdf) {
      setMessage({ type: "error", text: "合同状态为已签署时，必须上传已签署合同 PDF" });
      return;
    }
    startTransition(async () => {
      setMessage(null);
      try {
        await updateContractStatus(contract.id, { signStatus, executionStatus });
        setMessage({ type: "success", text: "已更新" });
        router.refresh();
        setTimeout(() => setMessage(null), 2000);
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "更新失败",
        });
      }
    });
  }

  function openPdfUpload(replaceId?: string) {
    setPdfDialogReplaceId(replaceId ?? null);
    setPdfDialogOpen(true);
  }

  function onPdfSuccess() {
    router.refresh();
  }

  const customerName =
    contract.customer?.shortName || contract.customer?.nameEn || contract.customer?.nameCn || "-";

  function handleDeleteClick() {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    startDeleteTransition(async () => {
      setDeleteError(null);
      try {
        await deleteContract(contract.id);
        setDeleteDialogOpen(false);
        router.refresh();
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "删除失败");
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{contract.contractNo}</TableCell>
      <TableCell>{customerName}</TableCell>
      <TableCell>{formatDate(contract.contractDate)}</TableCell>
      <TableCell>{formatAmount(contract.totalAmount, contract.currency)}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Select
              value={signStatus}
              onValueChange={(v) => setSignStatus(v as SignStatus)}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIGN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasPdf && (
              <span className="text-xs text-muted-foreground" title="已上传签署合同 PDF">
                已归档
              </span>
            )}
          </div>
          {needsPdfForSigned && (
            <span className="text-xs text-destructive">需上传 PDF</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={executionStatus}
          onValueChange={(v) => setExecutionStatus(v as ExecutionStatus)}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXEC_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasChange || isPending}
            onClick={handleUpdate}
          >
            {isPending ? "更新中…" : "更新"}
          </Button>
          {hasPdf && firstPdf ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <a href={firstPdf.fileUrl} target="_blank" rel="noopener noreferrer">
                  查看 PDF
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openPdfUpload(firstPdf.id)}
                disabled={isPending}
              >
                替换 PDF
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => openPdfUpload()}
              disabled={isPending}
            >
              上传 PDF
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href={`/contracts/${contract.id}`}>详情</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/contracts/${contract.id}/edit`}>编辑</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDeleteClick}
            disabled={isPending}
          >
            删除
          </Button>
          {message && (
            <span
              className={
                message.type === "success"
                  ? "text-sm text-green-600"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </span>
          )}
        </div>
        <ContractPdfUploadDialog
          contractId={contract.id}
          open={pdfDialogOpen}
          onOpenChange={setPdfDialogOpen}
          onSuccess={onPdfSuccess}
          replaceAttachmentId={pdfDialogReplaceId}
        />
      </TableCell>
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteError(null); }}>
        <DialogContent showClose={true}>
          <DialogHeader>
            <DialogTitle>确认删除合同？</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1">
                <p>删除后将无法恢复。</p>
                <p className="text-muted-foreground">如果该合同已关联出货、发票、装箱单或收款记录，则不允许删除。</p>
                {contract.signStatus === "SIGNED" && (
                  <p className="text-amber-600 font-medium">已签署合同通常不建议删除，是否继续？</p>
                )}
                {deleteError && <p className="text-destructive font-medium">{deleteError}</p>}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中…" : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableRow>
  );
}
