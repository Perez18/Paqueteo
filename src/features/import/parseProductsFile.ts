import * as XLSX from 'xlsx';
import type { ImportIssue, ProductImportRow } from '../../types/models';

const headerMap: Record<string, keyof Omit<ProductImportRow, 'rowNumber'>> = {
  producto: 'name',
  cantidad: 'quantity',
  'precio de compra': 'purchaseUnitPrice',
  'precio de venta': 'saleUnitPrice',
};

function normalizedHeader(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

function numericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  const normalized = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
  return normalized ? Number(normalized) : Number.NaN;
}

export async function parseProductsFile(file: File): Promise<{
  rows: ProductImportRow[];
  issues: ImportIssue[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { rows: [], issues: [{ rowNumber: null, message: 'El archivo no contiene una hoja.' }] };

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true });
  const headers = (rawRows[0] ?? []).map(normalizedHeader);
  const indexes = new Map<string, number>();
  headers.forEach((header, index) => {
    if (headerMap[header]) indexes.set(header, index);
  });

  const issues: ImportIssue[] = [];
  for (const required of Object.keys(headerMap)) {
    if (!indexes.has(required)) issues.push({ rowNumber: 1, message: `Falta la columna “${required}”.` });
  }
  if (issues.length) return { rows: [], issues };

  const rows: ProductImportRow[] = [];
  rawRows.slice(1).forEach((raw, offset) => {
    const values = (raw as unknown[]).map((value) => String(value ?? '').trim());
    if (values.every((value) => !value)) return;
    const rowNumber = offset + 2;
    const name = values[indexes.get('producto')!];
    const quantity = numericValue(values[indexes.get('cantidad')!]);
    const purchaseUnitPrice = numericValue(values[indexes.get('precio de compra')!]);
    const saleUnitPrice = numericValue(values[indexes.get('precio de venta')!]);
    const rowIssues: string[] = [];

    if (!name) rowIssues.push('Escribe el nombre del producto.');
    if (!Number.isInteger(quantity) || quantity <= 0) rowIssues.push('La cantidad debe ser un número entero mayor que cero.');
    if (!Number.isFinite(purchaseUnitPrice) || purchaseUnitPrice < 0) rowIssues.push('El precio de compra debe ser cero o mayor.');
    if (!Number.isFinite(saleUnitPrice) || saleUnitPrice < 0) rowIssues.push('El precio de venta debe ser cero o mayor.');
    if (Number.isFinite(purchaseUnitPrice) && Number(purchaseUnitPrice.toFixed(2)) !== purchaseUnitPrice) rowIssues.push('El precio de compra admite hasta dos decimales.');
    if (Number.isFinite(saleUnitPrice) && Number(saleUnitPrice.toFixed(2)) !== saleUnitPrice) rowIssues.push('El precio de venta admite hasta dos decimales.');

    rowIssues.forEach((message) => issues.push({ rowNumber, message }));
    rows.push({ rowNumber, name, quantity, purchaseUnitPrice, saleUnitPrice });
  });
  return { rows, issues };
}
