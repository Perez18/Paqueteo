import { Pencil, Trash2 } from 'lucide-react';
import type { Product, Sale } from '../../types/models';
import { formatUSD } from '../../lib/currency';
import { EmptyState } from '../../components/EmptyState';

export function ProductTable({ products, sales, onEdit, onDelete }: {
  products: Product[]; sales: Sale[]; onEdit: (product: Product) => void; onDelete: (product: Product) => void;
}) {
  if (!products.length) return <EmptyState icon={<span>＋</span>} title="Todavía no hay productos">Agrega productos manualmente o impórtalos desde una hoja de cálculo.</EmptyState>;
  const sold = new Map<string, number>();
  sales.forEach((sale) => sold.set(sale.product_id, (sold.get(sale.product_id) ?? 0) + sale.quantity));
  return <div className="table-scroll"><table className="data-table product-table"><thead><tr><th>PRODUCTO</th><th>UNIDADES</th><th>COMPRA / U.</th><th>VENTA / U.</th><th>DISPONIBLE</th><th><span className="sr-only">Acciones</span></th></tr></thead>
    <tbody>{products.map((item) => { const quantitySold = sold.get(item.id) ?? 0; const available = item.initial_quantity - quantitySold; return <tr key={item.id}>
      <td><div className="table-product"><span className="product-thumb">{item.name.slice(0, 1).toUpperCase()}</span><strong>{item.name}</strong></div></td>
      <td><span className="unit-number">{quantitySold}<small> / {item.initial_quantity}</small></span><span className="table-caption">vendidas</span></td>
      <td>{formatUSD(item.purchase_unit_price)}</td><td>{formatUSD(item.sale_unit_price)}</td><td><span className={`stock-pill ${available === 0 ? 'empty-stock' : ''}`}>{available} disponibles</span></td>
      <td><div className="row-actions"><button type="button" className="icon-button" onClick={() => onEdit(item)} aria-label={`Editar ${item.name}`} disabled={quantitySold > 0} title={quantitySold ? 'No puedes editar un producto con ventas registradas' : 'Editar producto'}><Pencil size={15} /></button><button type="button" className="icon-button danger-icon" onClick={() => onDelete(item)} aria-label={`Eliminar ${item.name}`} disabled={quantitySold > 0} title={quantitySold ? 'No puedes eliminar un producto con ventas registradas' : 'Eliminar producto'}><Trash2 size={15} /></button></div></td>
    </tr>; })}</tbody></table></div>;
}
