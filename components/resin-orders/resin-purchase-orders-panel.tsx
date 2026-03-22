"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createResinPurchaseOrder,
  deleteResinPurchaseOrder,
  updateResinPurchaseOrder,
} from "@/lib/actions/resin-orders";
import { formatAmount } from "@/lib/numbers";
import { formatDate } from "@/lib/utils/date";
import type { ResinPoRollup } from "@/lib/resin-order-metrics";

export type ResinPurchaseOrderPanelRow = {
  id: string;
  customerPoNo: string;
  quantity: number;
  orderDate: Date;
  remarks: string | null;
};

type Props = {
  resinOrderId: string;
  currency: string;
  masterQuantity: number;
  purchaseOrders: ResinPurchaseOrderPanelRow[];
  rollups: ResinPoRollup[];
  isAdmin: boolean;
};

export function ResinPurchaseOrdersPanel({
  resinOrderId,
  currency,
  masterQuantity,
  purchaseOrders,
  rollups,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [panelError, setPanelError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [poNo, setPoNo] = useState("");
  const [qty, setQty] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10));
  const [poRemarks, setPoRemarks] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ResinPurchaseOrderPanelRow | null>(null);
  const [editPoNo, setEditPoNo] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  const rollupMap = new Map(rollups.map((r) => [r.purchaseOrderId, r] as const));
  const allocated = purchaseOrders.reduce((s, p) => s + p.quantity, 0);
  const remainingAlloc = masterQuantity - allocated;

  function openEdit(row: ResinPurchaseOrderPanelRow) {
    setEditing(row);
    setEditPoNo(row.customerPoNo);
    setEditQty(String(row.quantity));
    setEditDate(row.orderDate.toISOString().slice(0, 10));
    setEditRemarks(row.remarks ?? "");
    setEditOpen(true);
    setDialogError(null);
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setPanelError(null);
      try {
        await createResinPurchaseOrder(resinOrderId, {
          customerPoNo: poNo,
          quantity: Number(qty) || 0,
          orderDate: poDate,
          remarks: poRemarks || undefined,
        });
        setPoNo("");
        setQty("");
        setPoRemarks("");
        router.refresh();
      } catch (err) {
        setPanelError(err instanceof Error ? err.message : "新增失败");
      }
    });
  }

  function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      setDialogError(null);
      try {
        await updateResinPurchaseOrder(editing.id, {
          customerPoNo: editPoNo,
          quantity: Number(editQty) || 0,
          orderDate: editDate,
          remarks: editRemarks || undefined,
        });
        setEditOpen(false);
        router.refresh();
      } catch (err) {
        setDialogError(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm("确定删除该小订单？（需无发货/收款分摊）")) return;
    startTransition(async () => {
      setPanelError(null);
      try {
        await deleteResinPurchaseOrder(id);
        router.refresh();
      } catch (err) {
        setPanelError(err instanceof Error ? err.message : "删除失败");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        总量订单可分配：<span className="font-medium text-foreground">{masterQuantity.toFixed(2)}</span>
        {" · "}
        已分配小单合计：<span className="font-medium text-foreground">{allocated.toFixed(2)}</span>
        {remainingAlloc >= -1e-6 ? (
          <>
            {" · "}
            剩余可分配：<span className="font-medium text-foreground">{Math.max(0, remainingAlloc).toFixed(2)}</span>
          </>
        ) : null}
      </p>

      {isAdmin ? (
        <form onSubmit={onCreate} className="rounded-md border border-border p-4 space-y-3">
          <p className="text-sm font-medium">新增小订单（客户采购单号）</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>客户采购单号 *</Label>
              <Input value={poNo} onChange={(e) => setPoNo(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>数量 *</Label>
              <Input type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>下单日期 *</Label>
              <Input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} required />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
              <Label>备注</Label>
              <Textarea rows={2} value={poRemarks} onChange={(e) => setPoRemarks(e.target.value)} />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            添加小订单
          </Button>
        </form>
      ) : null}

      {panelError ? <p className="text-sm text-destructive">{panelError}</p> : null}

      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客户采购单号</TableHead>
              <TableHead>数量</TableHead>
              <TableHead>下单日期</TableHead>
              <TableHead>已发货</TableHead>
              <TableHead>未发货</TableHead>
              <TableHead>已收款</TableHead>
              <TableHead>未收款</TableHead>
              <TableHead>发货状态</TableHead>
              <TableHead>收款状态</TableHead>
              <TableHead>备注</TableHead>
              {isAdmin ? <TableHead className="text-right">操作</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 11 : 10} className="text-center text-muted-foreground py-6">
                  暂无小订单。请先在上方添加客户采购单号；旧数据仅主订单时可先录入发货（不按小单分摊）。
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((row: ResinPurchaseOrderPanelRow) => {
                const r = rollupMap.get(row.id);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium whitespace-nowrap">{row.customerPoNo}</TableCell>
                    <TableCell>{row.quantity.toFixed(2)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(row.orderDate)}</TableCell>
                    <TableCell>{r ? r.shippedQty.toFixed(2) : "—"}</TableCell>
                    <TableCell>{r ? r.unshippedQty.toFixed(2) : "—"}</TableCell>
                    <TableCell>{r ? formatAmount(r.paidAmount, currency) : "—"}</TableCell>
                    <TableCell>{r ? formatAmount(r.unpaidAmount, currency) : "—"}</TableCell>
                    <TableCell>{r?.deliverySub ?? "—"}</TableCell>
                    <TableCell>{r?.paymentSub ?? "—"}</TableCell>
                    <TableCell className="max-w-[10rem] truncate text-sm">{row.remarks ?? "—"}</TableCell>
                    {isAdmin ? (
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          编辑
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(row.id)}>
                          删除
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑小订单</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSaveEdit} className="space-y-3">
            <div className="space-y-1">
              <Label>客户采购单号</Label>
              <Input value={editPoNo} onChange={(e) => setEditPoNo(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>数量</Label>
              <Input type="number" step="0.01" value={editQty} onChange={(e) => setEditQty(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>下单日期</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>备注</Label>
              <Textarea rows={2} value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} />
            </div>
            {dialogError ? <p className="text-sm text-destructive">{dialogError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
