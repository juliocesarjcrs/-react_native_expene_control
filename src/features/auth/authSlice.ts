import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserModel } from '~/shared/types';

export type AuthState = {
  user: UserModel | null;
  isAuth: boolean;
  isRestoringSession: boolean;
};

const initialState: AuthState = {
  user: null,
  isAuth: false,
  isRestoringSession: true // la app arranca "restaurando" hasta que se sepa si hay sesión
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserModel | null>) => {
      state.user = action.payload;
    },
    setIsAuth: (state, action: PayloadAction<boolean>) => {
      state.isAuth = action.payload;
    },
    setRestoringSession: (state, action: PayloadAction<boolean>) => {
      state.isRestoringSession = action.payload;
    },
    // Al cerrar sesión ya no se está restaurando nada
    logout: () => ({ ...initialState, isRestoringSession: false })
  }
});

export const { setUser, setIsAuth, setRestoringSession, logout } = authSlice.actions;
export default authSlice.reducer;
