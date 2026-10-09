import type { ReactNode } from 'react';

export function StatCard({ label, value, icon, tone = 'green', footnote }: {
  label: string; value: string; icon: ReactNode; tone?: 'green' | 'blue' | 'violet' | 'amber'; footnote?: string;
}) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{footnote && <div className="stat-footnote">{footnote}</div>}</article>;
}
