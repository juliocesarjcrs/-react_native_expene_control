import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';

// Services
import { checkRecoverycode } from '~/services/auth';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';

// Types
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '~/shared/types';
import { CheckRecoverycodeParams } from '~/shared/types/services';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'checkCodePassword'>;

interface ScreenProps {
  navigation: ScreenNavigationProp;
}

interface FormData {
  recoveryCode: string;
}

interface RootState {
  auth: {
    user: {
      id: number;
    };
  };
}

export default function CheckCodePasswordScreen({ navigation }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.checkCodePassword;
  const user = useSelector((state: RootState) => state.auth.user);

  // Form
  const { handleSubmit, control } = useForm<FormData>({
    mode: 'onTouched',
    defaultValues: {
      recoveryCode: ''
    }
  });

  // Estados
  const [loading, setLoading] = useState<boolean>(false);

  // Submit
  const onSubmit = async (formData: FormData): Promise<void> => {
    try {
      const params: CheckRecoverycodeParams = {
        recoveryCode: Number(formData.recoveryCode)
      };

      setLoading(true);
      const { data } = await checkRecoverycode(user.id, params);
      setLoading(false);

      if (data.checkCode) {
        navigation.navigate('resetPassword');
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
          <View style={[styles.messageContainer, { backgroundColor: colors.INFO + '15' }]}>
            <Text style={[styles.messageText, { color: colors.TEXT_PRIMARY }]}>
              Ingresa el código de 4 dígitos que enviamos a tu correo electrónico
            </Text>
          </View>

          {/* Input de código */}
          <MyInput
            name="recoveryCode"
            type="number"
            control={control}
            label="Código de verificación"
            placeholder="Ej: 1234"
            rules={{
              required: 'El código es obligatorio',
              minLength: {
                value: 4,
                message: 'El código debe tener 4 dígitos'
              },
              maxLength: {
                value: 6,
                message: 'El código no puede tener más de 6 dígitos'
              }
            }}
            leftIcon="shield-key"
            autoFocus
            maxLength={6}
          />

          {/* Botón de submit */}
          {loading ? (
            <MyLoading />
          ) : (
            <MyButton title="Verificar código" onPress={handleSubmit(onSubmit)} variant="primary" />
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
  }
});
