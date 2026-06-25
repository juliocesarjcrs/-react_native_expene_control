export type ParsedResult = {
  TextOverlay?: {
    Lines?: any[];
    HasOverlay: boolean;
    Message?: string;
  };
  TextOrientation?: string;
  FileParseExitCode: number;
  ParsedText: string;
  ErrorMessage?: string;
  ErrorDetails?: string;
};

export type OCRSpaceError = {
  IsErroredOnProcessing: true;
  ErrorMessage: string | string[];
  ErrorDetails?: string;
};
export type OCRPdfParams = {
  base64Pdf: string;
  language?: string;
  isTable?: boolean;
  OCREngine?: number;
};

export type OCRImageParams = {
  base64Image: string;
  language?: string;
  isTable?: boolean;
  OCREngine?: number;
};
