export type PackageRecord = {
  id: string;
  user_id: string;
  name: string;
  destination: string;
  package_date: string;
  notes: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  package_id: string;
  user_id: string;
  name: string;
  initial_quantity: number;
  purchase_unit_price: number;
  sale_unit_price: number;
  created_at: string;
};

export type Expense = {
  id: string;
  package_id: string;
  user_id: string;
  description: string;
  amount: number;
  note: string | null;
  category: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  package_id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  unit_price: number;
  sold_at: string;
  created_at: string;
};

export type PackageDetails = {
  package: PackageRecord;
  products: Product[];
  expenses: Expense[];
  sales: Sale[];
};

export type ProductImportRow = {
  rowNumber: number;
  name: string;
  quantity: number;
  purchaseUnitPrice: number;
  saleUnitPrice: number;
};

export type ImportIssue = { rowNumber: number | null; message: string };

export type PackageSummary = {
  purchaseCost: number;
  potentialRevenue: number;
  expenseTotal: number;
  investment: number;
  received: number;
  costOfSold: number;
  expectedProfit: number;
  actualProfit: number;
  soldUnits: number;
  availableUnits: number;
};
