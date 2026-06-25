import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyButton from '~/components/MyButton';
import { createLogger } from '~/utils/logger';

interface ImagePickerComponentProps {
  onImageSelected: (base64: string, uri: string) => void;
  onPdfSelected: (base64: string, uri: string) => void;
  onError: (error: string) => void;
  resetTrigger?: boolean;
}

const log = createLogger('component', 'ImagePickerComponent');

const OCR_IMAGE_MAX_WIDTH = 1000;
const MAX_SIZE_BYTES = 1_000_000;

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  onImageSelected,
  onPdfSelected,
  onError,
  resetTrigger
}) => {
  const colors = useThemeColors();
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [pdfName, setPdfName] = React.useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = React.useState(false);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const prevResetRef = React.useRef(resetTrigger);
  React.useEffect(() => {
    const prev = prevResetRef.current;
    prevResetRef.current = resetTrigger;
    if (!prev && resetTrigger) {
      setImageUri(null);
      setPdfName(null);
    }
  }, [resetTrigger]);

  // ── Imagen ─────────────────────────────────────────────────────────────────

  const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.length) return;

    const { uri, base64 } = result.assets[0];
    setImageUri(uri);
    setPdfName(null);

    if (!base64) {
      log.error('Image base64 not available after pick', { uri });
      onError('No se pudo obtener la imagen en base64.');
      return;
    }

    const sizeInBytes = (base64.length * 3) / 4;
    log.info('Image picked', { sizeInBytes, uri });

    if (sizeInBytes <= MAX_SIZE_BYTES) {
      onImageSelected(base64, uri);
      return;
    }

    // Image exceeds 1MB — compress before sending to OCR
    log.info('Image exceeds 1MB, compressing', { sizeInBytes });
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: OCR_IMAGE_MAX_WIDTH } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipResult.base64) {
        const compressedSize = (manipResult.base64.length * 3) / 4;
        log.info('Image compressed successfully', { compressedSize });
        onImageSelected(manipResult.base64, manipResult.uri);
      } else {
        log.error('Compression returned no base64', { uri });
        onError('No se pudo comprimir la imagen.');
      }
    } catch (e: any) {
      log.error('Image compression failed', { error: e?.message, uri });
      onError('No se pudo procesar la imagen.');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      base64: true
    });
    await processImageResult(result);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      log.warn('Camera permission denied');
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

  // ── PDF ────────────────────────────────────────────────────────────────────

  const pickPdf = async () => {
    let cachedUri: string | null = null;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        // copyToCacheDirectory no garantiza permisos de lectura en Android
        // con New Architecture — copiamos manualmente abajo
        copyToCacheDirectory: false
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const fileName = asset.name ?? 'receipt.pdf';

      setLoadingPdf(true);
      setImageUri(null);
      setPdfName(fileName);

      log.info('PDF picked, copying to cache', { fileName, originalUri: asset.uri });

      // Copiar manualmente al directorio de caché donde tenemos permisos garantizados
      // Paths.cache es siempre accesible por la app sin permisos externos
      const destination = new ExpoFile(Paths.cache, `ocr_pdf_${Date.now()}.pdf`);
      const source = new ExpoFile(asset.uri);
      await source.copy(destination);

      cachedUri = destination.uri;
      log.info('PDF copied to cache', { cachedUri });

      // Leer desde la copia en caché — aquí sí tenemos READ
      const base64 = await destination.base64();
      log.info('PDF read as base64 successfully', {
        fileName,
        base64Length: base64.length
      });

      onPdfSelected(base64, cachedUri);
    } catch (e: any) {
      log.error('PDF selection or read failed', {
        error: e?.message,
        cachedUri
      });
      onError('Error al seleccionar PDF: ' + (e?.message ?? 'Error desconocido'));
      setPdfName(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Row 1: image buttons */}
      <View style={styles.buttonGroup}>
        <MyButton title="Tomar Foto" onPress={takePhoto} />
        <MyButton title="Seleccionar Imagen" onPress={pickImage} />
      </View>

      {/* Row 2: PDF button */}
      <MyButton
        title={loadingPdf ? 'Leyendo PDF…' : '📄 Seleccionar PDF'}
        variant="outline"
        fullWidth
        onPress={pickPdf}
        loading={loadingPdf}
        disabled={loadingPdf}
      />

      {/* Image preview */}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { backgroundColor: colors.CARD_BACKGROUND }]}
          resizeMode="contain"
        />
      )}

      {/* PDF confirmation */}
      {pdfName && !loadingPdf && (
        <Text style={[styles.pdfLabel, { color: colors.SUCCESS ?? '#28a745' }]}>✓ {pdfName}</Text>
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
    marginBottom: 4
  },
  image: {
    width: '90%',
    height: 250,
    borderRadius: 10,
    marginTop: 8
  },
  pdfLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center'
  }
});

export default ImagePickerComponent;
