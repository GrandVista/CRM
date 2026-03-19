import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getExecutionStatusLabel } from "@/lib/constants/execution-status";
import { formatAmount, formatWeight } from "@/lib/numbers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

async function getStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [monthContracts, yearContracts, monthShipments, yearShipments, monthPayments, yearPayments, pendingContracts, contractsWithPayments] =
    await Promise.all([
      prisma.contract.aggregate({
        where: {
          contractDate: { gte: startOfMonth },
          executionStatus: { not: "CANCELLED" },
        },
        _sum: { totalAmount: true, totalWeight: true },
        _count: { id: true },
      }),
      prisma.contract.aggregate({
        where: {
          contractDate: { gte: startOfYear },
          executionStatus: { not: "CANCELLED" },
        },
        _sum: { totalAmount: true, totalWeight: true },
        _count: { id: true },
      }),
      prisma.shipment.aggregate({
        where: { shippingDate: { gte: startOfMonth } },
        _count: { id: true },
      }),
      prisma.shipment.aggregate({
        where: { shippingDate: { gte: startOfYear } },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.contract.aggregate({
        where: {
          executionStatus: { notIn: ["COMPLETED", "CANCELLED"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.contract.findMany({
        where: { executionStatus: { notIn: ["CANCELLED"] } },
        select: { id: true, totalAmount: true, payments: { select: { amount: true } } },
      }),
    ]);

  const totalUnreceived = contractsWithPayments.reduce((acc, c) => {
    const received = c.payments.reduce((s, p) => s + p.amount, 0);
    return acc + Math.max(0, c.totalAmount - received);
  }, 0);

  return {
    monthContractAmount: monthContracts._sum.totalAmount ?? 0,
    monthContractWeight: monthContracts._sum.totalWeight ?? 0,
    monthContractCount: monthContracts._count.id,
    yearContractAmount: yearContracts._sum.totalAmount ?? 0,
    yearContractWeight: yearContracts._sum.totalWeight ?? 0,
    yearContractCount: yearContracts._count.id,
    monthShipmentCount: monthShipments._count.id,
    yearShipmentCount: yearShipments._count.id,
    monthPaymentAmount: monthPayments._sum.amount ?? 0,
    yearPaymentAmount: yearPayments._sum.amount ?? 0,
    pendingContractAmount: pendingContracts._sum.totalAmount ?? 0,
    unreceivedAmount: totalUnreceived,
  };
}

/** 优先返回「已签署且未完成」的合同（待跟进）；若无则降级为最近创建的合同 */
async function getRecentContracts() {
  const take = 10;

  // 1. 已签署且执行状态未完成（排除 COMPLETED、CANCELLED），按合同日期倒序
  const signedNotCompleted = await prisma.contract.findMany({
    where: {
      signStatus: "SIGNED",
      executionStatus: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    take,
    orderBy: { contractDate: "desc" },
    include: { customer: { select: { nameEn: true, nameCn: true, shortName: true } } },
  });

  if (signedNotCompleted.length > 0) return signedNotCompleted;

  // 2. 降级：无待跟进合同时，显示最近创建的合同
  return prisma.contract.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { nameEn: true, nameCn: true, shortName: true } } },
  });
}

export default async function DashboardPage() {
  const [stats, recentContracts] = await Promise.all([getStats(), getRecentContracts()]);
  const currency = "USD";

  return (
    <div className="flex flex-col">
      <Header
        title="Dashboard"
        description="业务概览与关键指标"
      />

      <div className="p-6 space-y-6">
        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月合同数量（总重量）</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatWeight(stats.monthContractWeight)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.monthContractCount} 份合同</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月回款金额</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatAmount(stats.monthPaymentAmount, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本年度合同数量（总重量）</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatWeight(stats.yearContractWeight)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.yearContractCount} 份合同</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本年回款金额</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatAmount(stats.yearPaymentAmount, currency)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未完成合同金额</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatAmount(stats.pendingContractAmount, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未收款金额</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatAmount(stats.unreceivedAmount, currency)}</p>
            </CardContent>
          </Card>
        </div>

        {/* 待跟进合同：已签署且未完成；若无则显示最近合同 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>待跟进合同</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/contracts">查看全部</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>合同编号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>执行状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无合同数据
                    </TableCell>
                  </TableRow>
                ) : (
                  recentContracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.contractNo}</TableCell>
                      <TableCell>
                        {c.customer?.shortName || c.customer?.nameEn || c.customer?.nameCn || "-"}
                      </TableCell>
                      <TableCell>{formatAmount(c.totalAmount, c.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getExecutionStatusLabel(c.executionStatus)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/contracts/${c.id}`}>详情</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
