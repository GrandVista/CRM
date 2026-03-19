import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCustomerById } from "@/lib/actions/customers";
import { formatDate } from "@/lib/utils/date";
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getExecutionStatusLabel } from "@/lib/constants/execution-status";
import { formatAmount } from "@/lib/numbers";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const displayName = customer.shortName || customer.nameEn || customer.nameCn || customer.customerCode;

  return (
    <div className="flex flex-col">
      <Header title={displayName} description={`客户编号: ${customer.customerCode}`}>
        <Button asChild variant="outline">
          <Link href={`/customers/${id}/edit`}>编辑</Link>
        </Button>
        <DeleteCustomerButton customerId={id} customerName={displayName} />
        <Button asChild variant="outline">
          <Link href="/customers">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">客户编号</p>
              <p className="font-medium">{customer.customerCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">状态</p>
              <Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>
                {customer.status === "ACTIVE" ? "有效" : customer.status === "INACTIVE" ? "无效" : "待定"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">中文名称</p>
              <p className="font-medium">{customer.nameCn ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">英文名称</p>
              <p className="font-medium">{customer.nameEn ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">简称</p>
              <p className="font-medium">{customer.shortName ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">国家/城市</p>
              <p className="font-medium">{customer.country ?? "-"} / {customer.city ?? "-"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">地址</p>
              <p className="font-medium">{customer.address ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">电话</p>
              <p className="font-medium">{customer.phone ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">邮箱</p>
              <p className="font-medium">{customer.email ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">联系人</p>
              <p className="font-medium">{customer.contactPerson ?? "-"} {customer.contactTitle ? `(${customer.contactTitle})` : ""}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">默认币种</p>
              <p className="font-medium">{customer.defaultCurrency ?? "USD"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">默认付款条款</p>
              <p className="font-medium text-sm">{customer.defaultPaymentTerm ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">默认贸易条款</p>
              <p className="font-medium">{customer.defaultIncoterm ?? "-"}</p>
            </div>
            {customer.remark && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">备注</p>
                <p className="font-medium">{customer.remark}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {customer.quotations && customer.quotations.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>最近报价单</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/quotations">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>报价单号</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.quotations.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.quotationNo}</TableCell>
                      <TableCell>{formatDate(q.quotationDate)}</TableCell>
                      <TableCell>{formatAmount(q.totalAmount, q.currency)}</TableCell>
                      <TableCell><Badge variant="secondary">{q.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {customer.contracts && customer.contracts.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>最近合同</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/contracts">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>合同编号</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>执行状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.contractNo}</TableCell>
                      <TableCell>{formatDate(c.contractDate)}</TableCell>
                      <TableCell>{formatAmount(c.totalAmount, c.currency)}</TableCell>
                      <TableCell><Badge variant="secondary">{getExecutionStatusLabel(c.executionStatus)}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/contracts/${c.id}`}>详情</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {customer.payments && customer.payments.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>最近收款记录</CardTitle>
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
                    <TableHead>方式</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.paymentNo}</TableCell>
                      <TableCell>{formatDate(p.paymentDate)}</TableCell>
                      <TableCell>{formatAmount(p.amount, p.currency)}</TableCell>
                      <TableCell>{p.paymentMethod ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
