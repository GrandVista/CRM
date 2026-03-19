"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePackingList } from "@/lib/actions/packing-lists";

type Props = {
  id: string;
  clNo?: string;
};

export function DeletePlButton({ id }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startTransition] = useTransition();

  function handleOpen() {
    setError(null);
    setOpen(true);
  }

  function handleConfirm() {
    startTransition(async () => {
      setError(null);
      try {
        await deletePackingList(id);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "删除失败");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleOpen}
      >
        删除
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null); }}>
        <DialogContent showClose={true}>
          <DialogHeader>
            <DialogTitle>确认删除这张 PL 吗？</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1">
                <p>此操作不可撤销。</p>
                {error && <p className="text-destructive font-medium">{error}</p>}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
              {isDeleting ? "删除中…" : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
