import { UserModel } from "../models";

export type SetUserAction = {
  type: 'SET_USER';
  payload: UserModel | null;
}

export type SetAuthAction = {
  type: 'SET_IS_AUTH';
  payload: boolean;
}

export type SetLoadingAuthAction = {
  type: 'SET_LOADING_AUTH';
  payload: boolean;
}

export type LogoutAction =  {
  type: 'LOGOUT';
}
