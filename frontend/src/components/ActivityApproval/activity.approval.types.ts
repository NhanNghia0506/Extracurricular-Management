import {
    ActivityApprovalDetailResponse,
    ActivityApprovalListItemResponse,
    ActivityApprovalStatsResponse,
} from '@/types/activity.types';
import { resolveImageSrc } from '../../utils/image-url';

export type ApprovalState = 'pending' | 'needsEdit' | 'approved' | 'rejected';
export type ApprovalDecision = 'APPROVED' | 'NEEDS_EDIT' | 'REJECTED';

export interface ApprovalMetric {
    id: string;
    label: string;
    value: string;
    trendLabel: string;
    trendTone: 'up' | 'down' | 'alert';
    cardTone: 'pending' | 'approved' | 'needsEdit' | 'rejected' | 'overdue';
}

export interface ApprovalChecklistItem {
    id: string;
    tone: 'check' | 'warn';
    content: string;
}

export interface ApprovalActivity {
    id: string;
    code: string;
    title: string;
    organizer: string;
    organizerDisplay: string;
    eventDate: string;
    submittedAt: string;
    deadlineTag?: string;
    statusLabel: string;
    location: string;
    scoreLabel: string;
    checkinMethod: string;
    description?: string;
    approvalState: ApprovalState;
    checklist: ApprovalChecklistItem[];
    reviewNote: string;
    isPriority: boolean;
    notifyOrganizer: boolean;
    imageUrl?: string;
    participantCountLabel?: string;
    reviewedAtLabel?: string;
    reviewedByLabel?: string;
}

const APPROVAL_STATE_MAP: Record<string, ApprovalState | null> = {
    PENDING: 'pending',
    NEEDS_EDIT: 'needsEdit',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

const STATUS_LABEL_MAP: Record<string, string> = {
    PENDING: 'CHỜ PHÊ DUYỆT',
    NEEDS_EDIT: 'CẦN CHỈNH SỬA',
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

const buildChecklist = (item: {
    approvalState: ApprovalState;
    warningTag?: string | null;
    location?: string;
    trainingScore?: number;
    reviewNote?: string | null;
    imageUrl?: string;
}): ApprovalChecklistItem[] => {
    const checklist: ApprovalChecklistItem[] = [];

    if (item.location) {
        checklist.push({ id: 'location', tone: 'check', content: 'Địa điểm đã được khai báo.' });
    }

    if (typeof item.trainingScore === 'number') {
        checklist.push({ id: 'training-score', tone: 'check', content: 'Đã có điểm rèn luyện cho hoạt động.' });
    }

    if (item.imageUrl) {
        checklist.push({ id: 'image', tone: 'check', content: 'Đã có ảnh đại diện cho hoạt động.' });
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
            content: item.approvalState === 'approved' ? 'Hoạt động đã được duyệt.' : 'Hoạt động đang chờ quản trị viên xem xét.',
        });
    }

    return checklist;
};

const toImageUrl = resolveImageSrc;

const toApprovalState = (approvalStatus: string): ApprovalState | null => APPROVAL_STATE_MAP[approvalStatus] ?? null;

export const mapApprovalListItemToView = (item: ActivityApprovalListItemResponse): ApprovalActivity | null => {
    const approvalState = toApprovalState(item.approvalStatus);

    if (!approvalState) {
        return null;
    }

    const organizerName = item.organizer?.name || 'Chưa rõ đơn vị';
    const imageUrl = toImageUrl(item.image);

    return {
        id: item.id,
        code: item.code,
        title: item.title,
        organizer: organizerName,
        organizerDisplay: organizerName,
        eventDate: formatDateLabel(item.startAt),
        submittedAt: formatDateLabel(item.createdAt),
        deadlineTag: item.warningTag || undefined,
        statusLabel: STATUS_LABEL_MAP[item.approvalStatus] || item.approvalStatus,
        location: 'Xem chi tiết để thấy địa điểm',
        scoreLabel: 'Chờ cập nhật',
        checkinMethod: 'Chưa cấu hình',
        approvalState,
        checklist: buildChecklist({
            approvalState,
            warningTag: item.warningTag,
            reviewNote: item.reviewNote,
            imageUrl,
        }),
        reviewNote: item.reviewNote || '',
        isPriority: item.isPriority,
        notifyOrganizer: true,
        imageUrl,
    };
};
export const mapApprovalDetailToView = (item: ActivityApprovalDetailResponse): ApprovalActivity | null => {
    const approvalState = toApprovalState(item.approvalStatus);

    if (!approvalState) {
        return null;
    }

    const organizerName = item.organizer?.name || 'Chưa rõ đơn vị';
    const imageUrl = toImageUrl(item.image);
    const locationLabel = item.location?.address || 'Chưa cập nhật địa điểm';
    const scoreLabel = typeof item.trainingScore === 'number'
        ? `${String(item.trainingScore).padStart(2, '0')} điểm rèn luyện`
        : 'Chưa cập nhật điểm';

    return {
        id: item.id,
        code: item.code,
        title: item.title,
        organizer: organizerName,
        organizerDisplay: organizerName,
        eventDate: formatDateLabel(item.startAt),
        submittedAt: formatDateLabel(item.createdAt),
        deadlineTag: item.warningTag || undefined,
        statusLabel: STATUS_LABEL_MAP[item.approvalStatus] || item.approvalStatus,
        location: locationLabel,
        scoreLabel,
        checkinMethod: 'Theo cấu hình của hoạt động',
        description: item.description,
        approvalState,
        checklist: buildChecklist({
            approvalState,
            warningTag: item.warningTag,
            location: locationLabel,
            trainingScore: item.trainingScore,
            reviewNote: item.reviewNote,
            imageUrl,
        }),
        reviewNote: item.reviewNote || '',
        isPriority: item.isPriority,
        notifyOrganizer: true,
        imageUrl,
        participantCountLabel: typeof item.participantCount === 'number' ? `${item.participantCount} người` : 'Chưa cập nhật',
        reviewedAtLabel: formatDateLabel(item.reviewedAt),
        reviewedByLabel: item.reviewedBy?.name || 'Chưa được duyệt',
    };
};

export const buildApprovalMetrics = (stats: ActivityApprovalStatsResponse): ApprovalMetric[] => [
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
        label: 'Cần sửa',
        value: String(stats.needsEdit).padStart(2, '0'),
        trendLabel: 'Cần sửa',
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
