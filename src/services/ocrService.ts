import { OcrApiResponse } from '~/shared/types/components/receipt-scanner.type';
import { OCRImageParams, OCRPdfParams } from '~/shared/types/services/ocr-services.type';

const OCR_API_KEY = process.env.OCR_API_KEY;

export const callOCRSpaceAPI = async (params: OCRImageParams): Promise<OcrApiResponse> => {
  const { base64Image, language = 'spa', isTable = true, OCREngine = 2 } = params;

  const formData = new FormData();
  formData.append('base64Image', `data:image/jpg;base64,${base64Image}`);
  formData.append('language', language);
  formData.append('isTable', String(isTable));
  formData.append('OCREngine', String(OCREngine));

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { apikey: OCR_API_KEY },
    body: formData
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ─── PDF (nuevo) ──────────────────────────────────────────────────────────────

export const callOCRSpaceAPIPdf = async (params: OCRPdfParams): Promise<OcrApiResponse> => {
  const { base64Pdf, language = 'spa', isTable = true, OCREngine = 2 } = params;

  const formData = new FormData();
  // OCR.space acepta PDF en base64 con este prefijo
  formData.append('base64Image', `data:application/pdf;base64,${base64Pdf}`);
  formData.append('language', language);
  formData.append('isTable', String(isTable));
  formData.append('OCREngine', String(OCREngine));
  // Importante: indica a OCR.space que procese todas las páginas del PDF
  formData.append('isCreateSearchablePdf', 'false');
  formData.append('isSearchablePdfHideTextLayer', 'false');

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { apikey: OCR_API_KEY },
    body: formData
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// Mock function remains the same
export const mockOCRSpaceAPI = async (): Promise<any> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    ParsedResults: [
      {
        ParsedText:
          'PRECIO\t\r\nPLU\tDETALLE\t\r\n1 1/u x 23.000 V. Ahorro 0\t\r\n172836 Huevo Napoles De\t23.000\t\r\n2 1/u x 2.350 V. Ahorro 0\t\r\n3343120 Mogolla Integral\t2.350\t\r\nTotal Item :2\t\r\n'
      }
    ]
  };
};
