import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getContractById } from "@/lib/actions/contracts";
import { getCustomerDisplayName } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { getExecutionStatusLabel } from "@/lib/constants/execution-status";
import { allowOptionLabelRequired } from "@/lib/allow-option";
import { formatAmount, formatWeight } from "@/lib/numbers";
import { DeleteContractButton } from "@/components/contracts/delete-contract-button";
import { ContractStatusForm } from "@/components/contracts/contract-status-form";
import { ContractClauseRow } from "@/components/contracts/contract-clause-row";
import { CONTRACT_ATTACHMENT_CATEGORY } from "@/lib/contract-attachment-constants";
import { getCurrentAuthUser } from "@/lib/server-auth";
import { PdfActionButtons } from "@/components/pdf/pdf-action-buttons";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContractById(id);
  if (!contract) notFound();
  const currentUser = await getCurrentAuthUser();
  const currentUserRole = currentUser?.role ?? "staff";
  const isArchived = contract.signStatus === "SIGNED";

  const displayName = getCustomerDisplayName(contract.customer ?? null) || contract.contractNo;

  return (
    <div className="flex flex-col">
      <Header title={contract.contractNo} description={`客户: ${displayName}`}>
        <Button asChild variant="outline">
          <Link href={`/contracts/${id}/edit`}>编辑</Link>
        </Button>
        <DeleteContractButton
          contractId={id}
          contractNo={contract.contractNo}
          isArchived={isArchived}
          currentUserRole={currentUserRole}
        />
        <PdfActionButtons
          previewUrl={`/api/contracts/${id}/pdf`}
          downloadUrl={`/api/contracts/${id}/pdf?download=1`}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={`/contracts/${id}/print`} target="_blank" rel="noopener noreferrer">
            打印网页
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contracts">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <div className="pt-2">
              <ContractStatusForm
                contractId={id}
                currentSignStatus={contract.signStatus}
                currentExecutionStatus={contract.executionStatus}
              />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">合同编号</p>
              <p className="font-medium">{contract.contractNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">签署状态 / 执行状态</p>
              <div className="font-medium flex items-center gap-1 flex-wrap">
                <Badge variant="secondary" className="mr-1">
                  {contract.signStatus}
                </Badge>
                <Badge variant="secondary">{getExecutionStatusLabel(contract.executionStatus)}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">客户</p>
              <p className="font-medium">{displayName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">合同日期</p>
              <p className="font-medium">{formatDate(contract.contractDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">来源报价单</p>
              <p className="font-medium">{contract.quotation?.quotationNo ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">币种</p>
              <p className="font-medium">{contract.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">合计金额</p>
              <p className="font-medium">{formatAmount(contract.totalAmount, contract.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总重量 / 总卷数</p>
              <p className="font-medium">
                {formatWeight(contract.totalWeight)} / {contract.totalRolls}
              </p>
            </div>
            <div className="sm:col-span-2">
              <ContractClauseRow label="预计装运日期：" labelWidth="6rem" className="text-sm">
                <span className="font-medium">{formatDate(contract.estimatedShipmentDate)}</span>
              </ContractClauseRow>
            </div>
            <div className="sm:col-span-2">
              <ContractClauseRow label="装运港：" labelWidth="6rem" className="text-sm">
                <span className="font-medium">{contract.portOfShipment ?? "—"}</span>
              </ContractClauseRow>
            </div>
            <div className="sm:col-span-2">
              <ContractClauseRow label="目的港：" labelWidth="6rem" className="text-sm">
                <span className="font-medium">{contract.portOfDestination ?? "—"}</span>
              </ContractClauseRow>
            </div>
            <div className="sm:col-span-2">
              <ContractClauseRow label="分批装运：" labelWidth="6rem" className="text-sm">
                <span className="font-medium">{allowOptionLabelRequired(contract.partialShipment)}</span>
              </ContractClauseRow>
            </div>
            <div className="sm:col-span-2">
              <ContractClauseRow label="转船：" labelWidth="6rem" className="text-sm">
                <span className="font-medium">{allowOptionLabelRequired(contract.transhipment)}</span>
              </ContractClauseRow>
            </div>
            {contract.paymentMethod && (
              <>
                <div className="sm:col-span-2">
                  <ContractClauseRow label="付款方式：" labelWidth="6rem" className="text-sm">
                    <span className="font-medium">{contract.paymentMethod === "TT" ? "T/T" : contract.paymentMethod === "LC" ? "L/C" : contract.paymentMethod}</span>
                  </ContractClauseRow>
                </div>
                {contract.paymentMethod === "TT" && contract.depositRatio != null && (
                  <div className="sm:col-span-2">
                    <ContractClauseRow label="订金比例：" labelWidth="6rem" className="text-sm">
                      <span className="font-medium">{contract.depositRatio}%</span>
                    </ContractClauseRow>
                  </div>
                )}
              </>
            )}
            <div className="sm:col-span-2">
              <ContractClauseRow label="付款条款：" labelWidth="6rem" className="text-sm">
                <span className="font-medium">{contract.paymentTerm ?? "—"}</span>
              </ContractClauseRow>
            </div>
            <div className="sm:col-span-2">
              <ContractClauseRow label="贸易条款：" labelWidth="6rem" className="text-sm">
                <span className="font-medium">{contract.incoterm ?? "—"}</span>
              </ContractClauseRow>
            </div>
            <div className="sm:col-span-2">
              <ContractClauseRow label="备注：" labelWidth="6rem" className="text-sm">
                <span className="font-medium">{contract.remark ?? "—"}</span>
              </ContractClauseRow>
            </div>
          </CardContent>
        </Card>

        {contract.attachments?.some(
          (a) => a.category === CONTRACT_ATTACHMENT_CATEGORY.SIGNED_CONTRACT
        ) && (
          <Card>
            <CardHeader>
              <CardTitle>已签署合同 PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {contract.attachments
                  .filter((a) => a.category === CONTRACT_ATTACHMENT_CATEGORY.SIGNED_CONTRACT)
                  .map((att) => (
                    <li key={att.id} className="flex items-center gap-3">
                      <span className="font-medium truncate flex-1 min-w-0" title={att.fileName}>
                        {att.fileName}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                          查看
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={att.fileUrl} download={att.fileName}>
                          下载
                        </a>
                      </Button>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>明细</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产品名称</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>单价</TableHead>
                  <TableHead>卷数</TableHead>
                  <TableHead>数量(kg)</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>实际/确认数量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>
                      {[item.thickness, item.width, item.length].filter(Boolean).join(" / ") || "-"}
                    </TableCell>
                    <TableCell>{item.unitPrice}</TableCell>
                    <TableCell>{item.rollQty}</TableCell>
                    <TableCell>{item.quantityKg}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell>
                      {item.actualQty ?? "-"} / {item.confirmedQty ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {contract.shipments && contract.shipments.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>出货记录</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/shipments">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>出货单号</TableHead>
                    <TableHead>ETD</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contract.shipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.shipmentNo}</TableCell>
                      <TableCell>{s.etd ? formatDate(s.etd) : "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/shipments/${s.id}`}>详情</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {contract.payments && contract.payments.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>收款记录</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/payments">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>收款单号</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contract.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.paymentNo}</TableCell>
                      <TableCell>{formatDate(p.paymentDate)}</TableCell>
                      <TableCell>{formatAmount(p.amount, p.currency)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/payments/${p.id}`}>详情</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {contract.logs && contract.logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>执行日志</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {contract.logs.map((log) => (
                  <li key={log.id} className="flex gap-3 text-sm border-l-2 border-border pl-3">
                    <span className="text-muted-foreground shrink-0">
                      {formatDate(log.createdAt)}
                    </span>
                    <span className="font-medium">{log.actionType}</span>
                    {log.content && <span className="text-muted-foreground">{log.content}</span>}
                    {log.operator && (
                      <span className="text-muted-foreground">操作人: {log.operator}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
