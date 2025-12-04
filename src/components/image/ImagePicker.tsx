import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyButton from '~/components/MyButton';

interface ImagePickerComponentProps {
  onImageSelected: (base64: string, uri: string) => void;
  onError: (error: string) => void; // <- Mantengo onError como solicitaste
  resetTrigger?: boolean;
}

const OCR_IMAGE_MAX_WIDTH = 1000;

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  onImageSelected,
  onError,
  resetTrigger
}) => {
  const colors = useThemeColors();
  const [imageUri, setImageUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (resetTrigger) {
      setImageUri(null);
    }
  }, [resetTrigger]);

  const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const { uri, base64 } = result.assets[0];
      setImageUri(uri);

      if (base64) {
        const sizeInBytes = (base64.length * 3) / 4;

        if (sizeInBytes <= 1000000) {
          onImageSelected(base64, uri);
        } else {
          try {
            const manipResult = await ImageManipulator.manipulateAsync(
              uri,
              [{ resize: { width: OCR_IMAGE_MAX_WIDTH } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            if (manipResult.base64) {
              onImageSelected(manipResult.base64, manipResult.uri);
            }
          } catch (error) {
            console.error('Save error:', error);
            onError('No se pudo procesar la imagen.');
          }
        }
      } else {
        onError('No se pudo obtener la imagen en base64.');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      base64: true,
      // presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
    });
    await processImageResult(result);
  };

  const takePhoto = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      onError('Se requieren permisos de cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      base64: true
    });

    await processImageResult(result);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.buttonGroup}>
        <MyButton title="Tomar Foto" onPress={takePhoto} />
        <MyButton title="Seleccionar Imagen" onPress={pickImage} />
      </View>

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { backgroundColor: colors.CARD_BACKGROUND }]}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginBottom: 12
  },
  image: {
    width: '90%',
    height: 250,
    borderRadius: 10
  }
});

export default ImagePickerComponent;
