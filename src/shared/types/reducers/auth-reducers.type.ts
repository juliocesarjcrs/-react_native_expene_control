import { LogoutAction, SetAuthAction, SetLoadingAuthAction, SetUserAction } from '../actions';
import { UserModel } from '../models';

export type AuthState = {
  user: UserModel | null;
  isAuth: boolean;
  loadingAuth: boolean;
};

export type AuthAction = SetUserAction | SetAuthAction | LogoutAction | SetLoadingAuthAction;
