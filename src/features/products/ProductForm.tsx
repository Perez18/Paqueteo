import { useState, type FormEvent } from 'react';
import { addProduct, updateProduct, type ProductInput } from './productApi';
import type { Product } from '../../types/models';
import { formatUSD } from '../../lib/currency';

export function ProductForm({ packageId, product, baseExpectedProfit, onSaved, onCancel }: {
  packageId: string; product?: Product; baseExpectedProfit: number; onSaved: () => void; onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [quantity, setQuantity] = useState(String(product?.initial_quantity ?? ''));
  const [purchase, setPurchase] = useState(String(product?.purchase_unit_price ?? ''));
  const [sale, setSale] = useState(String(product?.sale_unit_price ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const quantityValue = quantity.trim() === '' ? Number.NaN : Number(quantity);
  const purchaseValue = purchase.trim() === '' ? Number.NaN : Number(purchase);
  const saleValue = sale.trim() === '' ? Number.NaN : Number(sale);
  const productValuesValid = Number.isInteger(quantityValue) && quantityValue > 0
    && Number.isFinite(purchaseValue) && purchaseValue >= 0
    && Number.isFinite(saleValue) && saleValue >= 0;
  const existingContribution = product
    ? product.initial_quantity * (product.sale_unit_price - product.purchase_unit_price)
    : 0;
  const updatedContribution = productValuesValid
    ? quantityValue * (saleValue - purchaseValue)
    : 0;
  const rawExpectedProfit = baseExpectedProfit - existingContribution + updatedContribution;
  const expectedProfit = Math.round((rawExpectedProfit + Math.sign(rawExpectedProfit) * Number.EPSILON) * 100) / 100;
  const profitStatus = !productValuesValid || expectedProfit === 0 ? 'neutral' : expectedProfit > 0 ? 'success' : 'danger';

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    const input: ProductInput = { name: name.trim(), initial_quantity: Number(quantity), purchase_unit_price: Number(purchase), sale_unit_price: Number(sale) };
    try {
      if (product) await updateProduct(product.id, input);
      else await addProduct(packageId, input);
      onSaved();
    } catch {
      setError(product ? 'No pudimos actualizar el producto. Si ya tiene ventas, algunos datos no se pueden cambiar.' : 'No pudimos agregar el producto. Revisa los datos e inténtalo de nuevo.');
    } finally { setBusy(false); }
  }

  return <form className="panel product-form" onSubmit={submit}>
    <div className="panel-heading"><div><span className="section-kicker">{product ? 'ACTUALIZA LOS DATOS' : 'NUEVO EN TU INVENTARIO'}</span><h3>{product ? 'Editar producto' : 'Agregar producto'}</h3></div><button type="button" className="icon-button" onClick={onCancel} aria-label="Cerrar">×</button></div>
    <div className={`product-profit-banner ${profitStatus}`} role="status" aria-live="polite" aria-atomic="true">
      <span>Ganancia esperada del paquete</span>
      <strong>{productValuesValid ? formatUSD(expectedProfit) : 'Completa cantidad y precios'}</strong>
      <small>Incluye el inventario y los gastos actuales.</small>
    </div>
    <div className="form-grid product-fields">
      <label className="span-two">Nombre del producto<input autoFocus required maxLength={100} placeholder="Ej. Camiseta básica" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Cantidad<input type="number" min="1" step="1" required placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
      <label>Precio de compra<input type="number" min="0" step="0.01" required placeholder="0.00" value={purchase} onChange={(e) => setPurchase(e.target.value)} /></label>
      <label>Precio de venta<input type="number" min="0" step="0.01" required placeholder="0.00" value={sale} onChange={(e) => setSale(e.target.value)} /></label>
    </div>
    {error && <div className="alert error" role="alert">{error}</div>}
    <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? 'Guardando…' : product ? 'Guardar cambios' : 'Agregar producto'}<span>→</span></button></div>
  </form>;
}
