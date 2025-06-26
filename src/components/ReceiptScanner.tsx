import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';

interface ReceiptScannerProps {
  onExtractedData?: (data: { price: string; category?: string; subcategory?: string; rawText: string }) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onExtractedData }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [csvRows, setCsvRows] = useState<number>(0);
  // Llama al cargar el componente
  useEffect(() => {
    updateCsvRowCount();
  }, []);
  // Función para contar filas del CSV
  const updateCsvRowCount = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + 'extractions.csv';
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
        // Cuenta las filas (omite la cabecera)
        const lines = content.trim().split('\n');
        setCsvRows(lines.length > 1 ? lines.length - 1 : 0);
      } else {
        setCsvRows(0);
      }
    } catch (e) {
      console.log('Error al contar filas del CSV:', e);
      setCsvRows(0);
    }
  };

  // Configuración de compresión para OCR
  const OCR_IMAGE_MAX_WIDTH = 1000; // px
  const OCR_IMAGE_MAX_HEIGHT = 1000; // px
  const OCR_IMAGE_QUALITY = 0.7; // 0 a 1

  const pickImage = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: OCR_IMAGE_QUALITY, // calidad inicial
      base64: false // primero obtenemos el uri
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const { uri } = result.assets[0];
      setImageUri(uri);
      // Comprimir/redimensionar imagen antes de convertir a base64
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: OCR_IMAGE_MAX_WIDTH, height: OCR_IMAGE_MAX_HEIGHT } }],
        { compress: OCR_IMAGE_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (manipResult.base64) {
        processImage(manipResult.base64);
      } else {
        setError('No se pudo obtener la imagen comprimida en base64.');
      }
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setText('');
    try {
      // Llama a la API gratuita de OCR.space
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpg;base64,${base64}`);
      formData.append('language', 'spa');
      formData.append('isTable', 'false');
      formData.append('OCREngine', '2');
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          apikey: 'helloworld' // clave pública gratuita de OCR.space
        },
        body: formData
      });
      const data = await response.json();
      if (data && data.ParsedResults && data.ParsedResults[0]) {
        const rawText = data.ParsedResults[0].ParsedText;
        // console.log('OCR resultado:', rawText); // Log para depuración
        setText(rawText);
        saveRawTextToCSV(rawText); // Guardar extracción en CSV
        const extracted = extractData(rawText);
        if (onExtractedData) onExtractedData({ ...extracted, rawText });
      } else {
        console.log('Respuesta completa de OCR.space:', data); // Log para depuración
        let apiError = '';
        if (data.IsErroredOnProcessing && data.ErrorMessage) {
          apiError = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(' ') : data.ErrorMessage;
        } else if (data.ErrorDetails) {
          apiError = data.ErrorDetails;
        }
        setError('No se pudo extraer texto de la imagen.' + (apiError ? `\nDetalle: ${apiError}` : ''));
      }
    } catch (e: unknown) {
      setError('Error al procesar la imagen: ' + (e instanceof Error ? e.message : JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  // Simple extraction logic for price and category
  const extractData = (rawText: string) => {
    // Busca el precio (número con decimales o coma)
    const priceMatch = rawText.match(/\b\d{1,5}[.,]\d{2}\b/g);
    // Busca palabras clave para categorías (puedes mejorar esto)
    const categories = ['supermercado', 'restaurante', 'transporte', 'farmacia', 'ropa', 'tecnología'];
    const foundCategory = categories.find((cat) => rawText.toLowerCase().includes(cat));
    return {
      price: priceMatch ? priceMatch[0].replace(',', '.') : '',
      category: foundCategory,
      subcategory: undefined
    };
  };

  // Guarda el texto extraído en un archivo CSV para entrenamiento futuro
  const saveRawTextToCSV = async (rawText: string) => {
    try {
      const fileUri = FileSystem.documentDirectory + 'extractions.csv';
      const line = `"${rawText.replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(fileUri, 'raw_text\n' + line, { encoding: FileSystem.EncodingType.UTF8 });
      } else {
        // Leer el contenido actual y agregar la nueva línea
        const prev = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
        await FileSystem.writeAsStringAsync(fileUri, prev + line, { encoding: FileSystem.EncodingType.UTF8 });
      }
      updateCsvRowCount();
    } catch (e) {
      console.log('Error guardando extracción en CSV:', e);
    }
  };

  // Función para compartir el archivo CSV
  const shareCSV = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + 'extractions.csv';
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await Sharing.shareAsync(fileUri);
      } else {
        setError('No hay archivo CSV para compartir.');
      }
    } catch (e) {
      setError('Error al intentar compartir el archivo: ' + (e instanceof Error ? e.message : JSON.stringify(e)));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.innerContainer}>
        <Button title="Seleccionar imagen de factura" onPress={pickImage} />
        <Button title="Compartir extracciones CSV" onPress={shareCSV} />
        <Text style={{ marginTop: 8, marginBottom: 8 }}>Filas en CSV: {csvRows}</Text>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
        {error && <Text style={styles.error}>{error}</Text>}
        {text ? (
          <View style={styles.resultBox}>
            <Text style={styles.label}>Texto extraído:</Text>
            <Text style={styles.text}>{text}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16, backgroundColor: '#fff' },
  innerContainer: { flex: 1 },
  image: { width: 250, height: 250, marginVertical: 16, alignSelf: 'center' },
  error: { color: 'red', marginTop: 8 },
  resultBox: { marginTop: 16, backgroundColor: '#f2f2f2', borderRadius: 8, padding: 8 },
  label: { fontWeight: 'bold' },
  text: { marginTop: 8 }
});

export default ReceiptScanner;
