import { UserModel } from "../shared/types";
import { LogoutAction, SetAuthAction, SetLoadingAuthAction, SetUserAction } from "../shared/types/actions";

export const setUserAction = (user: UserModel | null): SetUserAction => ({
  type: 'SET_USER',
  payload: user
});

export const setIsAuthAction = (auth: boolean): SetAuthAction => ({
  type: 'SET_IS_AUTH',
  payload: auth
});


export const userSignOut = (): LogoutAction => ({
  type: 'LOGOUT'
});


export const setLoadingAuthAction = (loading: boolean): SetLoadingAuthAction => ({
  type: 'SET_LOADING_AUTH',
  payload: loading
});

