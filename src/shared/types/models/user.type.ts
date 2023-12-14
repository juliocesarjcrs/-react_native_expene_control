export type UserModel = {
  id: number;
  createdAt: string;
  name: string;
  image: string | null;
  email: string;
  password?: string;
  recoveryCode: string | null;
  role: number;
}