import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { createProduct } from "@/lib/actions/products";
import { NewProductFormWrapper } from "@/components/products/new-product-form-wrapper";

export default function NewProductPage() {
  return (
    <div className="flex flex-col">
      <Header title="新建产品" description="添加新产品资料">
        <Button asChild variant="outline">
          <Link href="/products">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <NewProductFormWrapper createProduct={createProduct} />
      </div>
    </div>
  );
}
