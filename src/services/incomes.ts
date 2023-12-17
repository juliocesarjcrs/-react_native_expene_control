import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig'
import { CreateIncomePayload, EditIncomePayload, FindIncomesByCategoryIdResponse, FindLastIncomesMonthsFromOnlyCategoryQuery, FindLastIncomesMonthsFromOnlyCategoryResponse, IncomeSearchOptionsQuery } from '../shared/types/services/income-service.type';
const PREFIX = 'incomes'

export const getIncomesByDate = async (month: string) => {
  return axios.get(`${PREFIX}`, {
    params: {
      date: month
    }
  });
}

export const CreateIncome = async (payload: CreateIncomePayload) => {
  return axios.post(PREFIX, payload);
}

export const deleteIncome = async (idIncome: number) => {
  return axios.delete(`${PREFIX}/${idIncome}`);
}

// export const getLastIncomes = async (params) => {
//   return axios.get(PREFIX, { params });
// }

export const getLastIncomesWithPaginate = async (params = {}) => {
  return axios.get(`${PREFIX}/last`, { params });
}

export const editIncome = async (idIncome: number, payload: EditIncomePayload) => {
  return axios.put(`${PREFIX}/${idIncome}`, payload);
}
export const findLastIncomesMonthsFromOnlyCategory = async (idCategory: number, params: FindLastIncomesMonthsFromOnlyCategoryQuery): Promise<AxiosResponse<FindLastIncomesMonthsFromOnlyCategoryResponse>> => {
  return axios.get(`${PREFIX}/category/${idCategory}`, { params });
}

export const findIncomesByCategoryId = async (idCategory: number, params: IncomeSearchOptionsQuery): Promise<AxiosResponse<FindIncomesByCategoryIdResponse>> => {
  return axios.get(`${PREFIX}/by-category/${idCategory}`, { params });
}