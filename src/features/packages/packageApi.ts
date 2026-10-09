import { supabase } from '../../lib/supabase';
import type { PackageDetails, PackageRecord } from '../../types/models';

function client() {
  if (!supabase) throw new Error('Conecta Supabase para continuar.');
  return supabase;
}

export async function listPackages(): Promise<PackageRecord[]> {
  const { data, error } = await client().from('packages').select('*').order('package_date', { ascending: false });
  if (error) throw error;
  return data as PackageRecord[];
}

export async function createPackage(input: Pick<PackageRecord, 'name' | 'destination' | 'package_date' | 'notes'>) {
  const { data: auth } = await client().auth.getUser();
  if (!auth.user) throw new Error('Tu sesión venció. Inicia sesión nuevamente.');
  const { data, error } = await client().from('packages')
    .insert({ ...input, user_id: auth.user.id }).select('*').single();
  if (error) throw error;
  return data as PackageRecord;
}

export async function getPackageDetails(packageId: string): Promise<PackageDetails> {
  const db = client();
  const [packageResult, productsResult, expensesResult, salesResult] = await Promise.all([
    db.from('packages').select('*').eq('id', packageId).maybeSingle(),
    db.from('products').select('*').eq('package_id', packageId).order('created_at'),
    db.from('expenses').select('*').eq('package_id', packageId).order('created_at', { ascending: false }),
    db.from('sales').select('*').eq('package_id', packageId).order('sold_at', { ascending: false }),
  ]);
  if (packageResult.error) throw packageResult.error;
  if (productsResult.error) throw productsResult.error;
  if (expensesResult.error) throw expensesResult.error;
  if (salesResult.error) throw salesResult.error;
  if (!packageResult.data) throw new Error('No encontramos este paquete.');
  return {
    package: packageResult.data as PackageRecord,
    products: productsResult.data as PackageDetails['products'],
    expenses: expensesResult.data as PackageDetails['expenses'],
    sales: salesResult.data as PackageDetails['sales'],
  };
}
