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
import { getProducts } from "@/lib/actions/products";
import { ProductsSearchForm } from "@/components/products/products-search-form";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; active?: string }>;
}) {
  const params = await searchParams;
  const products = await getProducts({
    search: params.search,
    activeOnly: params.active === "all" ? false : true,
  });

  return (
    <div className="flex flex-col">
      <Header title="产品管理" description="产品资料列表">
        <Button asChild>
          <Link href="/products/new">新建产品</Link>
        </Button>
      </Header>
      <div className="p-6 space-y-4">
        <ProductsSearchForm defaultSearch={params.search} defaultActive={params.active} />
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品编号</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>默认单价</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无产品
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.productCode}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.category ?? "-"}</TableCell>
                    <TableCell>
                      {p.defaultPrice != null ? `${p.defaultPrice} ${p.currency ?? "USD"}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "启用" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/products/${p.id}`}>详情</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/products/${p.id}/edit`}>编辑</Link>
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
