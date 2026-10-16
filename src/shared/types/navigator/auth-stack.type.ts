export type AuthStackParamList = {
  login: undefined;
  forgotPassword: undefined;
  checkCodePassword: { userId: number };
  resetPassword: { userId: number };
};
