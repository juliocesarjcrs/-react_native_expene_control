import { IncomeModel } from "../models";

export type CreateIncomePayload = Omit<IncomeModel, 'id'>;
export type EditIncomePayload = Partial<IncomeModel>;

export type FindLastIncomesMonthsFromOnlyCategoryQuery = {
  numMonths: number;
}

export type FindLastIncomesMonthsFromOnlyCategoryResponse = {
  graph: number[];
  labels: string[];
  average: number;
  previosAverage: number;
  sum: number;
}


export type IncomeSearchOptionsQuery = {
  startDate?: Date;
  endDate?: Date;
  searchValue?: string;
  orderBy?: 'date' | 'amount';
  order?: 'ASC' | 'DESC';
}

export type FindIncomesByCategoryIdResponse = {
  incomes: IncomeModel[];
  sum: number
}
