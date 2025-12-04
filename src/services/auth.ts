import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
// Types
import {
  PasswordRecoveryPayload,
  PayloadLogin,
  CheckRecoverycodeParams,
  ForgotPasswordPayload,
  LoginResponse
} from '../shared/types/services';
const PREFIX = 'auth';

export const login = async (payload: PayloadLogin): Promise<AxiosResponse<LoginResponse>> => {
  return await axios.post(`${PREFIX}/login`, payload);
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  return await axios.post(`${PREFIX}/forgot-password`, payload);
};

export const checkRecoverycode = async (idUser: number, params: CheckRecoverycodeParams) => {
  return await axios.get(`${PREFIX}/check-recovery-code/${idUser}`, { params });
};

export const passwordRecovery = async (idUser: number, payload: PasswordRecoveryPayload) => {
  return await axios.put(`${PREFIX}/password-recovery/${idUser}`, payload);
};
