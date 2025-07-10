export type Product = {
  description: string;
  price: number;
}

export type OcrAccuracy =
  | '0' // Falló completamente
  | '1' // Mala calidad (menos del 50% de texto correcto)
  | '2' // Calidad regular (50-80% de texto correcto)
  | '3' // Buena calidad (80-95% de texto correcto)
  | '4' // Excelente calidad (95-100% de texto correcto)
  | 'unverified'; // Por defecto

export type ReceiptType = 'D1' | 'Carulla' | 'Exito' | 'DollarCity' | 'Otros';

export type CsvData = {
  raw_text: string;
  extracted_data: string;
  ocr_quality: OcrAccuracy;
  receipt_type: string;
  evaluation_date: string;
  evaluator_id: string;
  model_version: string;
}

export type ScannerState = {
  pendingRawText: string;
  ocrAccuracy: OcrAccuracy | '';
  receiptType: ReceiptType | '';
  customReceiptType: string;
  editableProducts: Product[];
}