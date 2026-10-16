// features/auth/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '~/services/auth';
import { getUser } from '~/services/users';
import { clearApolloCache } from '~/plugins/ApolloClient';
import type { PayloadLogin } from '~/shared/types/services';
import type { UserModel } from '~/shared/types';
import { setUser, setIsAuth, logout, setRestoringSession } from './authSlice';
import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { RootState } from '~/store';

type AppThunk<R = void> = ThunkAction<Promise<R>, RootState, unknown, UnknownAction>;

export const signIn =
  (payload: PayloadLogin): AppThunk =>
  async (dispatch) => {
    const { data } = await login(payload);
    await AsyncStorage.multiSet([
      ['access_token', data.access_token],
      ['user', JSON.stringify(data.user)]
    ]);
    await clearApolloCache();
    dispatch(setUser(data.user));
    dispatch(setIsAuth(true));
  };

export const signOut = createAsyncThunk('auth/signOut', async (_, { dispatch }) => {
  await AsyncStorage.multiRemove(['access_token', 'user']);
  await clearApolloCache();
  dispatch(logout());
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { dispatch }) => {
  try {
    const [[, token], [, userJson]] = await AsyncStorage.multiGet(['access_token', 'user']);
    const storedUser: UserModel | null = userJson ? JSON.parse(userJson) : null;

    if (token && storedUser?.id) {
      dispatch(setUser(storedUser));
      dispatch(setIsAuth(true));
      getUser(storedUser.id)
        .then(({ data }) => dispatch(setUser(data)))
        .catch(() => {}); // 401 lo maneja el interceptor
    }
  } finally {
    dispatch(setRestoringSession(false));
  }
});

export const updateSessionUser = createAsyncThunk(
  'auth/updateSessionUser',
  async (user: UserModel, { dispatch }) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    dispatch(setUser(user));
  }
);
