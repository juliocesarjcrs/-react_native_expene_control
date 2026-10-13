import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ListRenderItem } from 'react-native';
import { useForm } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';
import { RadioButton } from 'react-native-paper';

// Services
import { getUsersList, createUser } from '~/services/users';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyInput from '~/components/inputs/MyInput';
import { UserListItem } from './components/UserListItem';

// Types
import { SettingsStackParamList, UserModel } from '~/shared/types';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';

// Constants
import { EMAIL_REGEX } from '~/constants/regex';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export type CreateUserScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'createUser'
>;

interface CreateUserScreenProps {
  navigation: CreateUserScreenNavigationProp;
}

interface CreateUserFormData {
  email: string;
  name: string;
  password: string;
}

const ROLE_NORMAL = 0;
const ROLE_ADMIN = 1;

type UserRole = typeof ROLE_NORMAL | typeof ROLE_ADMIN;

const fetchUsers = async (): Promise<UserModel[]> => {
  const { data } = await getUsersList();
  return data;
};

const keyExtractor = (item: UserModel): string => item.id.toString();

export default function CreateUserScreen({ navigation }: CreateUserScreenProps) {
  const screenConfig = screenConfigs.createUser;
  const colors = useThemeColors();

  const { handleSubmit, control, reset } = useForm<CreateUserFormData>({
    mode: 'onTouched',
    defaultValues: { email: '', name: '', password: '' }
  });

  const [listUsers, setListUsers] = useState<UserModel[]>([]);
  const [role, setRole] = useState<UserRole>(ROLE_NORMAL);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async (): Promise<void> => {
      try {
        const users = await fetchUsers();
        if (isMounted) setListUsers(users);
      } catch (error) {
        if (isMounted) showError(error);
      }
    };

    // 'focus' también se dispara en el primer enfoque de la pantalla.
    const unsubscribe = navigation.addListener('focus', loadUsers);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation]);

  const onSubmit = async (payload: CreateUserFormData): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('email', payload.email);
      formData.append('name', payload.name);
      formData.append('password', payload.password);
      formData.append('role', role.toString());

      await createUser(formData as unknown as Parameters<typeof createUser>[0]);
      ShowToast('Usuario creado exitosamente');
      reset();
      setRole(ROLE_NORMAL);
      setListUsers(await fetchUsers());
    } catch (error) {
      showError(error);
    }
  };

  const handleRoleChange = (newValue: string): void => {
    setRole(Number(newValue) as UserRole);
  };

  const renderItem: ListRenderItem<UserModel> = ({ item }) => (
    <UserListItem user={item} colors={colors} />
  );

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <FlatList
        data={listUsers}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.formContainer}>
            {/* Input de Email */}
            <MyInput
              name="email"
              control={control}
              label="Email"
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

            {/* Input de Nombre */}
            <MyInput
              name="name"
              control={control}
              label="Nombre"
              placeholder="Nombre completo"
              rules={{
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres'
                }
              }}
              leftIcon="account"
            />

            {/* Input de Contraseña */}
            <MyInput
              name="password"
              type="password"
              control={control}
              label="Contraseña"
              placeholder="••••••••"
              rules={{
                required: 'La contraseña es obligatoria',
                minLength: {
                  value: 3,
                  message: 'La contraseña debe tener al menos 3 caracteres'
                }
              }}
              leftIcon="lock"
            />

            {/* Radio buttons para rol */}
            <View style={styles.roleSection}>
              <Text style={[styles.roleLabel, { color: colors.TEXT_PRIMARY }]}>
                Rol del usuario:
              </Text>
              <RadioButton.Group onValueChange={handleRoleChange} value={role.toString()}>
                <View style={styles.radioContainer}>
                  <View style={styles.radioOption}>
                    <RadioButton.Android
                      value={ROLE_NORMAL.toString()}
                      color={colors.PRIMARY}
                      uncheckedColor={colors.TEXT_SECONDARY}
                    />
                    <Text style={[styles.radioText, { color: colors.TEXT_PRIMARY }]}>Normal</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton.Android
                      value={ROLE_ADMIN.toString()}
                      color={colors.INFO}
                      uncheckedColor={colors.TEXT_SECONDARY}
                    />
                    <Text style={[styles.radioText, { color: colors.TEXT_PRIMARY }]}>Admin</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            {/* Botón de crear */}
            <MyButton title="Crear usuario" onPress={handleSubmit(onSubmit)} variant="primary" />

            {/* Título de lista */}
            <Text style={[styles.listTitle, { color: colors.TEXT_PRIMARY }]}>
              Usuarios existentes ({listUsers.length}):
            </Text>
          </View>
        }
        renderItem={renderItem}
      />
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
  roleSection: {
    marginVertical: 8,
    marginBottom: 16
  },
  roleLabel: {
    fontSize: SMALL + 2,
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
    alignItems: 'center',
    gap: 4
  },
  radioText: {
    fontSize: SMALL + 1
  },
  listTitle: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12
  }
});
