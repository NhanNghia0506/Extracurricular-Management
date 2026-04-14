export type ComplaintCategory = 'ACTIVITY' | 'CHECKIN';
export type ComplaintStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type ComplaintPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type ComplaintResolution = 'UPHELD' | 'DISMISSED' | 'PARTIAL';
export type CheckinStatus = 'SUCCESS' | 'FAILED' | 'LATE';
export type ComplaintActorRole = 'STUDENT' | 'ADMIN' | 'SYSTEM';
export type ComplaintHistoryAction = 'CREATED' | 'ATTACHMENT_ADDED' | 'RESPONSE_ADDED' | 'STATUS_CHANGED';

export interface ComplaintUserInfo {
    id: string;
    name?: string;
}

export interface ComplaintAttachmentItem {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    createdAt?: string | Date;
}

export interface ComplaintResponseItem {
    id: string;
    complaintId: string;
    senderId: string;
    senderName?: string;
    senderRole: ComplaintActorRole;
    message: string;
    isInternal: boolean;
    attachments: ComplaintAttachmentItem[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface ComplaintHistoryItem {
    id: string;
    complaintId: string;
    action: ComplaintHistoryAction;
    actorId?: string | null;
    actorName?: string;
    actorRole: ComplaintActorRole;
    fromStatus?: ComplaintStatus | null;
    toStatus?: ComplaintStatus | null;
    note?: string | null;
    meta?: Record<string, unknown> | null;
    createdAt?: string | Date;
}

export interface ComplaintItem {
    id: string;
    complainantId: string;
    complainantName?: string;
    category: ComplaintCategory;
    targetEntityId: string;
    targetEntityName: string;
    title: string;
    description: string;
    attachmentUrls: string[];
    attachments?: ComplaintAttachmentItem[];
    status: ComplaintStatus;
    priority: ComplaintPriority;
    resolution?: ComplaintResolution | null;
    reviewNote?: string | null;
    reviewedBy?: ComplaintUserInfo | null;
    reviewedAt?: string | Date | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface ComplaintListResponse {
    items: ComplaintItem[];
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

export interface ComplaintDashboardResponse {
    submitted: number;
    underReview: number;
    resolved: number;
    closed: number;
}

export interface CreateComplaintPayload {
    category: ComplaintCategory;
    targetEntityId: string;
    title: string;
    description: string;
    priority?: ComplaintPriority;
    attachmentUrls?: string[];
}

export interface ListComplaintQuery {
    limit?: number;
    skip?: number;
    status?: ComplaintStatus;
    category?: ComplaintCategory;
    priority?: ComplaintPriority;
}

export interface ReviewComplaintPayload {
    status: Exclude<ComplaintStatus, 'SUBMITTED'>;
    resolution?: ComplaintResolution;
    reviewNote: string;
    checkinAdjustment?: {
        status?: CheckinStatus;
        trainingScoreDelta?: number;
        reason?: string;
    };
}

export interface UploadedComplaintAttachment {
    filename: string;
    imageUrl: string;
}

export interface CreateComplaintResponsePayload {
    message: string;
    isInternal?: boolean;
    attachmentUrls?: string[];
}
