import React, { useState } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import type { StackNavigationProp } from '@react-navigation/stack';

// Redux
import { useAppDispatch } from '~/store/hooks';
import { signIn } from '~/features/auth/authThunks';

// Components
import MyButton from '~/components/MyButton';
import MyInput from '~/components/inputs/MyInput';

// Types
import type { AuthStackParamList } from '~/shared/types';
import type { PayloadLogin } from '~/shared/types/services';

// Utils
import { showError } from '~/utils/showError';

// Constants
import { EMAIL_REGEX } from '~/constants/regex';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const { handleSubmit, control } = useForm<PayloadLogin>({
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (payload: PayloadLogin): Promise<void> => {
    try {
      setLoading(true);
      await dispatch(signIn(payload));
      // Sin navegación: al cambiar isAuth, MyStack muestra MainTabs
    } catch (error) {
      showError(error);
      setLoading(false);
    }
  };

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
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
  );
}
