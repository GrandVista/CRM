import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const customer1 = await prisma.customer.upsert({
    where: { customerCode: "CUS001" },
    update: {},
    create: {
      customerCode: "CUS001",
      nameCn: "示例贸易公司",
      nameEn: "Sample Trading Co.",
      shortName: "Sample",
      country: "USA",
      city: "New York",
      address: "123 Trade St",
      email: "contact@sample.com",
      defaultCurrency: "USD",
      defaultPaymentTerm: "T/T 30% in advance, 70% before shipment",
      defaultIncoterm: "CIF",
      status: "ACTIVE",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { customerCode: "CUS002" },
    update: {},
    create: {
      customerCode: "CUS002",
      nameEn: "Global Pack Ltd",
      shortName: "GlobalPack",
      country: "UK",
      defaultCurrency: "USD",
      status: "ACTIVE",
    },
  });

  await prisma.product.upsert({
    where: { productCode: "P001" },
    update: {},
    create: {
      productCode: "P001",
      name: "BOPP Film 20mic",
      category: "Film",
      material: "BOPP",
      density: 0.92,
      unit: "kg",
      defaultPrice: 1.5,
      currency: "USD",
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { productCode: "P002" },
    update: {},
    create: {
      productCode: "P002",
      name: "PE Film 30mic",
      category: "Film",
      material: "PE",
      density: 0.918,
      unit: "kg",
      defaultPrice: 1.2,
      currency: "USD",
      isActive: true,
    },
  });

  console.log("Seed completed:", { customer1, customer2 });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
