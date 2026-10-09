import { supabase } from '../../lib/supabase';
import type { Expense } from '../../types/models';

export type ExpenseInput = Pick<Expense, 'description' | 'amount' | 'note' | 'category'>;

export async function addExpense(packageId: string, input: ExpenseInput) {
  if (!supabase) throw new Error('Conecta Supabase para continuar.');
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Tu sesión venció. Inicia sesión nuevamente.');
  const { data, error } = await supabase.from('expenses').insert({ ...input, package_id: packageId, user_id: auth.user.id }).select().single();
  if (error) throw error;
  return data as Expense;
}
