import { CsvData, OcrAccuracy, ScannerState } from '~/shared/types/components/receipt-scanner.type';

export const buildCsvData = (state: ScannerState): CsvData => {
  const selectedReceiptType =
    state.receiptType === 'Otros' ? state.customReceiptType : state.receiptType;

  return {
    raw_text: state.pendingRawText,
    extracted_data: JSON.stringify(state.editableProducts),
    ocr_quality: state.ocrAccuracy as OcrAccuracy,
    receipt_type: selectedReceiptType,
    evaluation_date: new Date().toISOString(),
    evaluator_id: 'user_01', // Puede ser dinámico
    model_version: '1.0'
  };
};

export const generateCsvLine = (data: CsvData): string => {
  const escapedRawText = `"${data.raw_text.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  const escapedProducts = `"${data.extracted_data.replace(/"/g, '""')}"`;
  const escapedReceiptType = `"${data.receipt_type.replace(/"/g, '""')}"`;

  return (
    [
      escapedRawText,
      escapedProducts,
      data.ocr_quality,
      escapedReceiptType,
      data.evaluation_date,
      data.evaluator_id,
      data.model_version
    ].join(',') + '\n'
  );
};
