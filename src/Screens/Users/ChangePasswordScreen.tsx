import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changePassword } from '~/services/users';
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';
import { screenConfigs } from '~/config/screenConfigs';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import { SettingsStackParamList, UserModel } from '~/shared/types';
import { ChangePasswordPayload } from '~/shared/types/services';

export type ChangePasswordScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'changePassword'
>;

interface ChangePasswordScreenProps {
  navigation: ChangePasswordScreenNavigationProp;
}

type ChangePasswordFormData = ChangePasswordPayload;

export default function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const colors = useThemeColors();

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = useForm<ChangePasswordFormData>({
    defaultValues: {
      currentlyPassword: '',
      password: '',
      passwordComfirm: ''
    }
  });

  const password = useRef<string>('');
  password.current = watch('password', '');

  const onSubmit = async (payload: ChangePasswordFormData): Promise<void> => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      const user: UserModel | null = jsonValue != null ? JSON.parse(jsonValue) : null;

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

  const screenConfig = screenConfigs.changePassword;

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
        <Controller
          name="currentlyPassword"
          control={control}
          rules={{
            required: {
              value: true,
              message: 'La contraseña actual es obligatoria'
            },
            minLength: {
              value: 3,
              message: 'La contraseña debe tener al menos 3 caracteres'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              placeholder="Contraseña actual"
              onChangeText={onChange}
              secureTextEntry={true}
              errorStyle={{ color: colors.ERROR }}
              errorMessage={errors?.currentlyPassword?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          rules={{
            required: {
              value: true,
              message: 'La nueva contraseña es obligatoria'
            },
            minLength: {
              value: 3,
              message: 'La contraseña debe tener al menos 3 caracteres'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              placeholder="Nueva contraseña"
              onChangeText={onChange}
              secureTextEntry={true}
              errorStyle={{ color: colors.ERROR }}
              errorMessage={errors?.password?.message}
            />
          )}
        />

        <Controller
          name="passwordComfirm"
          control={control}
          rules={{
            required: {
              value: true,
              message: 'Debe confirmar la contraseña'
            },
            minLength: {
              value: 3,
              message: 'La contraseña debe tener al menos 3 caracteres'
            },
            validate: (value) => value === password.current || 'Las contraseñas no coinciden'
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              placeholder="Confirmar nueva contraseña"
              onChangeText={onChange}
              secureTextEntry={true}
              errorStyle={{ color: colors.ERROR }}
              errorMessage={errors?.passwordComfirm?.message}
            />
          )}
        />

        <MyButton title="Cambiar contraseña" onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  );
}
