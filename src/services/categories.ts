import { CategoryModel } from '~/shared/types';
import axios from '../plugins/axiosConfig';
import {
  AllExpensesByRangeDatesResponse,
  CategoryUsage,
  CreateCategoryPayload,
  EditCategoryPayload,
  ExpenseAnalysisParams,
  ExpenseAnalysisResponse,
  GetAllExpensesByMonthResponse,
  GetAllSubcategoriesExpensesByMonthResponse,
  GetCategoriesParams,
  GetCategoriesResponse,
  GetCategoryTypeIncomeResponse,
  GetCategoryWithSubcategoriesResponse
} from '../shared/types/services';
import { AxiosResponse } from 'axios';
const PREFIX = 'categories';
export const getCategories = async (
  params: GetCategoriesParams
): Promise<AxiosResponse<GetCategoriesResponse>> => {
  return axios.get(PREFIX, { params });
};
export const getCategory = async (idCategory: number): Promise<AxiosResponse<CategoryModel>> => {
  return axios.get(`${PREFIX}/${idCategory}`);
};

export const createCategory = (
  payload: CreateCategoryPayload
): Promise<AxiosResponse<CategoryModel>> => axios.post(PREFIX, payload);

export const EditCategory = async (idCategory: number, payload: EditCategoryPayload) => {
  return axios.put(`${PREFIX}/${idCategory}`, payload);
};

export const getCategoryWithSubcategories = async (): Promise<
  AxiosResponse<GetCategoryWithSubcategoriesResponse>
> => {
  // deprecated
  return axios.get(`${PREFIX}/subcategories`);
};

export const getCategoryTypeIncome = async (
  month: string
): Promise<AxiosResponse<GetCategoryTypeIncomeResponse>> => {
  return axios.get(`${PREFIX}/incomes`, {
    params: {
      date: month
    }
  });
};
export const getAllExpensesByMonth = async (
  month: string
): Promise<AxiosResponse<GetAllExpensesByMonthResponse>> => {
  return axios.get(`${PREFIX}/expenses/month`, {
    params: {
      date: month
    }
  });
};

export const getAllSubcategoriesExpensesByMonth = async (
  month: string
): Promise<AxiosResponse<GetAllSubcategoriesExpensesByMonthResponse>> => {
  return axios.get(`${PREFIX}/subcategories/expenses/month`, {
    params: {
      date: month
    }
  });
};

export const getAllExpensesByRangeDates = async (
  startDate: string,
  endDate: string
): Promise<AxiosResponse<AllExpensesByRangeDatesResponse>> => {
  return axios.get(`${PREFIX}/expenses/month`, {
    params: {
      startDate,
      endDate
    }
  });
};

export const getExpensesAnalysis = async ({
  startDate,
  endDate,
  natures
}: ExpenseAnalysisParams): Promise<AxiosResponse<ExpenseAnalysisResponse>> => {
  return axios.get(`${PREFIX}/expenses/analysis`, {
    params: {
      startDate,
      endDate,
      // Axios omite los params undefined: sin natures, el backend incluye todas
      natures: natures && natures.length > 0 ? natures.join(',') : undefined
    }
  });
};

export const getCategoryUsage = (id: number): Promise<AxiosResponse<CategoryUsage>> =>
  axios.get(`${PREFIX}/${id}/usage`);

export const deleteCategory = (id: number): Promise<AxiosResponse<unknown>> =>
  axios.delete(`${PREFIX}/${id}`);
