import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';

// Services
import { passwordRecovery } from '~/services/auth';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';

// Types
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '~/shared/types';
import { PasswordRecoveryPayload } from '~/shared/types/services';

// Utils
import { ShowToast } from '~/utils/toastUtils';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'resetPassword'>;

interface ScreenProps {
  navigation: ScreenNavigationProp;
}

interface FormData {
  password: string;
  confirmPassword: string;
}

interface RootState {
  auth: {
    user: {
      id: number;
    };
  };
}

export default function ResetPasswordScreen({ navigation }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.resetPassword;
  const user = useSelector((state: RootState) => state.auth.user);

  // Form
  const { handleSubmit, control, watch } = useForm<FormData>({
    mode: 'onTouched',
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Estados
  const [loading, setLoading] = useState<boolean>(false);

  // Watch password para validar confirmación
  const password = watch('password');

  // Submit
  const onSubmit = async (formData: FormData): Promise<void> => {
    try {
      const payload: PasswordRecoveryPayload = {
        password: formData.password
      };

      setLoading(true);
      const { data } = await passwordRecovery(user.id, payload);
      setLoading(false);

      if (data.user) {
        ShowToast('Contraseña restablecida exitosamente');
        navigation.navigate('login');
      }
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Mensaje instructivo */}
          <View style={[styles.messageContainer, { backgroundColor: colors.SUCCESS + '15' }]}>
            <Text style={[styles.messageText, { color: colors.TEXT_PRIMARY }]}>
              Crea una nueva contraseña segura para tu cuenta
            </Text>
          </View>

          {/* Input de nueva contraseña */}
          <MyInput
            name="password"
            type="password"
            control={control}
            label="Nueva contraseña"
            placeholder="••••••••"
            rules={{
              required: 'La contraseña es obligatoria',
              minLength: {
                value: 3,
                message: 'La contraseña debe tener mínimo 3 caracteres'
              },
              maxLength: {
                value: 50,
                message: 'La contraseña no puede tener más de 50 caracteres'
              }
            }}
            leftIcon="lock"
            autoFocus
          />

          {/* Input de confirmar contraseña */}
          <MyInput
            name="confirmPassword"
            type="password"
            control={control}
            label="Confirmar contraseña"
            placeholder="••••••••"
            rules={{
              required: 'Debes confirmar la contraseña',
              validate: (value: string) => value === password || 'Las contraseñas no coinciden'
            }}
            leftIcon="lock-check"
          />

          {/* Requisitos de contraseña */}
          <View style={styles.requirementsContainer}>
            <Text style={[styles.requirementsTitle, { color: colors.TEXT_SECONDARY }]}>
              Requisitos de la contraseña:
            </Text>
            <Text style={[styles.requirementItem, { color: colors.TEXT_SECONDARY }]}>
              • Mínimo 6 caracteres
            </Text>
            <Text style={[styles.requirementItem, { color: colors.TEXT_SECONDARY }]}>
              • Máximo 50 caracteres
            </Text>
          </View>

          {/* Botón de submit */}
          {loading ? (
            <MyLoading />
          ) : (
            <MyButton
              title="Restablecer contraseña"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20
  },
  messageText: {
    fontSize: SMALL + 1,
    textAlign: 'center',
    lineHeight: 20
  },
  requirementsContainer: {
    marginBottom: 20,
    paddingHorizontal: 4
  },
  requirementsTitle: {
    fontSize: SMALL,
    fontWeight: '600',
    marginBottom: 8
  },
  requirementItem: {
    fontSize: SMALL - 1,
    marginBottom: 4,
    lineHeight: 18
  }
});
