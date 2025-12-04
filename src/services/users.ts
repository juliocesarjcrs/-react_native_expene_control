import { UserModel } from '~/shared/types';
import axios from '../plugins/axiosConfig';
import {
  ChangePasswordPayload,
  CreateUserPayload,
  CreateUserResponse,
  EditUserPayload,
  EditUserResponse,
  GetUserResponse,
  GetUsersListResponse
} from '../shared/types/services';

const PREFIX = 'users';
/**
 * Obtiene los datos de un usuario por ID
 */
export const getUser = async (idUser: number): Promise<GetUserResponse> => {
  return axios.get<UserModel>(`${PREFIX}/${idUser}`);
};

export const changePassword = async (idUser: number, payload: ChangePasswordPayload) => {
  return axios.put(`${PREFIX}/change-password/${idUser}`, payload);
};

/**
 * Edita los datos de un usuario
 */
export const editUser = async (
  idUser: number,
  payload: EditUserPayload | FormData
): Promise<EditUserResponse> => {
  return axios.put<UserModel>(`${PREFIX}/${idUser}`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const createUser = async (
  payload: CreateUserPayload | FormData
): Promise<CreateUserResponse> => {
  return axios.post<UserModel>(`${PREFIX}`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getUsersList = async (): Promise<{ data: GetUsersListResponse }> => {
  return axios.get<GetUsersListResponse>(`${PREFIX}`);
};
