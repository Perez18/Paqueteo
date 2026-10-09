import { listPackages, getPackageDetails } from '../packages/packageApi';
import { calculatePackageSummary } from '../packages/packageCalculations';
import type { PackageDetails, PackageSummary } from '../../types/models';

export async function getDashboardData(): Promise<{ packages: PackageDetails[]; totals: PackageSummary }> {
  const records = await listPackages();
  const packages = await Promise.all(records.map((item) => getPackageDetails(item.id)));
  const totals = packages.reduce<PackageSummary>((all, detail) => {
    const current = calculatePackageSummary(detail);
    for (const key of Object.keys(all) as (keyof PackageSummary)[]) all[key] += current[key];
    return all;
  }, { purchaseCost: 0, potentialRevenue: 0, expenseTotal: 0, investment: 0, received: 0, costOfSold: 0, expectedProfit: 0, actualProfit: 0, soldUnits: 0, availableUnits: 0 });
  return { packages, totals };
}
