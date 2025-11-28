import { UserModel } from "../models";

export type ChangePasswordPayload = {
  currentlyPassword: string;
  password: string;
  passwordComfirm: string;
}

export type EditUserPayload = Partial<UserModel>;
export type CreateUserPayload = Omit<UserModel, 'id'>;

export type GetUsersListResponse = UserModel[];

export type CreateUserResponse = {
  data: UserModel;
};

export type ChangePasswordResponse = {
  data: UserModel;
};

export type GetUserResponse = {
  data: UserModel;
};

export type EditUserResponse = {
  data: UserModel;
};