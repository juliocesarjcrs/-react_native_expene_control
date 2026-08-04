export type ExpenseNature = 'operational' | 'investment' | 'atypical';
export type ExpenseModel = {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string | null;
  date: string;
  userId: number;
  subcategoryId: number;
  idempotencyKey?: string;
  nature: ExpenseNature;
};

export type ExtendedExpenseModel = ExpenseModel & {
  category: string;
  dateFormat: string;
  iconCategory: string;
  subcategory: string;
};
