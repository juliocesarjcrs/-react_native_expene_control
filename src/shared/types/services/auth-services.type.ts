import { UserModel } from '../models';

export type PayloadLogin = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type CheckRecoverycodeParams = {
  recoveryCode: number;
};

export type PasswordRecoveryPayload = {
  password: string;
};

export type LoginResponse = {
  access_token: string;
  user: UserModel;
};
