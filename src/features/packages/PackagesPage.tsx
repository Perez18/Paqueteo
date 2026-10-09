import { useEffect, useState } from 'react';
import { ArrowUpRight, Box, CalendarDays, MapPin, PackagePlus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listPackages } from './packageApi';
import { formatDate } from '../../lib/currency';
import type { PackageRecord } from '../../types/models';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export function PackagesPage() {
  const [items, setItems] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { listPackages().then(setItems).catch(() => setError('No pudimos cargar tus paquetes. Actualiza la página para intentarlo de nuevo.')).finally(() => setLoading(false)); }, []);

  return <div className="page">
    <div className="page-heading heading-row"><div><div className="eyebrow">TU NEGOCIO, EN ORDEN</div><h1>Mis paquetes</h1><p className="muted">Cada envío empieza con una buena organización.</p></div><Link className="button primary" to="/packages/new"><Plus size={17} />Nuevo paquete</Link></div>
    {loading ? <LoadingState label="Buscando tus paquetes…" /> : error ? <div className="panel empty-panel"><div className="alert error">{error}</div><button className="button secondary" onClick={() => window.location.reload()}>Actualizar</button></div> : items.length === 0 ? <div className="panel empty-panel"><EmptyState icon={<PackagePlus size={23} />} title="Tu primer paquete empieza aquí">Crea un paquete para organizar productos, gastos y ventas.</EmptyState><Link className="button primary" to="/packages/new"><Plus size={17} />Crear mi primer paquete</Link></div> : <div className="package-grid">{items.map((item, index) => <Link className="package-card" key={item.id} to={`/packages/${item.id}`}>
      <div className={`package-card-icon color-${index % 4}`}><Box size={20} /></div><span className="card-arrow"><ArrowUpRight size={17} /></span>
      <h2>{item.name}</h2><div className="package-meta"><span><MapPin size={14} />{item.destination}</span><span><CalendarDays size={14} />{formatDate(item.package_date)}</span></div>
      <div className="package-card-bottom"><span>Ver detalle</span><span>→</span></div>
    </Link>)}</div>}
  </div>;
}
