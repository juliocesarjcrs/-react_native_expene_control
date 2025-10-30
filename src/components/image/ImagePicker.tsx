import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors } from '~/styles';

interface ImagePickerComponentProps {
  onImageSelected: (base64: string, uri: string) => void;
  onError: (error: string) => void;
  resetTrigger?: boolean;
}

const OCR_IMAGE_MAX_WIDTH = 1000;

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({ onImageSelected, onError, resetTrigger }) => {
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
      allowsEditing: false,
      aspect: undefined,
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
      allowsEditing: false,
      aspect: undefined,
      quality: 1,
      base64: true
    });
    await processImageResult(result);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
          <Text style={styles.buttonText}>Tomar Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
          <Text style={styles.buttonText}>Seleccionar Imagen</Text>
        </TouchableOpacity>
      </View>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />}
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
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10
  },
  actionButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  image: {
    width: '90%',
    height: 250,
    borderRadius: 8,
    backgroundColor: '#f5f5f5'
  }
});

export default ImagePickerComponent;
