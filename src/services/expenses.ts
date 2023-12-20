import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig'
import { CreateExpensePayload, EditExpensePayload, ExpenseSearchOptionsQuery, FindExpensesBySubcategoriesResponse, FindLastMonthsFromOnlyCategoryQuery, GetExpensesLastMonthsFromSubcategoryQuery } from '../shared/types/services/expense-service.type';
import { AllExpensesByRangeDatesResponse } from '../shared/types/services';
const PREFIX = 'expenses'
export const getLastExpenses = async (params: any) => {
  return axios.get(PREFIX, { params });
}
export const CreateExpense = async (payload: CreateExpensePayload) => {
  return axios.post(PREFIX, payload);
}
export const getExpensesFromSubcategory = async (idSubcategory: number, month: string) => {
  return axios.get(`${PREFIX}/subcategory/${idSubcategory}`, {
    params: {
      date: month
    }
  });
}
export const getExpensesLastMonthsFromSubcategory = async (idSubcategory: number, params: GetExpensesLastMonthsFromSubcategoryQuery) => {
  return axios.get(`${PREFIX}/subcategory/${idSubcategory}/last`, { params });
}

export const findLastMonthsFromOnlyCategory = async (idCategory: number, params: FindLastMonthsFromOnlyCategoryQuery) => {
  return axios.get(`${PREFIX}/category/${idCategory}`, { params });
}

export const deleteExpense = async (idExpense: number) => {
  return axios.delete(`${PREFIX}/${idExpense}`);
}

export const getLastExpensesWithPaginate = async (params = {}) => {
  return axios.get(`${PREFIX}/last`, { params });
}

export const getOneExpense = async (idExpense: number) => {
  return axios.get(`${PREFIX}/${idExpense}`);
}

export const editExpense = async (idExpense: number, payload: EditExpensePayload) => {
  return axios.put(`${PREFIX}/${idExpense}`, payload);
}


export const getAllExpensesByRangeDates = async (startDate: string, endDate: string): Promise<AxiosResponse<AllExpensesByRangeDatesResponse>> => {
  return axios.get(`categories/expenses/month`, {
    params: {
      startDate,
      endDate
    },
  });
}

export const findExpensesBySubcategories = async (params: ExpenseSearchOptionsQuery): Promise<AxiosResponse<FindExpensesBySubcategoriesResponse>> => {
  return axios.get(`${PREFIX}/by-subcategories`, { params });
}


