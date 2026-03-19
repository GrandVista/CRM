import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getProductById, updateProduct } from "@/lib/actions/products";
import { EditProductFormWrapper } from "@/components/products/edit-product-form-wrapper";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const defaultValues = {
    productCode: product.productCode,
    name: product.name,
    category: product.category ?? undefined,
    material: product.material ?? undefined,
    density: product.density ?? undefined,
    unit: product.unit ?? "kg",
    defaultPrice: product.defaultPrice ?? undefined,
    currency: product.currency ?? "USD",
    weightFormulaType: product.weightFormulaType ?? undefined,
    pricingMethod: product.pricingMethod ?? undefined,
    packingMethod: product.packingMethod ?? undefined,
    remark: product.remark ?? undefined,
    isActive: product.isActive,
  };

  return (
    <div className="flex flex-col">
      <Header title="编辑产品" description={product.name}>
        <Button asChild variant="outline">
          <Link href={`/products/${id}`}>取消</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <EditProductFormWrapper
          productId={id}
          defaultValues={defaultValues}
          updateProduct={updateProduct}
        />
      </div>
    </div>
  );
}
