import type { Expense } from '../../types/models';
import { formatDate, formatUSD } from '../../lib/currency';
import { EmptyState } from '../../components/EmptyState';
import { ReceiptText } from 'lucide-react';

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (!expenses.length) return <EmptyState icon={<ReceiptText size={20} />} title="Sin gastos todavía">Los gastos que agregues aparecerán aquí.</EmptyState>;
  return <div className="expense-list">{expenses.map((expense) => <div className="expense-item" key={expense.id}><div className="expense-symbol">↗</div><div className="expense-copy"><strong>{expense.description}</strong><span>{expense.category ?? 'Otro'}{expense.note ? ` · ${expense.note}` : ''}</span></div><time>{formatDate(expense.created_at)}</time><strong className="expense-amount">− {formatUSD(expense.amount)}</strong></div>)}</div>;
}
