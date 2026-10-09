import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { AlertCircle, Check, FileSpreadsheet, Upload, X } from 'lucide-react';
import { parseProductsFile } from './parseProductsFile';
import { importProducts, type ProductInput } from '../products/productApi';
import type { ImportIssue, ProductImportRow } from '../../types/models';

function rowProblems(row: ProductImportRow): string[] {
  const result: string[] = [];
  if (!row.name.trim()) result.push('Falta el nombre.');
  if (!Number.isInteger(row.quantity) || row.quantity <= 0) result.push('Cantidad inválida.');
  if (!Number.isFinite(row.purchaseUnitPrice) || row.purchaseUnitPrice < 0) result.push('Compra inválida.');
  if (!Number.isFinite(row.saleUnitPrice) || row.saleUnitPrice < 0) result.push('Venta inválida.');
  if (Number.isFinite(row.purchaseUnitPrice) && Number(row.purchaseUnitPrice.toFixed(2)) !== row.purchaseUnitPrice) result.push('Compra: máximo dos decimales.');
  if (Number.isFinite(row.saleUnitPrice) && Number(row.saleUnitPrice.toFixed(2)) !== row.saleUnitPrice) result.push('Venta: máximo dos decimales.');
  return result;
}

export function ImportProductsDialog({ packageId, onClose, onImported }: { packageId: string; onClose: () => void; onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [rows, setRows] = useState<ProductImportRow[]>([]);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [filename, setFilename] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const batchId = useRef<string | null>(null);
  const validRows = useMemo(() => rows.filter((row) => included.has(row.rowNumber) && rowProblems(row).length === 0), [rows, included]);

  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    return () => openerRef.current?.focus();
  }, []);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!attempted && !busy) onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')]
      .filter((element) => !element.classList.contains('sr-only'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.currentTarget.value = '';
    setMessage(''); setFilename(file.name); batchId.current = null;
    try {
      const parsed = await parseProductsFile(file);
      setRows(parsed.rows); setIssues(parsed.issues);
      setIncluded(new Set(parsed.rows.map((row) => row.rowNumber)));
      if (parsed.rows.length === 0 && parsed.issues.length === 0) setMessage('No encontramos productos en la hoja.');
    } catch {
      setRows([]); setIssues([]); setMessage('No pudimos leer este archivo. Prueba con un .xlsx o .csv válido.');
    }
  }

  function updateRow(rowNumber: number, field: keyof ProductImportRow, value: string) {
    setRows((current) => current.map((row) => row.rowNumber !== rowNumber ? row : {
      ...row,
      [field]: field === 'name' ? value : value.trim() === '' ? Number.NaN : Number(value),
    }));
  }

  function toggleRow(rowNumber: number) {
    setIncluded((current) => { const next = new Set(current); if (next.has(rowNumber)) next.delete(rowNumber); else next.add(rowNumber); return next; });
  }

  async function confirmImport() {
    if (!validRows.length) return;
    setBusy(true); setMessage('');
    batchId.current ??= crypto.randomUUID();
    const payload: ProductInput[] = validRows.map((row) => ({ name: row.name.trim(), initial_quantity: row.quantity, purchase_unit_price: row.purchaseUnitPrice, sale_unit_price: row.saleUnitPrice }));
    try {
      await importProducts(packageId, batchId.current, payload);
      onImported();
    } catch {
      setAttempted(true);
      setMessage('No se importaron los productos. Tu archivo sigue aquí para que puedas reintentar.');
    } finally { setBusy(false); }
  }

  const rowIssue = (row: ProductImportRow) => rowProblems(row).join(' ');
  const locked = busy || attempted;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !locked) onClose(); }}>
    <section ref={dialogRef} className="modal import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title" onKeyDown={handleDialogKeyDown}>
      <div className="modal-heading"><div className="modal-icon"><FileSpreadsheet size={19} /></div><div><span className="section-kicker">CARGA DE PRODUCTOS</span><h2 id="import-title">Importar desde Excel</h2></div><button className="icon-button" aria-label="Cerrar ventana" onClick={onClose} disabled={locked}><X size={19} /></button></div>
      <p className="muted">Elige una hoja con Producto, Cantidad, Precio de compra y Precio de venta. Revisaremos todo antes de guardar.</p>
      {attempted && <div className="alert warning" role="status">No se pudo confirmar el resultado. Reintenta con estos mismos datos para comprobarlo sin duplicar productos.</div>}
      <div className="import-toolbar"><button className="button secondary" type="button" onClick={() => inputRef.current?.click()} disabled={locked}><Upload size={16} />{filename ? 'Elegir otro archivo' : 'Seleccionar archivo'}</button><a className="template-link" href="/plantilla-productos.xlsx" download>Descargar plantilla Excel</a><input ref={inputRef} className="sr-only" type="file" accept=".xlsx,.csv" onChange={(event) => void selectFile(event)} disabled={locked} /></div>
      {filename && <div className="file-chip"><FileSpreadsheet size={15} />{filename}<span>{validRows.length} listas para importar</span></div>}
      {issues.some((issue) => issue.rowNumber === 1) && <div className="alert error"><AlertCircle size={16} />{issues.filter((issue) => issue.rowNumber === 1).map((issue) => issue.message).join(' ')}</div>}
      {rows.length > 0 && <><div className="import-table-wrap"><table className="data-table import-table"><thead><tr><th>INCLUIR</th><th>PRODUCTO</th><th>CANTIDAD</th><th>COMPRA</th><th>VENTA</th></tr></thead><tbody>{rows.map((row) => { const problem = rowIssue(row); return <tr key={row.rowNumber} className={problem ? 'invalid-row' : ''}>
        <td><input type="checkbox" checked={included.has(row.rowNumber)} onChange={() => toggleRow(row.rowNumber)} aria-label={`Incluir fila ${row.rowNumber}`} disabled={locked} /></td>
        <td><input value={row.name} aria-label={`Producto fila ${row.rowNumber}`} onChange={(event) => updateRow(row.rowNumber, 'name', event.target.value)} disabled={locked} /></td>
        <td><input type="number" step="1" value={Number.isFinite(row.quantity) ? row.quantity : ''} aria-label={`Cantidad fila ${row.rowNumber}`} onChange={(event) => updateRow(row.rowNumber, 'quantity', event.target.value)} disabled={locked} /></td>
        <td><input type="number" min="0" step="0.01" value={Number.isFinite(row.purchaseUnitPrice) ? row.purchaseUnitPrice : ''} aria-label={`Compra fila ${row.rowNumber}`} onChange={(event) => updateRow(row.rowNumber, 'purchaseUnitPrice', event.target.value)} disabled={locked} /></td>
        <td><input type="number" min="0" step="0.01" value={Number.isFinite(row.saleUnitPrice) ? row.saleUnitPrice : ''} aria-label={`Venta fila ${row.rowNumber}`} onChange={(event) => updateRow(row.rowNumber, 'saleUnitPrice', event.target.value)} disabled={locked} /></td>
      </tr>; })}</tbody></table></div><div className="import-issues">{rows.filter((row) => rowIssue(row)).map((row) => <div key={row.rowNumber}><AlertCircle size={13} />Fila {row.rowNumber}: {rowIssue(row)}</div>)}</div></>}
      {message && <div className="alert error" role="alert">{message}</div>}
      <div className="modal-footer"><span>{validRows.length > 0 ? <><Check size={14} />{validRows.length} productos válidos</> : 'Selecciona un archivo para empezar'}</span><div><button className="button secondary" onClick={onClose} disabled={locked}>Cancelar</button><button className="button primary" onClick={() => void confirmImport()} disabled={busy || validRows.length === 0}>{busy ? 'Importando…' : attempted ? 'Reintentar importación' : 'Importar productos'}<span>→</span></button></div></div>
    </section>
  </div>;
}
