import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
import { AuthState } from '../../shared/types/reducers';
import { UserModel } from '../../shared/types';


const initialState: AuthState = {
  user: null,
  isAuth: false,
  loadingAuth: false,
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
    logout: (state) => {
      state.user = null;
      state.isAuth = false;
    },
    setLoadingAuth: (state, action: PayloadAction<boolean>) => {
      state.loadingAuth = action.payload;
    },
  },
});

export const { setUser, setIsAuth, logout, setLoadingAuth } = authSlice.actions;
export default authSlice.reducer;
