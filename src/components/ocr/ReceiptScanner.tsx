import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { OcrAccuracy, OcrApiResponse, Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import MultiExpenseModal from '../modal/MultiExpenseModal';
import { callOCRSpaceAPI, mockOCRSpaceAPI } from '~/services/ocrService';
import { CreateMultipleExpense } from '~/services/expenses';
import { CreateExpensePayload } from '~/shared/types/services/expense-service.type';
import { buildCsvData, generateCsvLine } from '~/utils/csvUtils';
import { extractProducts } from '~/utils/parsers';
import ImagePickerComponent from '../image/ImagePicker';
import OcrEvaluationSection from './OcrEvaluationSection';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyButton from '../MyButton';

const fileName = 'extractions_v3.csv';
interface ReceiptScannerProps {
  onExtractedData?: (data: { price: string; category?: string; subcategory?: string; rawText: string }) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = () => {
  const colors = useThemeColors();

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

  useEffect(() => {
    updateCsvRowCount();
  }, []);

  const updateCsvRowCount = async () => {
    try {
      const file = new File(Paths.document, fileName);
      if (file.exists) {
        const content = await file.text();
        const lines = content.trim().split('\n');
        setCsvRows(lines.length > 1 ? lines.length - 1 : 0);
      } else {
        setCsvRows(0);
      }
    } catch (e) {
      console.log('Error contando filas CSV:', e);
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
    } catch (e: any) {
      setError('Error al procesar imagen: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOcrError = (data: OcrApiResponse) => {
    let apiError = '';
    if (data.IsErroredOnProcessing && data.ErrorMessage) {
      apiError = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(' ') : data.ErrorMessage;
    }
    setError(`No se pudo extraer texto de la imagen.\n${apiError}`);
  };

  const handleSaveExpenses = async (expenses: CreateExpensePayload[]) => {
    try {
      await CreateMultipleExpense(expenses);
      setEditModalVisible(false);

      setEditableProducts(
        expenses.map((exp) => ({
          description: exp.commentary || '',
          price: exp.cost,
        }))
      );

      Alert.alert('Éxito', 'Gastos guardados correctamente');
    } catch (error) {
      console.error('Error al guardar gastos:', error);
      Alert.alert('Error', 'No se pudieron guardar los gastos');
    }
  };

  const saveToCSV = async () => {
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
        editableProducts,
      });

      const file = new File(Paths.document, fileName);
      const csvLine = generateCsvLine(csvData);

      const headers = [
        'raw_text',
        'extracted_data',
        'ocr_quality',
        'receipt_type',
        'evaluation_date',
        'evaluator_id',
        'model_version',
      ].join(',');

      const content = file.exists
        ? (await file.text()) + csvLine
        : headers + '\n' + csvLine;

      await file.write(content);
      updateCsvRowCount();

      Alert.alert('Dataset actualizado', `Datos guardados para entrenamiento.`, [
        {
          text: 'Nuevo escaneo',
          onPress: () => resetForm(),
        },
        { text: 'Ver datos', style: 'cancel' },
      ]);
    } catch (error: any) {
      Alert.alert('Error al guardar', error.message);
    }
  };

  const resetForm = () => {
    setPendingRawText('');
    setOcrAccuracy('');
    setReceiptType('');
    setCustomReceiptType('');
    setText('');
    setImageUri(null);
    setEditableProducts([]);
    setError(null);
  };

  const shareCSV = async () => {
    try {
      const file = new File(Paths.document, fileName);
      if (file.exists) {
        await Sharing.shareAsync(file.uri);
      } else {
        setError('No hay archivo CSV para compartir.');
      }
    } catch (e: any) {
      setError('Error al compartir: ' + e?.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.inner}>

        {/* --- SELECTOR DE IMAGEN --- */}
        <ImagePickerComponent
          onImageSelected={(base64, uri) => {
            setImageUri(uri);
            processImage(base64);
          }}
          onError={setError}
          resetTrigger={!imageUri && !text}
        />

        {/* --- COMPARTIR CSV --- */}
        <MyButton
          title="Compartir CSV"
          variant="secondary"
          fullWidth
          onPress={shareCSV}
        />

        <Text style={[styles.csvCounter, { color: colors.TEXT_PRIMARY }]}>
          Registros en CSV: {csvRows}
        </Text>

        {loading && <ActivityIndicator size="large" color={colors.PRIMARY} />}
        {error && <Text style={[styles.error, { color: colors.ERROR }]}>{error}</Text>}

        {/* --- TEXTO EXTRAÍDO --- */}
        {text !== '' && (
          <>
            <View style={[styles.resultBox, { backgroundColor: colors.CARD_BACKGROUND }]}>
              <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
                Texto extraído ({editableProducts.length}):
              </Text>
              <Text style={[styles.text, { color: colors.TEXT_PRIMARY }]}>{text}</Text>
            </View>

            {/* --- SECCIÓN DE EVALUACIÓN --- */}
            <OcrEvaluationSection
              ocrAccuracy={ocrAccuracy}
              setOcrAccuracy={setOcrAccuracy}
              receiptType={receiptType}
              setReceiptType={setReceiptType}
              customReceiptType={customReceiptType}
              setCustomReceiptType={setCustomReceiptType}
              productCount={editableProducts.length}
            />

            {/* --- BOTÓN GUARDAR DATASET --- */}
            <MyButton
              title={`Guardar para entrenamiento (${editableProducts.length} productos)`}
              fullWidth
              onPress={saveToCSV}
              variant="primary"
              disabled={
                !ocrAccuracy ||
                !receiptType ||
                editableProducts.length === 0 ||
                !pendingRawText
              }
            />
          </>
        )}

        <MultiExpenseModal
          visible={editModalVisible}
          initialExpenses={editableProducts.map((exp) => ({
            description: exp.description,
            cost: exp.price,
            categoryId: null,
            subcategoryId: null,
          }))}
          onClose={(updated) => {
            if (updated) {
              setEditableProducts(
                updated.map((p) => ({
                  description: p.description || '',
                  price: p.cost,
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
  container: {
    flexGrow: 1,
    padding: 16,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  csvCounter: {
    marginVertical: 12,
    fontWeight: '600',
  },
  error: {
    marginVertical: 8,
    textAlign: 'center',
  },
  resultBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  label: {
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ReceiptScanner;
