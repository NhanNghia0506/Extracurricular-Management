import {
    OrganizerApprovalDetailResponse,
    OrganizerApprovalListItemResponse,
    OrganizerApprovalStatsResponse,
} from '@/types/organizer.types';

export type OrganizerApprovalState = 'pending' | 'needsEdit' | 'approved';
export type OrganizerApprovalDecision = 'APPROVED' | 'NEEDS_EDIT' | 'REJECTED';

export interface OrganizerApprovalMetric {
    id: string;
    label: string;
    value: string;
    trendLabel: string;
    trendTone: 'up' | 'down' | 'alert';
    cardTone: 'pending' | 'approved' | 'needsEdit' | 'rejected' | 'overdue';
}

export interface OrganizerApprovalChecklistItem {
    id: string;
    tone: 'check' | 'warn';
    content: string;
}

export interface ApprovalOrganizer {
    id: string;
    code: string;
    name: string;
    creatorLabel: string;
    contactLabel: string;
    submittedAt: string;
    deadlineTag?: string;
    statusLabel: string;
    email: string;
    phone: string;
    description: string;
    approvalState: OrganizerApprovalState;
    checklist: OrganizerApprovalChecklistItem[];
    reviewNote: string;
    isPriority: boolean;
    notifyOrganizer: boolean;
    imageUrl?: string;
    reviewedAtLabel?: string;
    reviewedByLabel?: string;
}

const APPROVAL_STATE_MAP: Record<string, OrganizerApprovalState | null> = {
    PENDING: 'pending',
    NEEDS_EDIT: 'needsEdit',
    APPROVED: 'approved',
    REJECTED: null,
};

const STATUS_LABEL_MAP: Record<string, string> = {
    PENDING: 'CHỜ PHÊ DUYỆT',
    NEEDS_EDIT: 'CẦN BỔ SUNG',
    APPROVED: 'ĐÃ PHÊ DUYỆT',
    REJECTED: 'ĐÃ TỪ CHỐI',
};

const formatDateLabel = (value?: string | Date | null): string => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Chưa cập nhật';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const toImageUrl = (image?: string): string | undefined => {
    if (!image) {
        return undefined;
    }

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    const baseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${baseUrl}/uploads/${image}`;
};

const buildChecklist = (item: {
    approvalState: OrganizerApprovalState;
    warningTag?: string | null;
    email?: string;
    phone?: string;
    reviewNote?: string | null;
    imageUrl?: string;
}): OrganizerApprovalChecklistItem[] => {
    const checklist: OrganizerApprovalChecklistItem[] = [];

    if (item.email) {
        checklist.push({ id: 'email', tone: 'check', content: 'Đã có email liên hệ.' });
    }

    if (item.phone) {
        checklist.push({ id: 'phone', tone: 'check', content: 'Đã có số điện thoại liên hệ.' });
    }

    if (item.imageUrl) {
        checklist.push({ id: 'image', tone: 'check', content: 'Đã có ảnh đại diện cho ban tổ chức.' });
    }

    if (item.warningTag) {
        checklist.push({ id: 'warning', tone: 'warn', content: item.warningTag });
    }

    if (item.reviewNote && item.approvalState !== 'approved') {
        checklist.push({ id: 'review-note', tone: 'warn', content: item.reviewNote });
    }

    if (checklist.length === 0) {
        checklist.push({
            id: 'ready',
            tone: item.approvalState === 'approved' ? 'check' : 'warn',
            content: item.approvalState === 'approved'
                ? 'Ban tổ chức đã được duyệt.'
                : 'Ban tổ chức đang chờ quản trị viên xem xét.',
        });
    }

    return checklist;
};

const toApprovalState = (approvalStatus: string): OrganizerApprovalState | null => APPROVAL_STATE_MAP[approvalStatus] ?? null;

export const mapOrganizerApprovalListItemToView = (item: OrganizerApprovalListItemResponse): ApprovalOrganizer | null => {
    const approvalState = toApprovalState(item.approvalStatus);

    if (!approvalState) {
        return null;
    }

    const imageUrl = toImageUrl(item.image);
    const creatorName = item.createdBy?.name || item.createdBy?.email || 'Chưa rõ người tạo';

    return {
        id: item.id,
        code: item.code,
        name: item.name,
        creatorLabel: creatorName,
        contactLabel: item.email,
        submittedAt: formatDateLabel(item.createdAt),
        deadlineTag: item.warningTag || undefined,
        statusLabel: STATUS_LABEL_MAP[item.approvalStatus] || item.approvalStatus,
        email: item.email,
        phone: item.phone,
        description: item.description || 'Ban tổ chức đang chờ duyệt để có thể được sử dụng trong quy trình tạo và quản lý hoạt động.',
        approvalState,
        checklist: buildChecklist({
            approvalState,
            warningTag: item.warningTag,
            email: item.email,
            phone: item.phone,
            reviewNote: item.reviewNote,
            imageUrl,
        }),
        reviewNote: item.reviewNote || '',
        isPriority: item.isPriority,
        notifyOrganizer: true,
        imageUrl,
    };
};

export const mapOrganizerApprovalDetailToView = (item: OrganizerApprovalDetailResponse): ApprovalOrganizer | null => {
    const approvalState = toApprovalState(item.approvalStatus);

    if (!approvalState) {
        return null;
    }

    const imageUrl = toImageUrl(item.image);
    const creatorName = item.createdBy?.name || item.createdBy?.email || 'Chưa rõ người tạo';

    return {
        id: item.id,
        code: item.code,
        name: item.name,
        creatorLabel: creatorName,
        contactLabel: item.email,
        submittedAt: formatDateLabel(item.createdAt),
        deadlineTag: item.warningTag || undefined,
        statusLabel: STATUS_LABEL_MAP[item.approvalStatus] || item.approvalStatus,
        email: item.email,
        phone: item.phone,
        description: item.description || `Ban tổ chức ${item.name} sử dụng email ${item.email} và số điện thoại ${item.phone} để liên hệ. Quản trị viên có thể duyệt, yêu cầu bổ sung hoặc từ chối hồ sơ này.`,
        approvalState,
        checklist: buildChecklist({
            approvalState,
            warningTag: item.warningTag,
            email: item.email,
            phone: item.phone,
            reviewNote: item.reviewNote,
            imageUrl,
        }),
        reviewNote: item.reviewNote || '',
        isPriority: item.isPriority,
        notifyOrganizer: true,
        imageUrl,
        reviewedAtLabel: formatDateLabel(item.reviewedAt),
        reviewedByLabel: item.reviewedBy?.name || item.reviewedBy?.email || 'Chưa được duyệt',
    };
};

export const buildOrganizerApprovalMetrics = (stats: OrganizerApprovalStatsResponse): OrganizerApprovalMetric[] => [
    {
        id: 'pending',
        label: 'Chờ duyệt',
        value: String(stats.pending).padStart(2, '0'),
        trendLabel: 'Cần xử lý',
        trendTone: 'up',
        cardTone: 'pending',
    },
    {
        id: 'approved',
        label: 'Đã duyệt',
        value: String(stats.approved).padStart(2, '0'),
        trendLabel: 'Đã duyệt',
        trendTone: 'up',
        cardTone: 'approved',
    },
    {
        id: 'needs-edit',
        label: 'Cần bổ sung',
        value: String(stats.needsEdit).padStart(2, '0'),
        trendLabel: 'Cần bổ sung',
        trendTone: 'down',
        cardTone: 'needsEdit',
    },
    {
        id: 'rejected',
        label: 'Bị từ chối',
        value: String(stats.rejected).padStart(2, '0'),
        trendLabel: 'Không đạt',
        trendTone: 'down',
        cardTone: 'rejected',
    },
    {
        id: 'overdue',
        label: 'Ưu tiên gấp',
        value: String(stats.overdue).padStart(2, '0'),
        trendLabel: 'Cần ưu tiên',
        trendTone: 'alert',
        cardTone: 'overdue',
    },
];