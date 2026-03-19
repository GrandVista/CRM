import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProductById } from "@/lib/actions/products";
import { DeleteProductButton } from "@/components/products/delete-product-button";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div className="flex flex-col">
      <Header title={product.name} description={`产品编号: ${product.productCode}`}>
        <Button asChild variant="outline">
          <Link href={`/products/${id}/edit`}>编辑</Link>
        </Button>
        <DeleteProductButton productId={id} productName={product.name} />
        <Button asChild variant="outline">
          <Link href="/products">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">产品编号</p>
              <p className="font-medium">{product.productCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">状态</p>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "启用" : "停用"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">类别</p>
              <p className="font-medium">{product.category ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">材质</p>
              <p className="font-medium">{product.material ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">密度 (g/cm³)</p>
              <p className="font-medium">{product.density ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">单位</p>
              <p className="font-medium">{product.unit ?? "kg"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">默认单价</p>
              <p className="font-medium">
                {product.defaultPrice != null ? `${product.defaultPrice} ${product.currency ?? "USD"}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">重量公式类型</p>
              <p className="font-medium">{product.weightFormulaType ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">计价方式</p>
              <p className="font-medium">{product.pricingMethod ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">包装方式</p>
              <p className="font-medium">{product.packingMethod ?? "-"}</p>
            </div>
            {product.remark && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">备注</p>
                <p className="font-medium">{product.remark}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
