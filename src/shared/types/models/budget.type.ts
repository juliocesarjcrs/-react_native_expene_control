export type BudgetModel = {
  id: number;
  budget: number;
  createdAt: string;
  year: number;
  city: string;
  categoryId: number;
  subcategoryId: number | null;
  userId: number;
}