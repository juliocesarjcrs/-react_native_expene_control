export type ExpenseModel = {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string | null;
  date: string;
  userId: number;
  subcategoryId: number;
};

export type ExtendedExpenseModel = ExpenseModel & {
  category: string;
  dateFormat: string;
  iconCategory: string;
  subcategory: string;
};
