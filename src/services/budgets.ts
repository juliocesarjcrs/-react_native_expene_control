import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig'
import { CreateBudgetPayload, GetBudgetsQuery, GetBudgetsResponse } from '../shared/types/services';
const PREFIX = 'budgets'

export const createBudgets = async (payload: CreateBudgetPayload []) => {
  return axios.post(PREFIX, payload);
};

export const getBudgets = async (params: GetBudgetsQuery): Promise<AxiosResponse<GetBudgetsResponse>> => {
  return axios.get(PREFIX, { params });
}
