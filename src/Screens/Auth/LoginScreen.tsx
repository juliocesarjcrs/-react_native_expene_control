import React, { useState } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';

import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { login } from '../../services/auth';

// Types
import { PayloadLogin } from '../../shared/types/services';
// import { setIsAuthAction, setUserAction } from "../../actions/authActions";
import { setIsAuth, setUser } from '../../features/auth/authSlice';

// Components
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '../../components/MyButton';
import { AuthStackParamList } from '../../shared/types';
import { RootState } from '../../shared/types/reducers';
import { AppDispatch } from '../../shared/types/reducers/root-state.type';
import MyInput from '~/components/inputs/MyInput';

// Utils
import { ShowToast } from '../../utils/toastUtils';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

interface LoginFormData {
  email: string;
  password: string;
}
type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const colors = useThemeColors();
  const EMAIL_REGEX =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const { handleSubmit, control } = useForm<LoginFormData>();
  const loadingAuth = useSelector((state: RootState) => {
    return state.auth.loadingAuth;
  });
  const [loading, setLoading] = useState(false);
  const dispatch: AppDispatch = useDispatch();
  const onSubmit = async (payload: PayloadLogin) => {
    try {
      setLoading(true);
      const { data } = await login(payload);
      ShowToast('reponde ok login');
      setLoading(false);
      await AsyncStorage.setItem('access_token', data.access_token);
      const jsonValue = JSON.stringify(data.user);
      await AsyncStorage.setItem('user', jsonValue);
      dispatch(setUser(data.user));
      dispatch(setIsAuth(true));
    } catch (error) {
      if (typeof error === 'string') {
        ShowToast(`Error: ${error}`);
      } else if (typeof error === 'object' && error !== null) {
        const errorMessage = error.toString ? error.toString() : 'Unknown error';
        ShowToast(`Obj: ${errorMessage}`);
      } else {
        ShowToast('Unknown error');
      }
      setLoading(false);
      dispatch(setUser(null));
      dispatch(setIsAuth(false));
      showError(error);
    }
  };
  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      {loadingAuth ? (
        <MyLoading />
      ) : (
        <View
          style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
        >
          <MyInput
            name="email"
            control={control}
            label="Email"
            placeholder="ejemplo@correo.com"
            rules={{
              required: 'Email es obligatorio',
              pattern: { value: EMAIL_REGEX, message: 'Ingresa un email válido' }
            }}
            leftIcon="email"
            autoFocus
          />

          <MyInput
            name="password"
            type="password"
            control={control}
            label="Contraseña"
            placeholder="••••••••"
            rules={{
              required: 'La contraseña es obligatoria',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' }
            }}
            leftIcon="lock"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
          {loading ? (
            <MyLoading />
          ) : (
            <MyButton title="Iniciar sesión" onPress={handleSubmit(onSubmit)} />
          )}

          <MyButton
            title="Recuperar contraseña"
            onPress={() => {
              navigation.navigate('forgotPassword');
            }}
          />
        </View>
      )}
    </View>
  );
}
