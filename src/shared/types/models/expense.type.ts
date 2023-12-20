export type ExpenseModel = {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string | null;
  date: string;
  userId: number;
  subcategoryId: number;

}