import { UserModel } from "../models";

export type ChangePasswordPayload = {
  currentlyPassword: string;
  password: string;
  passwordComfirm: string;
}

export type EditUserPayload = Partial<UserModel>;
export type CreateUserPayload = Omit<UserModel, 'id'>;