import { Receipt } from 'lucide-react';
import type { Product, Sale } from '../../types/models';
import { formatDate, formatUSD } from '../../lib/currency';
import { EmptyState } from '../../components/EmptyState';

export function SalesHistory({ sales, products }: { sales: Sale[]; products: Product[] }) {
  if (!sales.length) return <EmptyState icon={<Receipt size={20} />} title="Aún no hay ventas">Cuando registres una venta, aparecerá en esta lista.</EmptyState>;
  const names = new Map(products.map((product) => [product.id, product.name]));
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>FECHA</th><th>PRODUCTO</th><th>UNIDADES</th><th>PRECIO / U.</th><th>TOTAL RECIBIDO</th></tr></thead><tbody>{sales.map((sale) => <tr key={sale.id}><td>{formatDate(sale.sold_at)}</td><td><strong>{names.get(sale.product_id) ?? 'Producto eliminado'}</strong></td><td>{sale.quantity}</td><td>{formatUSD(sale.unit_price)}</td><td><strong>{formatUSD(sale.quantity * sale.unit_price)}</strong></td></tr>)}</tbody></table></div>;
}
