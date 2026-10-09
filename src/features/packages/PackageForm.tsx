import { useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPackage } from './packageApi';

export function PackageForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const item = await createPackage({ name: name.trim(), destination: destination.trim(), package_date: date, notes: notes.trim() || null });
      navigate(`/packages/${item.id}`);
    } catch {
      setError('No pudimos guardar el paquete. Revisa tu conexión e inténtalo de nuevo.');
    } finally { setBusy(false); }
  }

  return <div className="page narrow-page">
    <Link to="/packages" className="back-link"><ArrowLeft size={16} />Volver a mis paquetes</Link>
    <div className="page-heading"><div className="eyebrow">EMPECEMOS</div><h1>Un paquete nuevo</h1><p className="muted">Dale un nombre para encontrarlo fácilmente después.</p></div>
    <form className="panel form-panel" onSubmit={submit}>
      <div className="form-grid">
        <label className="span-two">Nombre del paquete<input autoFocus placeholder="Ej. Pedido de octubre" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Lugar de envío<input placeholder="Ej. Miami, Florida" required maxLength={120} value={destination} onChange={(e) => setDestination(e.target.value)} /></label>
        <label>Fecha del paquete<span className="input-icon field-icon"><CalendarDays size={16} /><input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></span></label>
        <label className="span-two">Notas <span className="optional">OPCIONAL</span><textarea rows={3} placeholder="Algo que quieras recordar…" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      </div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <div className="form-actions"><Link className="button secondary" to="/packages">Cancelar</Link><button className="button primary" disabled={busy}>{busy ? 'Guardando…' : 'Crear paquete'}<span>→</span></button></div>
    </form>
  </div>;
}
