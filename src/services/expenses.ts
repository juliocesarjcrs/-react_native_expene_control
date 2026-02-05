import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
import {
  ComparePeriodsPayload,
  ComparePeriodsResponse,
  CreateExpensePayload,
  CreateExpenseResponse,
  EditExpensePayload,
  ExpenseSearchOptionsQuery,
  FindExpensesBySubcategoriesResponse,
  FindLastMonthsFromOnlyCategoryQuery,
  GetAverageBySubcategoriesQuery,
  GetAverageBySubcategoriesResponse,
  GetExpensesFromSubcategoryResponse,
  GetExpensesLastMonthsFromSubcategoryQuery,
  GetLastExpensesWithPaginateQuery,
  GetLastExpensesWithPaginateResponse,
  GetOneExpenseResponse
} from '../shared/types/services/expense-service.type';
import { ExpenseModel } from '~/shared/types';
const PREFIX = 'expenses';
export const getLastExpenses = async (params: any) => {
  return axios.get(PREFIX, { params });
};
export const CreateExpense = async (
  payload: CreateExpensePayload
): Promise<AxiosResponse<CreateExpenseResponse>> => {
  return axios.post(PREFIX, payload);
};

export const CreateMultipleExpense = async (
  payload: CreateExpensePayload[]
): Promise<AxiosResponse<ExpenseModel[]>> => {
  return axios.post(`${PREFIX}/bulk`, { expenses: payload });
};
export const getExpensesFromSubcategory = async (
  idSubcategory: number,
  month: string
): Promise<AxiosResponse<GetExpensesFromSubcategoryResponse>> => {
  return axios.get(`${PREFIX}/subcategory/${idSubcategory}`, {
    params: {
      date: month
    }
  });
};
export const getExpensesLastMonthsFromSubcategory = async (
  idSubcategory: number,
  params: GetExpensesLastMonthsFromSubcategoryQuery
) => {
  return axios.get(`${PREFIX}/subcategory/${idSubcategory}/last`, { params });
};

export const findLastMonthsFromOnlyCategory = async (
  idCategory: number,
  params: FindLastMonthsFromOnlyCategoryQuery
) => {
  return axios.get(`${PREFIX}/category/${idCategory}`, { params });
};

export const deleteExpense = async (idExpense: number) => {
  return axios.delete(`${PREFIX}/${idExpense}`);
};

export const getLastExpensesWithPaginate = async (
  params: GetLastExpensesWithPaginateQuery = {}
): Promise<AxiosResponse<GetLastExpensesWithPaginateResponse>> => {
  return axios.get(`${PREFIX}/last`, { params });
};

export const getOneExpense = async (
  idExpense: number
): Promise<AxiosResponse<GetOneExpenseResponse>> => {
  return axios.get(`${PREFIX}/${idExpense}`);
};

export const editExpense = async (idExpense: number, payload: EditExpensePayload) => {
  return axios.put(`${PREFIX}/${idExpense}`, payload);
};

export const findExpensesBySubcategories = async (
  params: ExpenseSearchOptionsQuery
): Promise<AxiosResponse<FindExpensesBySubcategoriesResponse>> => {
  return axios.get(`${PREFIX}/by-subcategories`, {
    params,
    paramsSerializer: {
      indexes: null
    }
  });
};

export const getComparePeriods = async (
  payload: ComparePeriodsPayload
): Promise<AxiosResponse<ComparePeriodsResponse>> => {
  return axios.post(`${PREFIX}/analysis/compare-periods`, payload);
};

export const getAverageBySubcategories = async (
  params: GetAverageBySubcategoriesQuery
): Promise<AxiosResponse<GetAverageBySubcategoriesResponse>> => {
  return axios.get(`${PREFIX}/average/by-subcategories`, { params });
};
