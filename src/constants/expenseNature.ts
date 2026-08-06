import { ExpenseNature } from '~/shared/types/models/expense.type';

export interface ExpenseNatureMeta {
  label: string;
  icon: string;
  colorKey: 'PRIMARY' | 'SUCCESS' | 'WARNING' | 'ERROR';
  description: string;
}

export const EXPENSE_NATURE_META: Record<ExpenseNature, ExpenseNatureMeta> = {
  operational: {
    label: 'Normal',
    icon: 'cash-minus',
    colorKey: 'WARNING',
    description: 'Gasto de consumo habitual'
  },
  investment: {
    label: 'Inversión',
    icon: 'home-city-outline',
    colorKey: 'SUCCESS',
    description: 'Compra de un activo: terreno, apartamento, inversión financiera'
  },
  atypical: {
    label: 'Atípico',
    icon: 'alert-circle-outline',
    colorKey: 'ERROR',
    description: 'Gasto grande no recurrente: emergencia, reparación mayor'
  }
};
