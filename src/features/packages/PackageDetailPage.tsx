import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, CircleDollarSign, MapPin, Package, Plus, Receipt, ShoppingBag, Sparkles, Upload } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getPackageDetails } from './packageApi';
import { calculatePackageSummary } from './packageCalculations';
import type { PackageDetails, Product } from '../../types/models';
import { formatDate, formatUSD } from '../../lib/currency';
import { LoadingState } from '../../components/LoadingState';
import { StatCard } from '../../components/StatCard';
import { ProductForm } from '../products/ProductForm';
import { ProductTable } from '../products/ProductTable';
import { ImportProductsDialog } from '../import/ImportProductsDialog';
import { ExpenseForm } from '../expenses/ExpenseForm';
import { ExpenseList } from '../expenses/ExpenseList';
import { SalesHistory } from '../sales/SalesHistory';
import { deleteProduct } from '../products/productApi';

export function PackageDetailPage() {
  const { packageId = '' } = useParams();
  const [details, setDetails] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productEditor, setProductEditor] = useState<Product | null | 'new'>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [mutationError, setMutationError] = useState('');

  const refresh = useCallback(async () => {
    try { setError(''); setDetails(await getPackageDetails(packageId)); }
    catch { setError('No pudimos cargar este paquete. Revisa tu conexión o vuelve a tus paquetes.'); }
    finally { setLoading(false); }
  }, [packageId]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function removeProduct(product: Product) {
    if (!window.confirm(`¿Eliminar “${product.name}” de este paquete?`)) return;
    try { await deleteProduct(product.id); await refresh(); }
    catch { setMutationError('No pudimos eliminar el producto. Comprueba que no tenga ventas registradas.'); }
  }

  if (loading) return <div className="page"><LoadingState label="Abriendo el paquete…" /></div>;
  if (error || !details) return <div className="page"><div className="alert error">{error || 'No encontramos este paquete.'}</div><Link className="back-link" to="/packages"><ArrowLeft size={16} />Volver a mis paquetes</Link></div>;

  const summary = calculatePackageSummary(details);
  return <div className="page detail-page">
    <Link to="/packages" className="back-link"><ArrowLeft size={16} />Todos mis paquetes</Link>
    <div className="detail-hero"><div><div className="eyebrow">DETALLE DEL PAQUETE</div><h1>{details.package.name}</h1><div className="package-meta detail-meta"><span><MapPin size={15} />{details.package.destination}</span><span><CalendarDays size={15} />{formatDate(details.package.package_date)}</span></div>{details.package.notes && <p className="detail-notes">{details.package.notes}</p>}</div><Link to={`/packages/${packageId}/sales/new`} className="button primary"><ShoppingBag size={17} />Registrar venta<ArrowUpRight size={15} /></Link></div>
    <div className="stats-grid detail-stats"><StatCard label="Costo de productos" value={formatUSD(summary.purchaseCost)} icon={<Package size={17} />} tone="blue" /><StatCard label="Gastos adicionales" value={formatUSD(summary.expenseTotal)} icon={<Receipt size={17} />} tone="amber" /><StatCard label="Dinero recibido" value={formatUSD(summary.received)} icon={<CircleDollarSign size={17} />} tone="violet" /><StatCard label="Ganancia real" value={formatUSD(summary.actualProfit)} icon={<Sparkles size={17} />} tone="green" /></div>
    <div className="metric-strip"><div><span>Inversión total</span><strong>{formatUSD(summary.investment)}</strong></div><div><span>Venta esperada</span><strong>{formatUSD(summary.potentialRevenue)}</strong></div><div><span>Ganancia esperada</span><strong className={summary.expectedProfit < 0 ? 'negative' : ''}>{formatUSD(summary.expectedProfit)}</strong></div><div><span>Inventario disponible</span><strong>{summary.availableUnits} <small>unidades</small></strong></div></div>
    {mutationError && <div className="alert error">{mutationError}</div>}
    <section className="panel section-panel">
      <div className="panel-heading"><div><span className="section-kicker">EL CONTENIDO</span><h2>Productos <span className="count-badge">{details.products.length}</span></h2></div><div className="panel-actions"><button className="button secondary small-button" onClick={() => setImportOpen(true)}><Upload size={15} />Importar Excel</button><button className="button primary small-button" onClick={() => setProductEditor('new')}><Plus size={16} />Agregar producto</button></div></div>
      <ProductTable products={details.products} sales={details.sales} onEdit={setProductEditor} onDelete={(product) => void removeProduct(product)} />
    </section>
    {productEditor && <ProductForm key={productEditor === 'new' ? 'new' : productEditor.id} packageId={packageId} product={productEditor === 'new' ? undefined : productEditor} onCancel={() => setProductEditor(null)} onSaved={() => { setProductEditor(null); void refresh(); }} />}
    <div className="detail-columns">
      <section className="panel section-panel"><div className="panel-heading"><div><span className="section-kicker">COSTOS DEL ENVÍO</span><h2>Gastos adicionales <span className="count-badge">{details.expenses.length}</span></h2></div><strong className="panel-total">{formatUSD(summary.expenseTotal)}</strong></div><ExpenseForm packageId={packageId} onSaved={() => void refresh()} /><ExpenseList expenses={details.expenses} /></section>
      <section className="panel section-panel"><div className="panel-heading"><div><span className="section-kicker">VENTAS REALIZADAS</span><h2>Actividad de ventas <span className="count-badge">{details.sales.length}</span></h2></div><Link className="text-link" to={`/packages/${packageId}/sales/new`}>Registrar <ArrowUpRight size={15} /></Link></div><SalesHistory sales={details.sales} products={details.products} /></section>
    </div>
    {importOpen && <ImportProductsDialog packageId={packageId} onClose={() => setImportOpen(false)} onImported={() => { setImportOpen(false); void refresh(); }} />}
  </div>;
}
