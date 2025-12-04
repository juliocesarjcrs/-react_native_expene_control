export type OCRSpaceParams = {
  base64Image: string;
  language?: string;
  isTable?: boolean;
  OCREngine?: number;
};
export type OCRSpaceResponse = {
  ParsedResults?: ParsedResult[];
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
  ProcessingTimeInMilliseconds?: string;
};

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
