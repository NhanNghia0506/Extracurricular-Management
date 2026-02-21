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

// Type cho location (địa chỉ + tọa độ)
export interface LocationData {
    address: string;
    latitude: number;
    longitude: number;
}

export interface ActivityDetailResponse {
  id: string;
  title: string;
  description: string;
  image: string;
  trainingScore: number;
  startAt: Date;
  endAt: Date;
  location: LocationData;
  status: string;
  organizer: any;
  category: any;
  participantCount: number;
  isRegistered: boolean;
}

export interface CustomJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}
