export interface ResponseDataProps<T> {
  data: T | T[];
  statusCode: number;
  message: string;
}

// Interface cho response upload
export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    uploadedAt: Date;
  };
}
