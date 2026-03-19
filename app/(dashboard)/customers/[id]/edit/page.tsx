import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getCustomerById, updateCustomer } from "@/lib/actions/customers";
import { EditCustomerFormWrapper } from "@/components/customers/edit-customer-form-wrapper";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const defaultValues = {
    customerCode: customer.customerCode,
    nameCn: customer.nameCn ?? undefined,
    nameEn: customer.nameEn ?? undefined,
    shortName: customer.shortName ?? undefined,
    country: customer.country ?? undefined,
    city: customer.city ?? undefined,
    address: customer.address ?? undefined,
    phone: customer.phone ?? undefined,
    email: customer.email ?? undefined,
    website: customer.website ?? undefined,
    taxNo: customer.taxNo ?? undefined,
    contactPerson: customer.contactPerson ?? undefined,
    contactTitle: customer.contactTitle ?? undefined,
    defaultCurrency: customer.defaultCurrency ?? "USD",
    defaultPaymentTerm: customer.defaultPaymentTerm ?? undefined,
    defaultIncoterm: customer.defaultIncoterm ?? undefined,
    defaultPortOfShipment: customer.defaultPortOfShipment ?? undefined,
    defaultPortOfDestination: customer.defaultPortOfDestination ?? undefined,
    defaultInsuranceTerm: customer.defaultInsuranceTerm ?? undefined,
    defaultPackingTerm: customer.defaultPackingTerm ?? undefined,
    defaultDocumentRequirement: customer.defaultDocumentRequirement ?? undefined,
    customerLevel: customer.customerLevel ?? undefined,
    status: customer.status,
    remark: customer.remark ?? undefined,
  };

  return (
    <div className="flex flex-col">
      <Header title="编辑客户" description={customer.shortName || customer.nameEn || customer.nameCn || customer.customerCode}>
        <Button asChild variant="outline">
          <Link href={`/customers/${id}`}>取消</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/customers">返回列表</Link>
        </Button>
      </Header>
      <div className="p-6">
        <EditCustomerFormWrapper
          customerId={id}
          defaultValues={defaultValues}
          updateCustomer={updateCustomer}
        />
      </div>
    </div>
  );
}
