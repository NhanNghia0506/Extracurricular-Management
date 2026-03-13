export interface Organizer {
    id: string;
    _id?: string;
    name: string;
    email: string;
    phone: string;
    description: string;
    image?: string;
    approvalStatus?: string;
    createdBy?: string;
    status?: number;
    createdAt?: string;
    updatedAt?: string;
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
    approvalStatus: string;
    isPriority: boolean;
    reviewNote?: string | null;
    warningTag?: string | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy: {
        id?: string;
        name?: string;
        email?: string;
    };
}

export interface OrganizerApprovalDetailResponse extends OrganizerApprovalListItemResponse {
    reviewedAt?: string | null;
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

export interface OrganizerApprovalReviewPayload {
    approvalStatus: 'APPROVED' | 'NEEDS_EDIT' | 'REJECTED';
    reviewNote?: string;
    isPriority?: boolean;
    notifyOrganizer?: boolean;
}

export interface CreateOrganizer {
    name: string;
    email: string;
    phone: string;
    description: string;
    image?: File | null;
}

export interface UpdateOrganizer {
    name?: string;
    email?: string;
    phone?: string;
    description?: string;
    status?: number;
}
