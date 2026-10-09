import { useState, type FormEvent } from 'react';
import { addExpense } from './expenseApi';

export function ExpenseForm({ packageId, onSaved }: { packageId: string; onSaved: () => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Envío');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await addExpense(packageId, { description: description.trim(), amount: Number(amount), category, note: note.trim() || null });
      setDescription(''); setAmount(''); setNote(''); onSaved();
    } catch { setError('No pudimos guardar este gasto. Tus datos siguen en el formulario.'); }
    finally { setBusy(false); }
  }
  return <form className="expense-form" onSubmit={submit}>
    <div className="form-grid expense-fields"><label>Concepto<input placeholder="Ej. Envío al casillero" required maxLength={100} value={description} onChange={(e) => setDescription(e.target.value)} /></label><label>Monto (USD)<input type="number" min="0" step="0.01" placeholder="0.00" required value={amount} onChange={(e) => setAmount(e.target.value)} /></label><label>Categoría<select value={category} onChange={(e) => setCategory(e.target.value)}><option>Envío</option><option>Transporte</option><option>Impuestos</option><option>Pago al vendedor</option><option>Otros</option></select></label><label>Nota <span className="optional">OPCIONAL</span><input placeholder="Un detalle extra" value={note} onChange={(e) => setNote(e.target.value)} /></label></div>
    {error && <div className="alert error">{error}</div>}<div className="form-actions compact-actions"><button className="button primary" disabled={busy}>{busy ? 'Guardando…' : 'Agregar gasto'}<span>→</span></button></div>
  </form>;
}
