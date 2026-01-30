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

export default function EditUserScreen({ navigation }: EditUserScreenProps) {
  const colors = useThemeColors();
  const dispatch = useDispatch();

  const { handleSubmit, control, setValue } = useForm<EditUserFormData>({
    defaultValues: { email: '', name: '' }
  });

  const [idUser, setIdUser] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [saveImage, setSaveImage] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const requestPermissions = async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permisos para acceder a tu galería de fotos'
        );
      }
    }
  };

  const fetchData = async (): Promise<void> => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      const user: UserModel | null = jsonValue != null ? JSON.parse(jsonValue) : null;

      if (!user) {
        showError(new Error('No se encontró el usuario'));
        return;
      }

      const { data } = await getUser(user.id);
      setValue('email', data.email);
      setValue('name', data.name);

      if (data.image) {
        getUrlAws(data.image);
      }

      setIdUser(data.id);
    } catch (error) {
      showError(error);
    }
  };

  const getUrlAws = async (keyImg: string): Promise<void> => {
    try {
      if (keyImg) {
        setLoading(true);
        const query = { file: keyImg };
        const { data } = await getUrlSignedAws(query);
        setLoading(false);
        setSaveImage(data);
      }
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const onSubmit = async (payload: EditUserFormData): Promise<void> => {
    try {
      if (!idUser) {
        showError(new Error('ID de usuario no encontrado'));
        return;
      }

      const formData = new FormData();
      formData.append('email', payload.email);
      formData.append('name', payload.name);

      if (image && type && fileName) {
        formData.append('image', {
          type: type,
          uri: image,
          name: fileName
        } as any);
      }

      setLoading(true);
      const { data } = await editUser(idUser, formData as any);
      setLoading(false);

      dispatch(setUser(data));
      ShowToast('Perfil actualizado exitosamente');
    } catch (error) {
      setLoading(false);
      showError(error);
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);

        const localUri = selectedImage.uri;
        const nameImagen = localUri.split('/').pop() || 'image.jpg';

        // Inferir el tipo de imagen
        const match = /\.(\w+)$/.exec(nameImagen);
        const imageType = match ? `image/${match[1]}` : `image`;

        setType(imageType);
        setFileName(nameImagen);
      }
    } catch (error) {
      showError(error);
    }
  };

  const screenConfig = screenConfigs.editUser;

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

          {(image || saveImage) && (
            <View style={[styles.imageContainer, { borderColor: colors.BORDER }]}>
              <Image source={{ uri: image || saveImage || '' }} style={styles.image} />
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
