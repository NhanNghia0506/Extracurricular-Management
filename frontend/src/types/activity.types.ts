export interface LocationData {
    address: string;
    latitude: number;
    longitude: number;
}

export interface CreateActivity {
    title: string;
    description: string;
    location: LocationData;
    image?: string;
    organizerId: string;
    categoryId: string;
    startAt: string;
    endAt?: string;
    status?: string;
}

export interface ActivityListItem {
    _id: string;
    title: string;
    description: string;
    location: LocationData;
    status: string;
    image?: string;
    organizerId?: {
        _id?: string;
        name?: string;
        image?: string;
    } | string;
    categoryId?: {
        _id?: string;
        name?: string;
    } | string;
    startAt: string;
    endAt?: string;
    createdAt?: string;
    updatedAt?: string;
    isMine?: boolean;
    trainingScore?: number;
}

export interface ActivityDetailResponse {
    id: string;
    title: string;
    description: string;
    startAt: string;
    endAt?: string;
    location: LocationData;
    status: string;
    image?: string;
    trainingScore?: number;
    participantCount?: number;
    organizer: {
        _id: string;
        name: string;
        image?: string;
    };
    category: {
        _id: string;
        name: string;
    };
    registeredCount: number;
    isRegistered: boolean;
    participantRegistrationId?: string | null;
    participantStatus?: 'REGISTERED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | null;
    isOwner: boolean;
    canDelete: boolean;
    approvalStatus?: string;
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
    startAt: string;
    createdAt?: string;
    updatedAt?: string;
    approvalStatus: string;
    status: string;
    isPriority: boolean;
    reviewNote?: string | null;
    warningTag?: string | null;
}

export interface ActivityApprovalDetailResponse extends ActivityApprovalListItemResponse {
    description: string;
    endAt?: string;
    image?: string;
    location: LocationData;
    trainingScore?: number;
    participantCount?: number;
    reviewedAt?: string | null;
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

export interface ActivityApprovalReviewPayload {
    approvalStatus: 'APPROVED' | 'NEEDS_EDIT' | 'REJECTED';
    reviewNote?: string;
    isPriority?: boolean;
    notifyOrganizer?: boolean;
}