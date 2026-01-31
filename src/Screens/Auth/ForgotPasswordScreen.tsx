import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { forgotPassword } from '../../services/auth';

// Components
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '../../components/MyButton';
import MyInput from '~/components/inputs/MyInput';
import { ScreenHeader } from '~/components/ScreenHeader';

// Types
import { AuthStackParamList } from '../../shared/types';
import { ForgotPasswordPayload } from '../../shared/types/services';
import { AppDispatch } from '../../shared/types/reducers/root-state.type';

// Redux
import { setUser } from '../../features/auth/authSlice';

// Utils
import { showError } from '~/utils/showError';

// Constants
import { EMAIL_REGEX } from '~/constants/regex';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'forgotPassword'>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const colors = useThemeColors();
  const dispatch: AppDispatch = useDispatch();
  const screenConfig = screenConfigs.forgotPassword;

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<ForgotPasswordPayload>({
    mode: 'onTouched',
    defaultValues: { email: '' }
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (payload: ForgotPasswordPayload): Promise<void> => {
    try {
      setLoading(true);
      const { data } = await forgotPassword(payload);
      setLoading(false);
      dispatch(setUser(data.user));
      navigation.navigate('checkCodePassword');
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader
        title={screenConfig?.title || 'Restablecer contraseña'}
        subtitle={screenConfig?.subtitle}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Instrucciones */}
          <View style={[styles.instructionsCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <Text style={[styles.instructionsText, { color: colors.TEXT_PRIMARY }]}>
              Proporcione la dirección de correo electrónico de su cuenta para solicitar un código
              de restablecimiento de contraseña.
            </Text>
            <Text style={[styles.instructionsSubtext, { color: colors.TEXT_SECONDARY }]}>
              Recibirá un código a su dirección de correo electrónico si esta es válida.
            </Text>
          </View>

          {/* Input de Email */}
          <MyInput
            name="email"
            control={control}
            label="Correo electrónico"
            placeholder="ejemplo@correo.com"
            rules={{
              required: 'El email es obligatorio',
              pattern: {
                value: EMAIL_REGEX,
                message: 'El email no es válido'
              }
            }}
            leftIcon="email"
            autoFocus
          />

          {/* Botón de submit */}
          {loading ? (
            <MyLoading />
          ) : (
            <MyButton
              title="Solicitar código de reinicio"
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  instructionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  instructionsText: {
    fontSize: MEDIUM,
    lineHeight: 22,
    marginBottom: 8
  },
  instructionsSubtext: {
    fontSize: SMALL + 1,
    lineHeight: 20
  }
});
