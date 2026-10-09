import { useEffect, useState } from 'react';
import { ArrowUpRight, Boxes, CircleDollarSign, Coins, Package, Plus, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardData } from './dashboardApi';
import type { PackageDetails, PackageSummary } from '../../types/models';
import { formatDate, formatUSD } from '../../lib/currency';
import { StatCard } from '../../components/StatCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

const blank: PackageSummary = { purchaseCost: 0, potentialRevenue: 0, expenseTotal: 0, investment: 0, received: 0, costOfSold: 0, expectedProfit: 0, actualProfit: 0, soldUnits: 0, availableUnits: 0 };

export function DashboardPage() {
  const [packages, setPackages] = useState<PackageDetails[]>([]);
  const [totals, setTotals] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { getDashboardData().then(({ packages: data, totals: summary }) => { setPackages(data); setTotals(summary); }).catch(() => setError('No pudimos actualizar el resumen. Inténtalo de nuevo en un momento.')).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="page"><LoadingState label="Preparando tu resumen…" /></div>;
  const weekday = new Intl.DateTimeFormat('es-PA', { weekday: 'long' }).format(new Date()).toLocaleUpperCase('es');
  const pendingPackages = packages.filter((detail) => detail.products.length === 0 || detail.products.some((product) => {
    const sold = detail.sales.filter((sale) => sale.product_id === product.id).reduce((sum, sale) => sum + sale.quantity, 0);
    return sold < product.initial_quantity;
  })).length;
  const completedPackages = packages.length - pendingPackages;
  return <div className="page dashboard-page">
    <div className="welcome-row"><div><div className="eyebrow">{weekday} · TU ESPACIO DE TRABAJO</div><h1>Todo va tomando forma.</h1><p className="muted">Este es el pulso de tu negocio hoy.</p></div><Link className="button primary" to="/packages/new"><Plus size={17} />Nuevo paquete</Link></div>
    {error && <div className="alert error" role="alert">{error}</div>}
    {error ? <div className="panel dashboard-empty"><p className="muted">Tus datos siguen guardados. Puedes actualizar para volver a intentarlo.</p><button className="button secondary" onClick={() => window.location.reload()}>Actualizar resumen</button></div> : packages.length === 0 ? <div className="panel dashboard-empty"><EmptyState icon={<Boxes size={22} />} title="Aquí empieza tu historia">Crea tu primer paquete y pronto verás todo tu negocio en un solo lugar.</EmptyState><Link to="/packages/new" className="button primary"><Plus size={17} />Crear primer paquete</Link></div> : <>
      <div className="section-title"><div><span className="section-kicker">VISTA GENERAL</span><h2>Tu negocio, al día</h2></div><span className="live-pill"><span />ACTUALIZADO</span></div>
      <div className="stats-grid">
        <StatCard label="Dinero invertido" value={formatUSD(totals.investment)} icon={<Wallet size={18} />} tone="blue" footnote={`${formatUSD(totals.purchaseCost)} en productos`} />
        <StatCard label="Venta potencial" value={formatUSD(totals.potentialRevenue)} icon={<CircleDollarSign size={18} />} tone="violet" footnote="Si vendes todo el inventario" />
        <StatCard label="Ganancia esperada" value={formatUSD(totals.expectedProfit)} icon={<TrendingUp size={18} />} tone="green" footnote="Al vender todo el inventario" />
        <StatCard label="Dinero recibido" value={formatUSD(totals.received)} icon={<Coins size={18} />} tone="amber" footnote={`${totals.soldUnits} unidades vendidas`} />
      </div>
      <div className="insight-banner"><div className="insight-orb"><TrendingUp size={18} /></div><div><span>GANANCIA REAL</span><strong>{formatUSD(totals.actualProfit)}</strong></div><p>Ventas registradas menos costo de productos vendidos y gastos.</p><span className="insight-decoration">✳</span></div>
      <div className="package-status-strip"><div><span className="status-count total">{packages.length}</span><span>paquetes en total</span></div><i /><div><span className="status-count pending">{pendingPackages}</span><span>pendientes</span></div><i /><div><span className="status-count completed">{completedPackages}</span><span>finalizados</span></div><small>Un paquete se finaliza al vender todo su inventario.</small></div>
      <div className="section-title package-section-title"><div><span className="section-kicker">EN MOVIMIENTO</span><h2>Tus paquetes <span className="count-badge">{packages.length}</span></h2></div><Link className="text-link" to="/packages">Ver todos <ArrowUpRight size={15} /></Link></div>
      <div className="recent-list">{packages.slice(0, 4).map((detail, index) => <Link to={`/packages/${detail.package.id}`} className="recent-item" key={detail.package.id}>
        <div className={`recent-icon color-${index % 4}`}><Package size={18} /></div><div className="recent-main"><strong>{detail.package.name}</strong><span>{detail.package.destination} · {formatDate(detail.package.package_date)}</span></div><div className="recent-detail"><strong>{detail.products.length}</strong><span>productos</span></div><div className="recent-detail"><strong>{formatUSD(detail.sales.reduce((sum, sale) => sum + sale.quantity * sale.unit_price, 0))}</strong><span>recibido</span></div><span className="recent-chevron">→</span>
      </Link>)}</div>
    </>}
  </div>;
}
