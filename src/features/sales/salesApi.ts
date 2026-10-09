import { supabase } from '../../lib/supabase';
import type { Sale } from '../../types/models';

export async function recordSale(input: { packageId: string; productId: string; quantity: number; unitPrice: number }) {
  if (!supabase) throw new Error('Conecta Supabase para continuar.');
  const { data, error } = await supabase.rpc('record_sale', {
    p_package_id: input.packageId,
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_unit_price: input.unitPrice,
    p_sold_at: new Date().toISOString(),
  });
  if (error) {
    if (error.message.includes('INSUFFICIENT_STOCK')) throw new Error('No hay suficientes unidades disponibles para esta venta.');
    if (error.message.includes('PRODUCT_NOT_FOUND')) throw new Error('Este producto ya no está disponible en el paquete.');
    throw new Error('No pudimos registrar la venta. Revisa tu conexión e inténtalo de nuevo.');
  }
  return data as { sale: Sale; remaining_quantity: number };
}
