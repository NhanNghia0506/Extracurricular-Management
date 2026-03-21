export type CertificateStatus = 'ISSUED' | 'REVOKED';

export interface CertificateItem {
    _id: string;
    userId: string;
    activityId: string;
    certificateCode: string;
    fileName: string;
    fileUrl: string;
    verifyUrl: string;
    issuedAt: string;
    totalSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    status: CertificateStatus;
    meta?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface MyCertificatesPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface MyCertificatesResponse {
    items: CertificateItem[];
    pagination: MyCertificatesPagination;
}