import { supabase } from '../../lib/supabase';
import type { Product } from '../../types/models';

function client() {
  if (!supabase) throw new Error('Conecta Supabase para continuar.');
  return supabase;
}

export type ProductInput = Pick<Product, 'name' | 'initial_quantity' | 'purchase_unit_price' | 'sale_unit_price'>;

export async function addProduct(packageId: string, input: ProductInput) {
  const db = client();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) throw new Error('Tu sesión venció. Inicia sesión nuevamente.');
  const { data, error } = await db.from('products').insert({ ...input, package_id: packageId, user_id: auth.user.id }).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, input: ProductInput) {
  const { data, error } = await client().from('products').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string) {
  const { error } = await client().from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function importProducts(packageId: string, batchId: string, rows: ProductInput[]) {
  const { data, error } = await client().rpc('import_products', {
    p_batch_id: batchId,
    p_package_id: packageId,
    p_rows: rows.map((row) => ({
      name: row.name,
      quantity: row.initial_quantity,
      purchaseUnitPrice: row.purchase_unit_price,
      saleUnitPrice: row.sale_unit_price,
    })),
  });
  if (error) throw error;
  return data as number;
}
