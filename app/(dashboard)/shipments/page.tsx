import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPendingShipmentContracts, getShipments } from "@/lib/actions/shipments";
import { formatDate } from "@/lib/utils/date";
import { CreateShipmentFromContractButton } from "@/components/shipments/create-shipment-from-contract-button";
import { ShipmentListRow } from "@/components/shipments/shipment-list-row";
import { formatAmount } from "@/lib/numbers";

function customerName(c: { shortName: string | null; nameEn: string | null; nameCn: string | null } | null) {
  return c?.shortName || c?.nameEn || c?.nameCn || "—";
}

export default async function ShipmentsPage() {
  const [list, pendingContracts] = await Promise.all([
    getShipments(),
    getPendingShipmentContracts(),
  ]);

  return (
    <div className="flex flex-col">
      <Header title="出货记录" description="Shipments">
        {/* 新建出货改为从合同生成，不再单独入口；保留空按钮或移除均可 */}
      </Header>
      <div className="p-6 space-y-6">
        {pendingContracts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">待出货合同</h2>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>合同编号</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>合同日期</TableHead>
                    <TableHead>总金额</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingContracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.contractNo}</TableCell>
                      <TableCell>{customerName(c.customer)}</TableCell>
                      <TableCell>{formatDate(c.contractDate)}</TableCell>
                      <TableCell>{formatAmount(c.totalAmount, c.currency)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <CreateShipmentFromContractButton contractId={c.id} />
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/contracts/${c.id}`}>查看合同</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">出货记录列表</h2>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>出货单号</TableHead>
                  <TableHead>合同号</TableHead>
                  <TableHead>船舶航号</TableHead>
                  <TableHead>ETD</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {pendingContracts.length === 0
                        ? "暂无出货记录，请先签署合同后在此生成出货"
                        : "暂无出货记录，可从上方待出货合同生成"}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((row) => (
                    <ShipmentListRow
                      key={row.id}
                      shipment={{
                        id: row.id,
                        shipmentNo: row.shipmentNo,
                        vesselVoyage: row.vesselVoyage,
                        etd: row.etd,
                        status: row.status,
                        contract: row.contract,
                      }}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
