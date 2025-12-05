import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ListRenderItem } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { RadioButton } from 'react-native-paper';
import { getUsersList, createUser } from '~/services/users';
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import { MEDIUM, SMALL } from '~/styles/fonts';
import { SettingsStackParamList, UserModel } from '~/shared/types';
import { EMAIL_REGEX } from '~/constants/regex';
import { UserListItem } from './components/UserListItem';
// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export type CreateUserScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'createUser'
>;

interface CreateUserScreenProps {
  navigation: CreateUserScreenNavigationProp;
}

type CreateUserFormData = {
  email: string;
  name: string;
  password: string;
};

type UserRole = 0 | 1; // 0 = Normal, 1 = Admin

export default function CreateUserScreen({ navigation }: CreateUserScreenProps) {
  const screenConfig = screenConfigs.createUser;
  const colors = useThemeColors();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<CreateUserFormData>({
    defaultValues: { email: '', name: '', password: '' }
  });

  const [image, setImage] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [listUsers, setListUsers] = useState<UserModel[]>([]);
  const [role, setRole] = useState<UserRole>(0);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async (): Promise<void> => {
    try {
      const { data } = await getUsersList();
      setListUsers(data);
    } catch (error) {
      showError(error);
    }
  };

  const onSubmit = async (payload: CreateUserFormData): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('email', payload.email);
      formData.append('name', payload.name);
      formData.append('password', payload.password);
      formData.append('role', role.toString());

      if (image && type && fileName) {
        formData.append('image', {
          type: type,
          uri: image,
          name: fileName
        } as any);
      }

      await createUser(formData as any);
      ShowToast('Usuario creado exitosamente');
      reset();
      setRole(0);
      fetchData();
    } catch (error) {
      showError(error);
    }
  };

  const handleRoleChange = (newValue: string): void => {
    setRole(parseInt(newValue) as UserRole);
  };

  const renderItem: ListRenderItem<UserModel> = ({ item }) => (
    <UserListItem user={item} colors={colors} />
  );

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={listUsers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <View style={styles.formContainer}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: { value: true, message: 'El email es obligatorio' },
                  pattern: {
                    value: EMAIL_REGEX,
                    message: 'El email no es válido'
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    placeholder="Email"
                    placeholderTextColor={colors.TEXT_SECONDARY}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    errorStyle={{ color: colors.ERROR }}
                    errorMessage={errors?.email?.message}
                    inputStyle={{ color: colors.TEXT_PRIMARY }}
                    containerStyle={styles.inputContainer}
                  />
                )}
              />

              <Controller
                name="name"
                control={control}
                rules={{
                  required: { value: true, message: 'El nombre es obligatorio' },
                  minLength: {
                    value: 2,
                    message: 'El nombre debe tener al menos 2 caracteres'
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    placeholder="Nombre"
                    placeholderTextColor={colors.TEXT_SECONDARY}
                    onChangeText={onChange}
                    errorStyle={{ color: colors.ERROR }}
                    errorMessage={errors?.name?.message}
                    inputStyle={{ color: colors.TEXT_PRIMARY }}
                    containerStyle={styles.inputContainer}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: 'La contraseña es obligatoria'
                  },
                  minLength: {
                    value: 3,
                    message: 'La contraseña debe tener al menos 3 caracteres'
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    placeholder="Contraseña"
                    placeholderTextColor={colors.TEXT_SECONDARY}
                    onChangeText={onChange}
                    secureTextEntry={true}
                    errorStyle={{ color: colors.ERROR }}
                    errorMessage={errors?.password?.message}
                    inputStyle={{ color: colors.TEXT_PRIMARY }}
                    containerStyle={styles.inputContainer}
                  />
                )}
              />

              <View style={styles.roleSection}>
                <Text style={[styles.roleLabel, { color: colors.TEXT_PRIMARY }]}>
                  Rol del usuario:
                </Text>
                <RadioButton.Group onValueChange={handleRoleChange} value={role.toString()}>
                  <View style={styles.radioContainer}>
                    <View style={styles.radioOption}>
                      <RadioButton.Android
                        value="0"
                        color={colors.PRIMARY}
                        uncheckedColor={colors.TEXT_SECONDARY}
                      />
                      <Text style={{ color: colors.TEXT_PRIMARY, fontSize: SMALL, marginLeft: 4 }}>
                        Normal
                      </Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton.Android
                        value="1"
                        color={colors.PRIMARY}
                        uncheckedColor={colors.TEXT_SECONDARY}
                      />
                      <Text style={{ color: colors.TEXT_PRIMARY, fontSize: SMALL, marginLeft: 4 }}>
                        Admin
                      </Text>
                    </View>
                  </View>
                </RadioButton.Group>
              </View>

              <MyButton title="Crear usuario" onPress={handleSubmit(onSubmit)} />

              <Text style={[styles.listTitle, { color: colors.TEXT_PRIMARY }]}>
                Usuarios existentes ({listUsers.length}):
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  inputContainer: {
    marginBottom: -10
  },
  roleSection: {
    marginVertical: 8,
    marginBottom: 16
  },
  roleLabel: {
    fontSize: SMALL,
    fontWeight: '600',
    marginBottom: 8
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  listTitle: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12
  }
});
