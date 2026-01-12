import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
import {
  GetSavingsByUserQuery,
  GetSavingsByUserResponse,
  GetUpdateAllSavingsByUserQuery,
  SavingsPeriodAnalysisQuery,
  SavingsPeriodAnalysisResponse
} from '../shared/types/services';
const PREFIX = 'saving';

export const getSavingsByUser = async (
  params: GetSavingsByUserQuery
): Promise<AxiosResponse<GetSavingsByUserResponse>> => {
  return axios.get(PREFIX, { params });
};

export const getUpdateAllSavingsByUser = async (params: GetUpdateAllSavingsByUserQuery) => {
  return axios.get(`${PREFIX}/update`, { params });
};

export const getSavingsPeriodAnalysis = async (
  params: SavingsPeriodAnalysisQuery
): Promise<AxiosResponse<SavingsPeriodAnalysisResponse>> => {
  return axios.get(`${PREFIX}/period-analysis`, { params });
};
