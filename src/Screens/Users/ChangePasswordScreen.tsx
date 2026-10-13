import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import { changePassword } from '~/services/users';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyInput from '~/components/inputs/MyInput';

// Types
import { SettingsStackParamList, UserModel } from '~/shared/types';
import { ChangePasswordPayload } from '~/shared/types/services';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export type ChangePasswordScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'changePassword'
>;

interface ChangePasswordScreenProps {
  navigation: ChangePasswordScreenNavigationProp;
}

type ChangePasswordFormData = ChangePasswordPayload;

const MIN_PASSWORD_LENGTH = 6;

const minLengthRule = {
  value: MIN_PASSWORD_LENGTH,
  message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
};

export default function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.changePassword;

  const { handleSubmit, control, getValues } = useForm<ChangePasswordFormData>({
    mode: 'onTouched',
    defaultValues: {
      currentlyPassword: '',
      password: '',
      passwordComfirm: ''
    }
  });

  const onSubmit = async (payload: ChangePasswordFormData): Promise<void> => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      const user: UserModel | null = jsonValue ? JSON.parse(jsonValue) : null;

      if (!user) {
        showError(new Error('No se encontró el usuario'));
        return;
      }

      await changePassword(user.id, payload);
      ShowToast('Contraseña actualizada exitosamente');
      navigation.goBack();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Contraseña actual */}
          <MyInput
            name="currentlyPassword"
            type="password"
            control={control}
            label="Contraseña actual"
            placeholder="••••••••"
            rules={{
              required: 'La contraseña actual es obligatoria',
              minLength: minLengthRule
            }}
            leftIcon="lock"
            autoFocus
          />

          {/* Nueva contraseña */}
          <MyInput
            name="password"
            type="password"
            control={control}
            label="Nueva contraseña"
            placeholder="••••••••"
            rules={{
              required: 'La nueva contraseña es obligatoria',
              minLength: minLengthRule,
              deps: ['passwordComfirm']
            }}
            leftIcon="lock-reset"
            helperText={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
          />

          {/* Confirmar contraseña */}
          <MyInput
            name="passwordComfirm"
            type="password"
            control={control}
            label="Confirmar nueva contraseña"
            placeholder="••••••••"
            rules={{
              required: 'Debe confirmar la contraseña',
              minLength: minLengthRule,
              validate: (value: string) =>
                value === getValues('password') || 'Las contraseñas no coinciden'
            }}
            leftIcon="lock-check"
          />

          {/* Botón de submit */}
          <MyButton title="Cambiar contraseña" onPress={handleSubmit(onSubmit)} variant="primary" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10
  }
});
