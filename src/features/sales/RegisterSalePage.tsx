import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getPackageDetails } from '../packages/packageApi';
import { recordSale } from './salesApi';
import type { PackageDetails } from '../../types/models';
import { formatUSD } from '../../lib/currency';
import { LoadingState } from '../../components/LoadingState';

export function RegisterSalePage() {
  const { packageId = '' } = useParams();
  const [details, setDetails] = useState<PackageDetails | null>(null);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);

  useEffect(() => { getPackageDetails(packageId).then((data) => { setDetails(data); const first = data.products.find((product) => data.sales.filter((sale) => sale.product_id === product.id).reduce((sum, sale) => sum + sale.quantity, 0) < product.initial_quantity); if (first) { setProductId(first.id); setPrice(String(first.sale_unit_price)); } }).catch(() => setError('No pudimos cargar el paquete.')).finally(() => setLoading(false)); }, [packageId]);

  const available = useMemo(() => {
    if (!details) return 0;
    const product = details.products.find((item) => item.id === productId);
    const sold = details.sales.filter((sale) => sale.product_id === productId).reduce((sum, sale) => sum + sale.quantity, 0);
    return Math.max(0, (product?.initial_quantity ?? 0) - sold);
  }, [details, productId]);
  const selected = details?.products.find((item) => item.id === productId);

  function chooseProduct(id: string) {
    setProductId(id);
    const product = details?.products.find((item) => item.id === id);
    setPrice(product ? String(product.sale_unit_price) : '');
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError('');
    try {
      await recordSale({ packageId, productId, quantity: Number(quantity), unitPrice: Number(price) });
      setComplete(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos registrar la venta.'); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="page"><LoadingState /></div>;
  if (complete) return <div className="page narrow-page"><div className="success-screen"><div className="success-icon"><CheckCircle2 size={31} /></div><div className="eyebrow">VENTA REGISTRADA</div><h1>¡Buen trabajo!</h1><p>El inventario y tus números ya están actualizados.</p><Link to={`/packages/${packageId}`} className="button primary">Volver al paquete<span>→</span></Link></div></div>;

  return <div className="page narrow-page">
    <Link to={`/packages/${packageId}`} className="back-link"><ArrowLeft size={16} />Volver al paquete</Link>
    <div className="page-heading"><div className="eyebrow">{details?.package.name.toUpperCase()}</div><h1>Registrar una venta</h1><p className="muted">Un momento y el inventario queda actualizado.</p></div>
    {!details?.products.length || available === 0 ? <div className="panel empty-panel"><div className="empty-icon"><ShoppingBag size={22} /></div><h3>No hay unidades disponibles</h3><p>Cuando agregues productos con inventario, podrás registrar sus ventas.</p><Link to={`/packages/${packageId}`} className="button secondary">Volver al paquete</Link></div> : <form className="panel form-panel sale-form" onSubmit={submit}>
      <label>¿Qué producto vendiste?<select required value={productId} onChange={(e) => chooseProduct(e.target.value)}>{details?.products.filter((product) => { const sold = details.sales.filter((sale) => sale.product_id === product.id).reduce((sum, sale) => sum + sale.quantity, 0); return product.initial_quantity > sold; }).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
      <div className="sale-stock-note">Te quedan <strong>{available} unidades</strong> de {selected?.name}.</div>
      <div className="form-grid"><label>Unidades vendidas<input type="number" min="1" max={available} step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label><label>Precio de venta por unidad<input type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} /></label></div>
      <div className="sale-total"><span>Recibirás</span><strong>{formatUSD((Number(quantity) || 0) * (Number(price) || 0))}</strong></div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <div className="confirm-note">Revisa el total antes de guardar. Al confirmar, las unidades se restarán del inventario.</div>
      <div className="form-actions"><Link className="button secondary" to={`/packages/${packageId}`}>Cancelar</Link><button className="button primary" disabled={busy || Number(quantity) > available}>{busy ? 'Guardando…' : 'Confirmar venta'}<span>→</span></button></div>
    </form>}
  </div>;
}
