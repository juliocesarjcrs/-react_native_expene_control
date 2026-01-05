import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
import {
  CreateBudgetPayload,
  DetectCityQuery,
  DetectCityResponse,
  GetBudgetsQuery,
  GetBudgetsResponse,
  GetBudgetSummaryQuery,
  GetBudgetSummaryResponse
} from '../shared/types/services';
const PREFIX = 'budgets';

export const createBudgets = async (payload: CreateBudgetPayload[]) => {
  return axios.post(PREFIX, payload);
};

export const getBudgets = async (
  params: GetBudgetsQuery
): Promise<AxiosResponse<GetBudgetsResponse>> => {
  return axios.get(PREFIX, { params });
};

/**
 * Obtiene el resumen de presupuestos agrupados por categoría
 * para un año y ciudad específicos
 */
export const getBudgetSummary = async (
  params: GetBudgetSummaryQuery
): Promise<AxiosResponse<GetBudgetSummaryResponse>> => {
  return axios.get(`${PREFIX}/summary`, { params });
};

/**
 * Detecta automáticamente la ciudad más reciente del usuario
 * basándose en sus presupuestos del año especificado
 */
export const detectCurrentCity = async (
  params: DetectCityQuery
): Promise<AxiosResponse<DetectCityResponse>> => {
  return axios.get(`${PREFIX}/detect-city`, { params });
};
