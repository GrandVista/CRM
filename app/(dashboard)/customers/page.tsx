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
import { Badge } from "@/components/ui/badge";
import { getCustomers } from "@/lib/actions/customers";
import { CustomersSearchForm } from "@/components/customers/customers-search-form";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const customers = await getCustomers({
    search: params.search,
    status: params.status,
  });

  return (
    <div className="flex flex-col">
      <Header title="客户管理" description="客户资料列表">
        <Button asChild>
          <Link href="/customers/new">新建客户</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-4">
        <CustomersSearchForm defaultSearch={params.search} defaultStatus={params.status} />
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户编号</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>国家</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>报价/合同/收款</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    暂无客户，请先新建客户或调整筛选条件
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.customerCode}</TableCell>
                    <TableCell>
                      {c.shortName || c.nameEn || c.nameCn || "-"}
                    </TableCell>
                    <TableCell>{c.country ?? "-"}</TableCell>
                    <TableCell>{c.contactPerson ?? "-"}</TableCell>
                    <TableCell>
                      {c._count.quotations} / {c._count.contracts} / {c._count.payments}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>
                        {c.status === "ACTIVE" ? "有效" : c.status === "INACTIVE" ? "无效" : "待定"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/customers/${c.id}`}>详情</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/customers/${c.id}/edit`}>编辑</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
