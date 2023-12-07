import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig'
import { AllExpensesByRangeDatesResponse } from '../shared/types/services';
const PREFIX = 'expenses'

export const getAllExpensesByRangeDates = async (startDate: string, endDate: string): Promise<AxiosResponse<AllExpensesByRangeDatesResponse>> => {
  return axios.get(`categories/expenses/month`, {
      params: {
        startDate,
        endDate
      },
  });
};

