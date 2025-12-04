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
};

export type SubcategoryExpensesFormat = {
  label: string;
  value: number;
};
