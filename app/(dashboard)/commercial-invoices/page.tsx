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
import { getCommercialInvoices } from "@/lib/actions/commercial-invoices";
import { getPendingPiTodos } from "@/lib/actions/document-todos";
import { formatDate } from "@/lib/utils/date";
import { CreateCiFromContractButton } from "@/components/commercial-invoices/create-ci-from-contract-button";
import { DeleteCiButton } from "@/components/commercial-invoices/delete-ci-button";
import { formatAmount } from "@/lib/numbers";

export default async function CommercialInvoicesListPage() {
  const [list, pendingTodos] = await Promise.all([
    getCommercialInvoices(),
    getPendingPiTodos(),
  ]);

  const customerName = (c: { shortName: string | null; nameEn: string | null; nameCn: string | null } | null) =>
    c?.shortName || c?.nameEn || c?.nameCn || "—";

  return (
    <div className="flex flex-col">
      <Header title="Commercial Invoices" description="商业发票（CI）列表">
        <Button asChild variant="outline">
          <Link href="/commercial-invoices">刷新</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        {pendingTodos.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">待处理 CI 合同（从合同生成）</h2>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>合同编号</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>合同日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTodos.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.contract?.contractNo ?? "—"}</TableCell>
                      <TableCell>{t.contract ? customerName(t.contract.customer) : "—"}</TableCell>
                      <TableCell>{formatDate(t.contract?.contractDate)}</TableCell>
                      <TableCell>
                        {t.contract ? formatAmount(t.contract.totalAmount, t.contract.currency) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <CreateCiFromContractButton contractId={t.contractId} />
                        <Button asChild variant="ghost" size="sm" className="ml-2">
                          <Link href={`/contracts/${t.contractId}`}>查看合同</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">CI 列表</h2>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发票号</TableHead>
                  <TableHead>合同编号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无 Commercial Invoice，可从上方待处理合同生成
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((ci) => (
                    <TableRow key={ci.id}>
                      <TableCell className="font-medium">{ci.invoiceNo}</TableCell>
                      <TableCell>{ci.contract?.contractNo ?? "—"}</TableCell>
                      <TableCell>{ci.customer ? customerName(ci.customer) : "—"}</TableCell>
                      <TableCell>{formatDate(ci.invoiceDate)}</TableCell>
                      <TableCell>{formatAmount(ci.totalAmount, ci.currency)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/commercial-invoices/${ci.id}`}>详情</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/commercial-invoices/${ci.id}/edit`}>编辑</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/commercial-invoices/${ci.id}/print`} target="_blank" rel="noopener noreferrer">
                            打印
                          </Link>
                        </Button>
                        <DeleteCiButton id={ci.id} invoiceNo={ci.invoiceNo} />
                      </TableCell>
                    </TableRow>
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
