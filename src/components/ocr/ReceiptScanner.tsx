/**
 * ReceiptScanner.tsx
 *
 * Pantalla principal de escaneo de recibos.
 * Soporta imagen (galería/cámara) y PDF.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  OcrAccuracy,
  OcrApiResponse,
  Product,
  ReceiptType
} from '~/shared/types/components/receipt-scanner.type';
import MultiExpenseModal from '../modal/MultiExpenseModal';
import { callOCRSpaceAPI, callOCRSpaceAPIPdf, mockOCRSpaceAPI } from '~/services/ocrService';
import { CreateMultipleExpense } from '~/services/expenses';
import { CreateExpensePayload } from '~/shared/types/services/expense-service.type';
import { buildCsvData, generateCsvLine } from '~/utils/csvUtils';
import { extractProducts, SourceType } from '~/utils/parsers';
import ImagePickerComponent from '../image/ImagePicker';
import OcrEvaluationSection from './OcrEvaluationSection';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyButton from '../MyButton';

const CSV_FILE_NAME = 'extractions_v3.csv';
const CSV_HEADERS = [
  'raw_text',
  'extracted_data',
  'ocr_quality',
  'receipt_type',
  'evaluation_date',
  'evaluator_id',
  'model_version'
].join(',');

const STORE_HINTS = ['Carulla', 'Exito'] as const;

interface ReceiptScannerProps {
  onExtractedData?: (data: {
    price: string;
    category?: string;
    subcategory?: string;
    rawText: string;
  }) => void;
}

const getErrorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// Cuenta los registros del CSV (sin contar el encabezado)
const readCsvRowCount = async (): Promise<number> => {
  try {
    const file = new File(Paths.document, CSV_FILE_NAME);
    if (!file.exists) return 0;

    const content = await file.text();
    const lines = content.trim().split('\n');
    return lines.length > 1 ? lines.length - 1 : 0;
  } catch {
    return 0;
  }
};

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
  const [sourceType, setSourceType] = useState<SourceType>('image');

  // ─── CSV ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    readCsvRowCount().then((count) => {
      if (isMounted) setCsvRows(count);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshCsvRows = useCallback(async () => {
    setCsvRows(await readCsvRowCount());
  }, []);

  // ─── Procesamiento compartido ────────────────────────────────────────────────

  const handleOcrResult = useCallback(
    (rawText: string, source: SourceType) => {
      setText(rawText);
      const hint = receiptType === 'Carulla' || receiptType === 'Exito' ? receiptType : undefined;
      const productos = extractProducts(rawText, { storeHint: hint, sourceType: source });
      setEditableProducts(productos);
      setPendingRawText(rawText);
      setEditModalVisible(true);
    },
    [receiptType]
  );

  const handleOcrError = useCallback((data: OcrApiResponse) => {
    let apiError = '';
    if (data.IsErroredOnProcessing && data.ErrorMessage) {
      apiError = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(' ') : data.ErrorMessage;
    }
    setError(`No se pudo extraer texto.\n${apiError}`);
  }, []);

  // ─── Flujo imagen ────────────────────────────────────────────────────────────

  const processImage = useCallback(
    async (base64: string, mock = false) => {
      setLoading(true);
      setText('');
      setError(null);
      setSourceType('image');
      try {
        const data = mock
          ? await mockOCRSpaceAPI()
          : await callOCRSpaceAPI({ base64Image: base64 });
        if (data?.ParsedResults?.[0]?.ParsedText) {
          handleOcrResult(data.ParsedResults[0].ParsedText, 'image');
        } else {
          handleOcrError(data);
        }
      } catch (e) {
        setError(`Error al procesar imagen: ${getErrorMessage(e)}`);
      } finally {
        setLoading(false);
      }
    },
    [handleOcrResult, handleOcrError]
  );

  // ─── Flujo PDF ───────────────────────────────────────────────────────────────

  const processPdf = useCallback(
    async (base64: string) => {
      setLoading(true);
      setText('');
      setError(null);
      setSourceType('pdf');
      try {
        const data = await callOCRSpaceAPIPdf({ base64Pdf: base64 });
        const allText = data?.ParsedResults?.map((r) => r.ParsedText ?? '')
          .filter(Boolean)
          .join('\n');
        if (allText && allText.trim().length > 0) {
          handleOcrResult(allText, 'pdf');
        } else {
          handleOcrError(data);
        }
      } catch (e) {
        setError(`Error al procesar PDF: ${getErrorMessage(e)}`);
      } finally {
        setLoading(false);
      }
    },
    [handleOcrResult, handleOcrError]
  );

  // ─── Guardar gastos ──────────────────────────────────────────────────────────

  const handleSaveExpenses = useCallback(async (expenses: CreateExpensePayload[]) => {
    try {
      await CreateMultipleExpense(expenses);
      setEditModalVisible(false);
      setEditableProducts(
        expenses.map((exp) => ({
          description: exp.commentary ?? '',
          price: exp.cost
        }))
      );
      Alert.alert('Éxito', 'Gastos guardados correctamente');
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los gastos');
    }
  }, []);

  // ─── CSV actions ─────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setPendingRawText('');
    setOcrAccuracy('');
    setReceiptType('');
    setCustomReceiptType('');
    setText('');
    setImageUri(null);
    setEditableProducts([]);
    setError(null);
    setSourceType('image');
  }, []);

  const saveToCSV = useCallback(async () => {
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
      const file = new File(Paths.document, CSV_FILE_NAME);
      const csvLine = generateCsvLine(csvData);
      const content = file.exists ? (await file.text()) + csvLine : `${CSV_HEADERS}\n${csvLine}`;
      await file.write(content);
      await refreshCsvRows();
      Alert.alert('Dataset actualizado', 'Datos guardados para entrenamiento.', [
        { text: 'Nuevo escaneo', onPress: resetForm },
        { text: 'Ver datos', style: 'cancel' }
      ]);
    } catch (e) {
      Alert.alert('Error al guardar', getErrorMessage(e));
    }
  }, [
    ocrAccuracy,
    receiptType,
    editableProducts,
    pendingRawText,
    customReceiptType,
    refreshCsvRows,
    resetForm
  ]);

  const shareCSV = useCallback(async () => {
    try {
      const file = new File(Paths.document, CSV_FILE_NAME);
      if (file.exists) {
        await Sharing.shareAsync(file.uri);
      } else {
        setError('No hay archivo CSV para compartir.');
      }
    } catch (e) {
      setError(`Error al compartir: ${getErrorMessage(e)}`);
    }
  }, []);

  // ─── Modal de gastos ─────────────────────────────────────────────────────────

  const initialExpenses = useMemo(
    () =>
      editableProducts.map((exp) => ({
        description: exp.description,
        cost: exp.price,
        categoryId: null,
        subcategoryId: null
      })),
    [editableProducts]
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.inner}>
        {/* Selector anticipado de tienda (Carulla/Éxito) */}
        {!text && (
          <View style={styles.storeHintContainer}>
            <Text style={[styles.storeHintLabel, { color: colors.TEXT_PRIMARY }]}>
              ¿Es factura de Carulla o Éxito? (opcional)
            </Text>
            <View style={styles.storeHintRow}>
              {STORE_HINTS.map((store) => {
                const selected = receiptType === store;

                return (
                  <TouchableOpacity
                    key={store}
                    style={[
                      styles.storeHintButton,
                      {
                        backgroundColor: selected ? colors.INFO + '15' : colors.CARD_BACKGROUND,
                        borderColor: selected ? colors.INFO : colors.BORDER
                      }
                    ]}
                    onPress={() => setReceiptType(selected ? '' : store)}
                  >
                    <Text
                      style={[
                        { color: selected ? colors.INFO : colors.TEXT_PRIMARY },
                        selected && styles.storeHintTextSelected
                      ]}
                    >
                      {store}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Selector unificado imagen / PDF */}
        <ImagePickerComponent
          onImageSelected={(base64, uri) => {
            setImageUri(uri);
            processImage(base64);
          }}
          onPdfSelected={(base64, uri) => {
            setImageUri(uri);
            processPdf(base64);
          }}
          onError={setError}
          resetTrigger={!imageUri && !text}
        />

        <MyButton title="Compartir CSV" variant="secondary" fullWidth onPress={shareCSV} />

        <Text style={[styles.csvCounter, { color: colors.TEXT_PRIMARY }]}>
          Registros en CSV: {csvRows}
        </Text>

        {loading && <ActivityIndicator size="large" color={colors.PRIMARY} />}
        {error && <Text style={[styles.error, { color: colors.ERROR }]}>{error}</Text>}

        {text !== '' && (
          <>
            <View style={[styles.resultBox, { backgroundColor: colors.CARD_BACKGROUND }]}>
              <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
                Texto extraído ({editableProducts.length} productos
                {sourceType === 'pdf' ? ' · PDF' : ' · Imagen'}):
              </Text>
              <Text style={[styles.text, { color: colors.TEXT_PRIMARY }]}>{text}</Text>
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

            <MyButton
              title={`Guardar para entrenamiento (${editableProducts.length} productos)`}
              fullWidth
              onPress={saveToCSV}
              variant="primary"
              disabled={
                !ocrAccuracy || !receiptType || editableProducts.length === 0 || !pendingRawText
              }
            />
          </>
        )}

        <MultiExpenseModal
          visible={editModalVisible}
          sourceType={sourceType}
          initialExpenses={initialExpenses}
          onClose={(updated) => {
            if (updated) {
              setEditableProducts(
                updated.map((p) => ({
                  description: p.description || '',
                  price: p.cost
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
    padding: 16
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    width: '100%'
  },
  storeHintContainer: {
    width: '100%',
    marginBottom: 12
  },
  storeHintLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6
  },
  storeHintRow: {
    flexDirection: 'row',
    gap: 8
  },
  storeHintButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1
  },
  storeHintTextSelected: {
    fontWeight: '600'
  },
  csvCounter: {
    marginVertical: 12,
    fontWeight: '600'
  },
  error: {
    marginVertical: 8,
    textAlign: 'center'
  },
  resultBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    marginTop: 16
  },
  label: {
    fontWeight: '700',
    marginBottom: 8
  },
  text: {
    fontSize: 14,
    lineHeight: 20
  }
});

export default ReceiptScanner;
