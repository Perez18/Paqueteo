export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}</div>;
}
