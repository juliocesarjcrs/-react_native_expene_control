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
// getLastIncomesWithPaginate
export type GetLastIncomesWithPaginateQuery = {
  take?: number;
  page?: number;
  query?: string | null;
}

export type LastIncomes = {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string;
  date: string;
  dateFormat: string;
  category: string;
  idCategory: number;
  iconCategory: string;
};

export type GetLastIncomesWithPaginateResponse = {
  data: LastIncomes[];
};
