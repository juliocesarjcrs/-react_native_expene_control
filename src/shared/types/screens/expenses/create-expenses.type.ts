import { ExpenseNature } from '../../models/expense.type';
import { SubcategoryExpense } from '../../services';

export type CategoryExpensesFormat = {
  label: string;
  value: number;
  subcategories: SubcategoryExpense[];
  icon: () => React.JSX.Element;
};
export type FormExpensesValues = {
  cost: string;
  commentary: string;
  nature?: ExpenseNature;
};

export type SubcategoryExpensesFormat = {
  label: string;
  value: number;
};
