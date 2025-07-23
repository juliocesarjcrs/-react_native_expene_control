import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,

} from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
// import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { OcrAccuracy, Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import MultiExpenseModal from '../modal/MultiExpenseModal';
import { callOCRSpaceAPI, mockOCRSpaceAPI } from '~/services/ocrService';
import { CreateMultipleExpense } from '~/services/expenses';
import { CreateExpensePayload } from '~/shared/types/services/expense-service.type';
import { buildCsvData, generateCsvLine } from '~/utils/csvUtils';
import { extractProducts } from '~/utils/parsers';
import ImagePickerComponent from '../image/ImagePicker';
import OcrEvaluationSection from './OcrEvaluationSection';

const fileName = 'extractions_v3.csv';

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


   const processImage = async (base64: string, mock: boolean = false) => {
    setLoading(true);
    setText('');
    setError('');

    try {
      const data = mock ? await mockOCRSpaceAPI() : await callOCRSpaceAPI({ base64Image: base64 });
      
      if (data?.ParsedResults?.[0]) {
        const rawText = data.ParsedResults[0].ParsedText;
        setText(rawText);
        const productos = extractProducts(rawText);
        setEditableProducts(productos);
        setPendingRawText(rawText);
        setEditModalVisible(true);
      } else {
        handleOcrError(data);
      }
    } catch (e: unknown) {
      setError('Error al procesar la imagen: ' + (e instanceof Error ? e.message : JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleOcrError = (data: any) => {
    console.error('OCR Error:', data);
    let apiError = '';
    if (data.IsErroredOnProcessing && data.ErrorMessage) {
      apiError = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(' ') : data.ErrorMessage;
    } else if (data.ErrorDetails) {
      apiError = data.ErrorDetails;
    }
    setError('No se pudo extraer texto de la imagen.' + (apiError ? `\nDetalle: ${apiError}` : ''));
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
    setError(null);
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
        <ImagePickerComponent
          onImageSelected={(base64, uri) => {
            setImageUri(uri);
            processImage(base64);
          }}
          onError={setError}
          resetTrigger={!imageUri && !text}
        />

        <Button title="Compartir CSV" onPress={shareCSV} />
        <Text style={styles.csvCounter}>Registros en CSV: {csvRows}</Text>

        {loading && <ActivityIndicator size="large" color="#0000ff" />}
        {error && <Text style={styles.error}>{error}</Text>}

        {text && (
          <>
            <View style={styles.resultBox}>
              <Text style={styles.label}>Texto extraído ({editableProducts.length}):</Text>
              <Text style={styles.text}>{text}</Text>
            </View>

            <OcrEvaluationSection
              ocrAccuracy={ocrAccuracy}
              setOcrAccuracy={setOcrAccuracy}
              receiptType={receiptType}
              setReceiptType={setReceiptType}
              customReceiptType={customReceiptType}
              setCustomReceiptType={setCustomReceiptType}
              productCount={editableProducts.length}
            />

            <View style={styles.actionButtons}>
              <Button
                title={`Guardar para entrenamiento (${editableProducts.length} productos)`}
                onPress={saveToCSV}
                disabled={!ocrAccuracy || !receiptType || !pendingRawText || editableProducts.length === 0}
              />
            </View>
          </>
        )}

        <MultiExpenseModal
          visible={editModalVisible}
          initialExpenses={editableProducts.map((exp) => ({
            description: exp.description,
            cost: exp.price,
            categoryId: null,
            subcategoryId: null
          }))}
          onClose={(updatedProducts) => {
            if (updatedProducts) {
              setEditableProducts(
                updatedProducts.map((prod) => ({
                  description: prod.description || '',
                  price: prod.cost
                }))
              );
            }
            setEditModalVisible(false);
          }}
          onSave={handleSaveExpenses}
          imageUri={imageUri}
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
  // sectionTitle: {
  //   fontWeight: 'bold',
  //   marginBottom: 10,
  //   fontSize: 16
  // },
  // buttonGroup: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-around',
  //   marginBottom: 20
  // },
  // receiptTypeContainer: {
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  //   justifyContent: 'space-between',
  //   marginBottom: 10
  // },
  // receiptTypeButton: {
  //   padding: 10,
  //   margin: 5,
  //   borderWidth: 1,
  //   borderColor: '#ddd',
  //   borderRadius: 5,
  //   minWidth: '30%',
  //   alignItems: 'center'
  // },
  // selectedReceiptType: {
  //   backgroundColor: '#e3f2fd',
  //   borderColor: '#2196f3'
  // },
  // input: {
  //   height: 40,
  //   borderColor: 'gray',
  //   borderWidth: 1,
  //   padding: 10,
  //   borderRadius: 5,
  //   marginTop: 10
  // },
  actionButtons: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20
  },
  // accuracyButtons: {
  //   marginVertical: 15,
  //   width: '100%'
  // },
  // buttonRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginTop: 8
  // },
  accuracyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center'
  },
  // selectedAccuracy: {
  //   backgroundColor: '#e3f2fd',
  //   borderColor: '#2196f3'
  // },
  // accuracyLegend: {
  //   fontSize: 12,
  //   color: '#666',
  //   marginTop: 5,
  //   textAlign: 'center'
  // }
});

export default ReceiptScanner;
