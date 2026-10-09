const usd = new Intl.NumberFormat('es-PA', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function formatUSD(value: number): string {
  return usd.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}
