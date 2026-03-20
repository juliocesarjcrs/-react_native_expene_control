/** Gasto cuyo comentario no pudo ser parseado por copagoParser */
export interface UnrecognizedExpense {
  id: number;
  commentary: string;
  cost: number;
  date: string;
}
