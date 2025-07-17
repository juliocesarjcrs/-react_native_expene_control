import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { OcrAccuracy, Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import MultiExpenseModal from './modal/MultiExpenseModal';
import { callOCRSpaceAPI, mockOCRSpaceAPI } from '~/services/ocrService';
import { CreateMultipleExpense } from '~/services/expenses';
import { CreateExpensePayload } from '~/shared/types/services/expense-service.type';
import { buildCsvData, generateCsvLine } from '~/utils/csvUtils';
import { extractProducts } from '~/utils/parsers';

const fileName = 'extractions_v3.csv';
const RECEIPT_TYPES: ReceiptType[] = ['D1', 'Carulla', 'Exito', 'DollarCity', 'Otros'];

interface ReceiptScannerProps {
  onExtractedData?: (data: { price: string; category?: string; subcategory?: string; rawText: string }) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<number>(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editableProducts, setEditableProducts] = useState<Product[]>([]);
  const [pendingRawText, setPendingRawText] = useState<string>('');
  const [ocrAccuracy, setOcrAccuracy] = useState<OcrAccuracy | ''>('');
  const [receiptType, setReceiptType] = useState<ReceiptType | ''>('');
  const [customReceiptType, setCustomReceiptType] = useState<string>('');
  // Llama al cargar el componente
  useEffect(() => {
    updateCsvRowCount();
  }, []);
  // Función para contar filas del CSV
  const updateCsvRowCount = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + fileName;
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

  const pickImage = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1, // Máxima calidad inicial
      base64: true // Obtener directamente en base64
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const { uri } = result.assets[0]; // Usar uri en lugar de base64
      setImageUri(uri);
      const { base64 } = result.assets[0];

      if (base64) {
        // Verificar tamaño antes de enviar
        const sizeInBytes = (base64.length * 3) / 4; // Aproximación del tamaño
        if (sizeInBytes <= 1000000) {
          // 1MB
          console.log('Procesando imagen en base64 directamente');
          processImage(base64);
        } else {
          // Redimensionar solo si es necesario
          const manipResult = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: OCR_IMAGE_MAX_WIDTH } }], // Solo ancho, mantener proporción
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          if (manipResult.base64) {
            const newSize = (manipResult.base64.length * 3) / 4;
            console.log(`Tamaño reducido de ${sizeInBytes} bytes a ${newSize} bytes`);
            processImage(manipResult.base64);
          } else {
            setError('No se pudo procesar la imagen.');
          }
        }
      } else {
        setError('No se pudo obtener la imagen en base64.');
      }
    }
  };

  const processImage = async (base64: string, mock: boolean = false) => {
    setLoading(true);
    setText('');
    setError('');

    try {
      if (mock) {
        // Modo mock - Datos de prueba
        const data = await mockOCRSpaceAPI();

        const rawText = data.ParsedResults[0].ParsedText;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simula delay de red
        setText(rawText);
        const productos = extractProducts(rawText);
        setEditableProducts(productos);
        setPendingRawText(rawText);
        setEditModalVisible(true);
        return;
      }

      const data = await callOCRSpaceAPI({
        base64Image: base64
      });
      if (data?.ParsedResults?.[0]) {
        const rawText = data.ParsedResults[0].ParsedText;
        setText(rawText);
        const productos = extractProducts(rawText);
        setEditableProducts(productos);
        setPendingRawText(rawText);
        setEditModalVisible(true);
      } else {
        console.log('Respuesta completa de OCR.space:', data);
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

  const handleSaveExpenses = async (expenses: CreateExpensePayload[]) => {
    try {
      const formattedExpenses = expenses.map((expense) => ({
        description: expense.commentary || '',
        price: expense.cost
      }));
      await CreateMultipleExpense(expenses);
      setEditModalVisible(false);
      setEditableProducts(formattedExpenses);
      Alert.alert('Éxito', 'Gastos guardados correctamente');
    } catch (error) {
      console.error('Error al guardar gastos:', error, { expenses });
      Alert.alert('Error', 'No se pudieron guardar los gastos');
    }
  };

  const saveToCSV = async () => {
    console.log('Guardando datos para entrenamiento...');
    if (!ocrAccuracy || !receiptType || editableProducts.length === 0) {
      Alert.alert('Datos incompletos', 'Complete todos los campos requeridos');
      return;
    }

    try {
      const csvData = buildCsvData({
        pendingRawText,
        ocrAccuracy,
        receiptType,
        customReceiptType,
        editableProducts
      });

      const fileUri = FileSystem.documentDirectory + fileName;
      const csvLine = generateCsvLine(csvData);
      console.log('::: CSV Line:', csvLine);

      // Encabezados que coinciden con CsvData
      const headers = [
        'raw_text',
        'extracted_data',
        'ocr_quality',
        'receipt_type',
        'evaluation_date',
        'evaluator_id',
        'model_version'
      ].join(',');

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const content = fileInfo.exists
        ? (await FileSystem.readAsStringAsync(fileUri)) + csvLine
        : headers + '\n' + csvLine;

      await FileSystem.writeAsStringAsync(fileUri, content);
      updateCsvRowCount();

      Alert.alert(
        'Dataset actualizado',
        `Datos guardados para entrenamiento:\n\n` +
          `- Precisión: ${csvData.ocr_quality}/4\n` +
          `- Tipo: ${csvData.receipt_type}\n` +
          `- Productos: ${JSON.parse(csvData.extracted_data).length} items\n` +
          `¿Qué deseas hacer ahora?`,
        [
          {
            text: 'Nuevo escaneo',
            onPress: () => {
              resetForm();
            }
          },
          {
            text: 'Ver datos',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      handleSaveError(
        error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error))
      );
    }
  };
  const resetForm = (): void => {
    setPendingRawText('');
    setOcrAccuracy('');
    setReceiptType('');
    setCustomReceiptType('');
    setText('');
    setImageUri(null);
    setEditableProducts([]);
  };

  const handleSaveError = (error: Error) => {
    console.error('Save error:', error);
    Alert.alert('Error al guardar', `Detalles: ${error.message}`, [{ text: 'Entendido' }]);
  };

  // Función para compartir el archivo CSV
  const shareCSV = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + fileName;
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.innerContainer}>
        <Button title="Seleccionar imagen de factura" onPress={pickImage} />
        <Button title="Compartir CSV" onPress={shareCSV} />
        <Text style={styles.csvCounter}>Registros en CSV: {csvRows}</Text>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />}

        {loading && <ActivityIndicator size="large" color="#0000ff" />}

        {error && <Text style={styles.error}>{error}</Text>}

        {text ? (
          <>
            <View style={styles.resultBox}>
              <Text style={styles.label}>Texto extraído:</Text>
              <Text style={styles.text}>{text}</Text>
            </View>

            <View style={styles.evaluationSection}>
              <View style={styles.accuracyButtons}>
                <Text style={styles.sectionTitle}>Precisión del OCR (0-4):</Text>
                <View style={styles.buttonRow}>
                  {[0, 1, 2, 3, 4].map((score) => (
                    <TouchableOpacity
                      key={score}
                      style={[styles.accuracyButton, ocrAccuracy === String(score) && styles.selectedAccuracy]}
                      onPress={() => setOcrAccuracy(String(score) as OcrAccuracy)}
                    >
                      <Text>{score}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.accuracyLegend}>0=Falló | 1=Malo | 2=Regular | 3=Bueno | 4=Excelente</Text>
              </View>

              <Text style={styles.sectionTitle}>Tipo de Factura</Text>
              <View style={styles.receiptTypeContainer}>
                {RECEIPT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.receiptTypeButton, receiptType === type && styles.selectedReceiptType]}
                    onPress={() => setReceiptType(type)}
                  >
                    <Text>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {receiptType === 'Otros' && (
                <TextInput
                  style={styles.input}
                  placeholder="Especificar tipo de factura"
                  value={customReceiptType}
                  onChangeText={setCustomReceiptType}
                />
              )}
            </View>

            <View style={styles.actionButtons}>
              <Button
                title={`Guardar para entrenamiento (${editableProducts.length} productos)`}
                onPress={saveToCSV}
                disabled={!ocrAccuracy || !receiptType || !pendingRawText || editableProducts.length === 0}
              />
            </View>

            <Text style={styles.csvCounter}>Registros en CSV: {csvRows}</Text>
          </>
        ) : null}

        <MultiExpenseModal
          imageUri={imageUri}
          visible={editModalVisible}
          initialExpenses={editableProducts.map((exp) => ({
            description: exp.description,
            cost: exp.price,
            categoryId: null,
            subcategoryId: null
          }))}
          onClose={() => setEditModalVisible(false)}
          onSave={handleSaveExpenses}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center'
  },
  image: {
    width: '90%',
    height: 250,
    marginVertical: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5'
  },
  error: {
    color: 'red',
    marginVertical: 8,
    textAlign: 'center'
  },
  resultBox: {
    width: '90%',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8
  },
  text: {
    fontSize: 14,
    lineHeight: 20
  },
  csvCounter: {
    marginVertical: 12,
    fontWeight: '600',
    color: '#495057'
  },
  evaluationSection: {
    width: '90%',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  receiptTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  receiptTypeButton: {
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    minWidth: '30%',
    alignItems: 'center'
  },
  selectedReceiptType: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginTop: 10
  },
  actionButtons: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20
  },
  accuracyButtons: {
    marginVertical: 15,
    width: '100%'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  accuracyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedAccuracy: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  accuracyLegend: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center'
  }
});

export default ReceiptScanner;
