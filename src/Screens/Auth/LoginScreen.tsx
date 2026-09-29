import React, { useState } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';

import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { login } from '../../services/auth';

// Apollo
import { clearApolloCache } from '~/plugins/ApolloClient';

// Types
import { PayloadLogin } from '../../shared/types/services';
import { setIsAuth, setUser } from '../../features/auth/authSlice';
import { AuthStackParamList } from '../../shared/types';
import { RootState } from '../../shared/types/reducers';
import { AppDispatch } from '../../shared/types/reducers/root-state.type';

// Components
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '../../components/MyButton';
import MyInput from '~/components/inputs/MyInput';

// Utils
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

const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const colors = useThemeColors();

  const { handleSubmit, control } = useForm<LoginFormData>();
  const loadingAuth = useSelector((state: RootState) => state.auth.loadingAuth);
  const [loading, setLoading] = useState(false);
  const dispatch: AppDispatch = useDispatch();

  const onSubmit = async (payload: PayloadLogin): Promise<void> => {
    try {
      setLoading(true);
      const { data } = await login(payload);

      // Guardar sesión del nuevo usuario
      await AsyncStorage.setItem('access_token', data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Limpiar caché de Apollo ANTES de marcar isAuth, para no mostrar datos del usuario anterior
      await clearApolloCache();

      dispatch(setUser(data.user));
      dispatch(setIsAuth(true));
    } catch (error) {
      dispatch(setUser(null));
      dispatch(setIsAuth(false));
      showError(error);
    } finally {
      setLoading(false);
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

          <MyButton
            title="Iniciar sesión"
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            loading={loading}
          />

          <MyButton
            title="Recuperar contraseña"
            variant="ghost"
            onPress={() => navigation.navigate('forgotPassword')}
            disabled={loading}
          />
        </View>
      )}
    </View>
  );
}
