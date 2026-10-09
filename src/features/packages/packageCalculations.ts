import type { PackageDetails, PackageSummary } from '../../types/models';

export function calculatePackageSummary(details: PackageDetails): PackageSummary {
  const soldByProduct = new Map<string, number>();
  for (const sale of details.sales) {
    soldByProduct.set(sale.product_id, (soldByProduct.get(sale.product_id) ?? 0) + sale.quantity);
  }

  const purchaseCost = details.products.reduce(
    (sum, product) => sum + product.initial_quantity * product.purchase_unit_price,
    0,
  );
  const potentialRevenue = details.products.reduce(
    (sum, product) => sum + product.initial_quantity * product.sale_unit_price,
    0,
  );
  const expenseTotal = details.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const received = details.sales.reduce((sum, sale) => sum + sale.quantity * sale.unit_price, 0);
  const costOfSold = details.products.reduce(
    (sum, product) => sum + (soldByProduct.get(product.id) ?? 0) * product.purchase_unit_price,
    0,
  );
  const soldUnits = [...soldByProduct.values()].reduce((sum, quantity) => sum + quantity, 0);
  const totalUnits = details.products.reduce((sum, product) => sum + product.initial_quantity, 0);

  return {
    purchaseCost,
    potentialRevenue,
    expenseTotal,
    investment: purchaseCost + expenseTotal,
    received,
    costOfSold,
    expectedProfit: potentialRevenue - purchaseCost - expenseTotal,
    actualProfit: received - costOfSold - expenseTotal,
    soldUnits,
    availableUnits: totalUnits - soldUnits,
  };
}
