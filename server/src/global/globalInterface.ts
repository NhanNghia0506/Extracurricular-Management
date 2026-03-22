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
  isOwner: boolean;
  canDelete: boolean;
  approvalStatus: string;
  reviewNote?: string | null;
}

export interface ActivityApprovalStatsResponse {
  pending: number;
  approved: number;
  needsEdit: number;
  rejected: number;
  overdue: number;
}

export interface ActivityApprovalListItemResponse {
  id: string;
  code: string;
  title: string;
  image?: string;
  organizer: {
    id?: string;
    name?: string;
  };
  category: {
    id?: string;
    name?: string;
  };
  createdBy: {
    id?: string;
    name?: string;
    email?: string;
  };
  startAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  approvalStatus: string;
  status: string;
  isPriority: boolean;
  reviewNote?: string | null;
  warningTag?: string | null;
}

export interface ActivityApprovalDetailResponse extends ActivityApprovalListItemResponse {
  description: string;
  endAt?: Date;
  image?: string;
  location: LocationData;
  trainingScore?: number;
  participantCount?: number;
  reviewedAt?: Date | null;
  reviewedBy?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
}

export interface ActivityApprovalDashboardResponse {
  items: ActivityApprovalListItemResponse[];
  stats: ActivityApprovalStatsResponse;
}

export interface OrganizerApprovalStatsResponse {
  pending: number;
  approved: number;
  needsEdit: number;
  rejected: number;
  overdue: number;
}

export interface OrganizerApprovalListItemResponse {
  id: string;
  code: string;
  name: string;
  image?: string;
  email: string;
  phone: string;
  description: string;
  createdBy: {
    id?: string;
    name?: string;
    email?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  approvalStatus: string;
  isPriority: boolean;
  reviewNote?: string | null;
  warningTag?: string | null;
}

export interface OrganizerApprovalDetailResponse extends OrganizerApprovalListItemResponse {
  reviewedAt?: Date | null;
  reviewedBy?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
}

export interface OrganizerApprovalDashboardResponse {
  items: OrganizerApprovalListItemResponse[];
  stats: OrganizerApprovalStatsResponse;
}

export interface CustomJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export interface StudentProfile {
  id: string;
  mssv: string;
  name: string;
  email: string;
  avatar: string;
  class: string;
  faculty: string;
}

export interface CertificateVerifyResponse {
  valid: boolean;
  verificationStatus: 'VALID' | 'LEGACY_VALID' | 'NOT_FOUND' | 'REVOKED_OR_INVALID' | 'PROOF_REQUIRED' | 'PROOF_MISMATCH';
  certificateCode?: string;
  issuedAt?: Date;
  status?: string;
  attendanceRate?: number;
  meta?: Record<string, unknown>;
}
