/** Gasto cuyo comentario no pudo ser parseado por copagoParser */
export interface ExpenseToEdit {
  id: number;
  commentary: string;
  cost: number;
  date: string;
}
