import type {
  Customer,
  Product,
  Quotation,
  QuotationItem,
  ProformaInvoice,
  PiItem,
  Contract,
  ContractItem,
  ContractLog,
  PackingList,
  Shipment,
  Payment,
} from "@prisma/client";

export type { Customer, Product, Quotation, QuotationItem, ProformaInvoice, PiItem, Contract, ContractItem, ContractLog, PackingList, Shipment, Payment };

export type CustomerWithRelations = Customer & {
  _count?: { quotations: number; contracts: number; payments: number };
};

export type QuotationWithItems = Quotation & {
  customer: Customer | null;
  items: (QuotationItem & { product: Product | null })[];
};

export type ContractWithRelations = Contract & {
  customer: Customer | null;
  items: (ContractItem & { product: Product | null })[];
  shipments: Shipment[];
  payments: Payment[];
  logs: ContractLog[];
};
