import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, Platform, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { setUser } from '~/features/auth/authSlice';

// Services
import { editUser, getUser } from '~/services/users';
import { getUrlSignedAws } from '~/services/files';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';
import MyInput from '~/components/inputs/MyInput';

// Types
import { SettingsStackParamList, UserModel } from '~/shared/types';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';
import { EMAIL_REGEX } from '~/constants/regex';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export type EditUserScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'editUser'>;

interface EditUserScreenProps {
  navigation: EditUserScreenNavigationProp;
}

type EditUserFormData = {
  email: string;
  name: string;
};

type PickedImage = {
  uri: string;
  type: string;
  name: string;
};

const requestPermissions = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a tu galería de fotos');
  }
};

// Infiere el tipo MIME a partir de la extensión (jpg -> jpeg)
const inferImageType = (fileName: string): string => {
  const match = /\.(\w+)$/.exec(fileName);
  if (!match) return 'image/jpeg';
  const extension = match[1].toLowerCase();
  return `image/${extension === 'jpg' ? 'jpeg' : extension}`;
};

export default function EditUserScreen({ navigation }: EditUserScreenProps) {
  const screenConfig = screenConfigs.editUser;
  const colors = useThemeColors();
  const dispatch = useDispatch();

  const { handleSubmit, control, setValue } = useForm<EditUserFormData>({
    defaultValues: { email: '', name: '' }
  });

  const [idUser, setIdUser] = useState<number | null>(null);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [remoteImage, setRemoteImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const previewUri = pickedImage?.uri ?? remoteImage;

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async (): Promise<void> => {
      try {
        const jsonValue = await AsyncStorage.getItem('user');
        const storedUser: UserModel | null = jsonValue ? JSON.parse(jsonValue) : null;

        if (!storedUser) {
          showError(new Error('No se encontró el usuario'));
          return;
        }

        const { data } = await getUser(storedUser.id);
        if (!isMounted) return;

        setValue('email', data.email);
        setValue('name', data.name);
        setIdUser(data.id);

        if (data.image) {
          const { data: signedUrl } = await getUrlSignedAws({ file: data.image });
          if (isMounted) setRemoteImage(signedUrl);
        }
      } catch (error) {
        if (isMounted) showError(error);
      }
    };

    // 'focus' también se dispara en el primer enfoque de la pantalla.
    const unsubscribe = navigation.addListener('focus', loadUser);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation, setValue]);

  const onSubmit = async (payload: EditUserFormData): Promise<void> => {
    if (!idUser) {
      showError(new Error('ID de usuario no encontrado'));
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('email', payload.email);
      formData.append('name', payload.name);

      if (pickedImage) {
        // React Native acepta este objeto como archivo en FormData
        formData.append('image', {
          type: pickedImage.type,
          uri: pickedImage.uri,
          name: pickedImage.name
        } as unknown as Blob);
      }

      const { data } = await editUser(
        idUser,
        formData as unknown as Parameters<typeof editUser>[1]
      );

      dispatch(setUser(data));
      ShowToast('Perfil actualizado exitosamente');
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1
      });

      if (result.canceled) return;

      const [asset] = result.assets;
      if (!asset) return;

      const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'image.jpg';

      setPickedImage({
        uri: asset.uri,
        name,
        type: asset.mimeType ?? inferImageType(name)
      });
    } catch (error) {
      showError(error);
    }
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
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

        {loading ? (
          <MyLoading />
        ) : (
          <MyButton title="Guardar cambios" onPress={handleSubmit(onSubmit)} />
        )}

        <View style={styles.imageSection}>
          <Text style={[styles.imageLabel, { color: colors.TEXT_PRIMARY }]}>Foto de perfil</Text>

          <MyButton title="Seleccionar imagen" onPress={pickImage} />

          {previewUri && (
            <View style={[styles.imageContainer, { borderColor: colors.BORDER }]}>
              <Image source={{ uri: previewUri }} style={styles.image} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageSection: {
    marginTop: 24,
    alignItems: 'center'
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  imageContainer: {
    marginTop: 16,
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden'
  },
  image: {
    width: 200,
    height: 200
  }
});
