import { OCRSpaceParams, OCRSpaceResponse } from '~/shared/types/services/ocr-services.type';

const OCR_API_KEY = process.env.OCR_API_KEY;

export const callOCRSpaceAPI = async (params: OCRSpaceParams): Promise<OCRSpaceResponse> => {
  const { base64Image, language = 'spa', isTable = true, OCREngine = 2 } = params;

  const formData = new FormData();
  formData.append('base64Image', `data:image/jpg;base64,${base64Image}`);
  formData.append('language', language);
  formData.append('isTable', String(isTable));
  formData.append('OCREngine', String(OCREngine));
  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: OCR_API_KEY // La API key ahora está interna
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling OCR.space API:', error);
    throw error;
  }
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
