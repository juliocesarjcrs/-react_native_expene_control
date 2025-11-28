import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, SafeAreaView, ListRenderItem } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Input } from "react-native-elements";
import { StackNavigationProp } from "@react-navigation/stack";
import { RadioButton } from "react-native-paper";
import { getUsersList, createUser } from "~/services/users";
import { showError } from "~/utils/showError";
import { ShowToast } from "~/utils/toastUtils";
import { ScreenHeader } from "~/components/ScreenHeader";
import MyButton from "~/components/MyButton";
import { MEDIUM } from "~/styles/fonts";
import { SettingsStackParamList, UserModel } from "~/shared/types";
import { EMAIL_REGEX } from "~/constants/regex";
// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';


export type CreateUserScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  "createUser"
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
    formState: { errors },
  } = useForm<CreateUserFormData>({
    defaultValues: { email: "", name: "", password: "" },
  });

  const [image, setImage] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [listUsers, setListUsers] = useState<UserModel[]>([]);
  const [role, setRole] = useState<UserRole>(0);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
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
      formData.append("email", payload.email);
      formData.append("name", payload.name);
      formData.append("password", payload.password);
      formData.append("role", role.toString());

      if (image && type && fileName) {
        formData.append("image", {
          type: type,
          uri: image,
          name: fileName,
        } as any);
      }

      await createUser(formData as any);
      ShowToast("Usuario creado exitosamente");
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
    <Item name={item.name} image={item.image} role={item.role} />
  );

  

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
        <Controller
          name="email"
          control={control}
          rules={{
            required: { value: true, message: "El email es obligatorio" },
            pattern: {
              value: EMAIL_REGEX,
              message: "El email no es válido",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              placeholder="Email"
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              errorStyle={{ color: colors.ERROR }}
              errorMessage={errors?.email?.message}
            />
          )}
        />

        <Controller
          name="name"
          control={control}
          rules={{
            required: { value: true, message: "El nombre es obligatorio" },
            minLength: {
              value: 2,
              message: "El nombre debe tener al menos 2 caracteres",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              placeholder="Nombre"
              onChangeText={onChange}
              errorStyle={{ color: colors.ERROR }}
              errorMessage={errors?.name?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          rules={{
            required: {
              value: true,
              message: "La contraseña es obligatoria",
            },
            minLength: {
              value: 3,
              message: "La contraseña debe tener al menos 3 caracteres",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              placeholder="Contraseña"
              onChangeText={onChange}
              secureTextEntry={true}
              errorStyle={{ color: colors.ERROR }}
              errorMessage={errors?.password?.message}
            />
          )}
        />

        <View style={styles.roleSection}>
          <Text style={[styles.roleLabel, { color: colors.TEXT_PRIMARY }]}>
            Rol del usuario:
          </Text>
          <RadioButton.Group onValueChange={handleRoleChange} value={role.toString()}>
            <View style={styles.radioOption}>
              <Text style={{ color: colors.TEXT_PRIMARY }}>Usuario Normal</Text>
              <RadioButton value="0" />
            </View>
            <View style={styles.radioOption}>
              <Text style={{ color: colors.TEXT_PRIMARY }}>Administrador</Text>
              <RadioButton value="1" />
            </View>
          </RadioButton.Group>
        </View>

        <MyButton title="Crear usuario" onPress={handleSubmit(onSubmit)} />

        <SafeAreaView style={styles.listContainer}>
          <Text style={[styles.listTitle, { color: colors.TEXT_PRIMARY }]}>
            Usuarios existentes:
          </Text>
          <FlatList
            data={listUsers}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  roleSection: {
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  roleLabel: {
    fontSize: MEDIUM,
    fontWeight: "bold",
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  listContainer: {
    flex: 1,
    marginTop: 20,
  },
  listTitle: {
    fontSize: MEDIUM,
    fontWeight: "bold",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  item: {
    backgroundColor: "#f9c2ff",
    padding: 8,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  itemName: {
    fontWeight: "bold",
    fontSize: MEDIUM,
  },
  itemImage: {
    fontSize: 12,
    color: "#666",
  },
  itemRole: {
    fontWeight: "bold",
    fontSize: 12,
  },
});

interface ItemProps {
  name: string;
  image: string | null;
  role: number;
}

const Item = ({ name, image, role }: ItemProps) => (
  <View style={styles.item}>
    <Text style={styles.itemName}>{name}</Text>
    {image && (
      <Text style={styles.itemImage}>{image.slice(0, 20)}...</Text>
    )}
    <Text style={styles.itemRole}>{role === 1 ? "Admin" : "Normal"}</Text>
  </View>
);