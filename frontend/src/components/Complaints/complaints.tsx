import React, { useCallback, useEffect, useMemo, useState } from 'react';
import complaintService from '../../services/complaint.service';
import activityService from '../../services/activity.service';
import checkinSessionService from '../../services/checkin-session.service';
import checkinService from '../../services/checkin.service';
import {
    ComplaintCategory,
    ComplaintItem,
    ComplaintPriority,
    ComplaintResponseItem,
    ComplaintStatus,
    CreateComplaintPayload,
} from '../../types/complaint.types';
import { AttendanceCheckinStatus, AttendanceHistoryItem } from '../../types/attendance-history.types';
import { CheckinSession } from '../../types/checkin-session.types';
import { useToastActions } from '../../contexts/ToastContext';
import { resolveImageSrc } from '../../utils/image-url';
import styles from './complaints.module.scss';

interface ComplaintActivityOption {
    id: string;
    title: string;
}

interface SessionCheckinOverview {
    sessionId: string;
    status: AttendanceCheckinStatus;
    checkinTime: string;
}

const statusLabel: Record<ComplaintStatus, string> = {
    SUBMITTED: 'Mới gửi',
    UNDER_REVIEW: 'Đang xử lý',
    RESOLVED: 'Đã xử lý',
    CLOSED: 'Đã đóng',
};

const priorityLabel: Record<ComplaintPriority, string> = {
    NORMAL: 'Thường',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp',
};

const checkinStatusLabel: Record<AttendanceCheckinStatus, string> = {
    SUCCESS: 'Thành công',
    LATE: 'Muộn',
    FAILED: 'Thất bại',
};

const formatDate = (value?: string | Date | null) => {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const Complaints: React.FC = () => {
    const { showToast } = useToastActions();
    const [items, setItems] = useState<ComplaintItem[]>([]);
    const [total, setTotal] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<ComplaintItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'' | ComplaintStatus>('');
    const [activityOptions, setActivityOptions] = useState<ComplaintActivityOption[]>([]);
    const [selectedActivityId, setSelectedActivityId] = useState('');
    const [sessionOptions, setSessionOptions] = useState<CheckinSession[]>([]);
    const [sessionStatusMap, setSessionStatusMap] = useState<Record<string, SessionCheckinOverview>>({});
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [responses, setResponses] = useState<ComplaintResponseItem[]>([]);
    const [loadingResponses, setLoadingResponses] = useState(false);

    const [form, setForm] = useState<CreateComplaintPayload>({
        category: 'ACTIVITY',
        targetEntityId: '',
        title: '',
        description: '',
        priority: 'NORMAL',
        attachmentUrls: [],
    });

    const mapActivityOption = (raw: any): ComplaintActivityOption | null => {
        const idCandidate = raw?.activityId || raw?._id;
        const id = typeof idCandidate === 'string' ? idCandidate : String(idCandidate || '');
        const title = typeof raw?.title === 'string' ? raw.title.trim() : '';

        if (!id || !title) {
            return null;
        }

        return {
            id,
            title,
        };
    };

    const loadList = useCallback(async () => {
        setLoading(true);
        try {
            const response = await complaintService.listMine({ status: statusFilter || undefined, limit: 50 });
            setItems(response.items || []);
            setTotal(response.total || 0);

            const nextId = response.items?.find((item) => item.id === selectedId)?.id
                || response.items?.[0]?.id
                || null;
            setSelectedId(nextId);
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Tải khiếu nại thất bại',
                message: error?.response?.data?.message || 'Không thể tải danh sách khiếu nại.',
            });
        } finally {
            setLoading(false);
        }
    }, [selectedId, showToast, statusFilter]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    useEffect(() => {
        let ignore = false;

        const loadComplaintTargets = async () => {
            setLoadingTargets(true);

            try {
                const [activitiesResponse, historyResponse] = await Promise.all([
                    activityService.myActivities(),
                    checkinService.getMyAttendanceHistory({ page: 1, limit: 1000 }),
                ]);

                if (ignore) {
                    return;
                }

                const rawActivities = Array.isArray(activitiesResponse.data?.data) ? activitiesResponse.data.data : [];
                const options: ComplaintActivityOption[] = rawActivities
                    .map((item: any) => mapActivityOption(item))
                    .filter((item: ComplaintActivityOption | null): item is ComplaintActivityOption => Boolean(item));

                const uniqueOptions = options.filter((item, index, source) => source.findIndex((candidate) => candidate.id === item.id) === index);
                setActivityOptions(uniqueOptions);

                const historyItems = Array.isArray(historyResponse.items) ? historyResponse.items : [];
                const statusLookup: Record<string, SessionCheckinOverview> = {};

                historyItems.forEach((item: AttendanceHistoryItem) => {
                    const existing = statusLookup[item.sessionId];
                    const currentTime = new Date(item.checkinTime).getTime();
                    const existingTime = existing ? new Date(existing.checkinTime).getTime() : 0;

                    if (!existing || currentTime >= existingTime) {
                        statusLookup[item.sessionId] = {
                            sessionId: item.sessionId,
                            status: item.status,
                            checkinTime: item.checkinTime,
                        };
                    }
                });

                setSessionStatusMap(statusLookup);
            } catch (error: any) {
                if (!ignore) {
                    showToast({
                        type: 'error',
                        title: 'Tải dữ liệu khiếu nại thất bại',
                        message: error?.response?.data?.message || 'Không thể tải danh sách hoạt động/checkin để khiếu nại.',
                    });
                }
            } finally {
                if (!ignore) {
                    setLoadingTargets(false);
                }
            }
        };

        void loadComplaintTargets();

        return () => {
            ignore = true;
        };
    }, [showToast]);

    useEffect(() => {
        if (!selectedActivityId) {
            setSessionOptions([]);
            if (form.category === 'ACTIVITY') {
                setForm((prev) => ({ ...prev, targetEntityId: '' }));
            }
            return;
        }

        if (form.category === 'ACTIVITY') {
            setForm((prev) => ({ ...prev, targetEntityId: selectedActivityId }));
            return;
        }

        let ignore = false;

        const loadSessionsByActivity = async () => {
            setLoadingSessions(true);

            try {
                const response = await checkinSessionService.listByActivityId(selectedActivityId);
                const sessions = Array.isArray(response.data?.data) ? response.data.data : [];

                if (!ignore) {
                    setSessionOptions(sessions);
                }
            } catch (error: any) {
                if (!ignore) {
                    setSessionOptions([]);
                    showToast({
                        type: 'error',
                        title: 'Tải phiên điểm danh thất bại',
                        message: error?.response?.data?.message || 'Không thể tải danh sách phiên điểm danh của hoạt động.',
                    });
                }
            } finally {
                if (!ignore) {
                    setLoadingSessions(false);
                }
            }
        };

        void loadSessionsByActivity();

        return () => {
            ignore = true;
        };
    }, [selectedActivityId, form.category, showToast]);

    useEffect(() => {
        if (form.category === 'CHECKIN') {
            setForm((prev) => ({ ...prev, targetEntityId: '' }));
        } else if (form.category === 'ACTIVITY' && selectedActivityId) {
            setForm((prev) => ({ ...prev, targetEntityId: selectedActivityId }));
        }
    }, [form.category, selectedActivityId]);

    useEffect(() => {
        let ignore = false;
        const loadDetail = async () => {
            if (!selectedId) {
                setSelectedDetail(null);
                return;
            }
            try {
                const detail = await complaintService.getMineById(selectedId);
                if (!ignore) {
                    setSelectedDetail(detail);
                }
            } catch (error: any) {
                if (!ignore) {
                    setSelectedDetail(null);
                    showToast({
                        type: 'error',
                        title: 'Tải chi tiết thất bại',
                        message: error?.response?.data?.message || 'Không thể tải chi tiết khiếu nại.',
                    });
                }
            }
        };

        void loadDetail();
        return () => {
            ignore = true;
        };
    }, [selectedId, showToast]);

    useEffect(() => {
        let ignore = false;

        const loadResponses = async () => {
            if (!selectedId) {
                setResponses([]);
                return;
            }

            setLoadingResponses(true);

            try {
                const response = await complaintService.listMineResponses(selectedId);
                if (!ignore) {
                    setResponses(response || []);
                }
            } catch (error: any) {
                if (!ignore) {
                    setResponses([]);
                    showToast({
                        type: 'error',
                        title: 'Tải phản hồi thất bại',
                        message: error?.response?.data?.message || 'Không thể tải luồng phản hồi của khiếu nại.',
                    });
                }
            } finally {
                if (!ignore) {
                    setLoadingResponses(false);
                }
            }
        };

        void loadResponses();

        return () => {
            ignore = true;
        };
    }, [selectedId, showToast]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setUploading(true);
        try {
            const uploaded = await complaintService.uploadAttachment(file);
            setForm((prev) => ({
                ...prev,
                attachmentUrls: [...(prev.attachmentUrls || []), uploaded.imageUrl],
            }));
            showToast({
                type: 'success',
                title: 'Upload thành công',
                message: 'Đã thêm file bằng chứng.',
            });
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Upload thất bại',
                message: error?.response?.data?.message || 'Không thể upload file bằng chứng.',
            });
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.targetEntityId.trim() || !form.title.trim() || !form.description.trim()) {
            showToast({
                type: 'error',
                title: 'Thiếu thông tin',
                message: 'Vui lòng chọn đối tượng khiếu nại, nhập tiêu đề và nội dung.',
            });
            return;
        }

        setSubmitting(true);
        try {
            const created = await complaintService.create({
                ...form,
                targetEntityId: form.targetEntityId.trim(),
                title: form.title.trim(),
                description: form.description.trim(),
            });

            showToast({
                type: 'success',
                title: 'Tạo khiếu nại thành công',
                message: 'Khiếu nại đã được gửi đến quản trị viên.',
            });

            setForm({
                category: form.category,
                targetEntityId: form.category === 'ACTIVITY' ? selectedActivityId : '',
                title: '',
                description: '',
                priority: 'NORMAL',
                attachmentUrls: [],
            });

            await loadList();
            setSelectedId(created.id);
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Tạo khiếu nại thất bại',
                message: error?.response?.data?.message || 'Không thể tạo khiếu nại.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedAttachments = useMemo(() => selectedDetail?.attachmentUrls || [], [selectedDetail]);
    const selectedResponses = useMemo(() => responses || [], [responses]);

    const selectedActivityTitle = useMemo(
        () => activityOptions.find((activity) => activity.id === selectedActivityId)?.title || '',
        [activityOptions, selectedActivityId],
    );

    const pendingCount = items.filter((item) => item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW').length;
    const resolvedCount = items.filter((item) => item.status === 'RESOLVED' || item.status === 'CLOSED').length;

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroCopy}>
                    <p className={styles.eyebrow}>Complaint Center</p>
                    <h2>Khiếu nại của tôi</h2>
                    <p className={styles.heroDescription}>
                        Gửi khiếu nại cho Activity hoặc Checkin, đính kèm bằng chứng và theo dõi tiến độ xử lý trong cùng một màn hình.
                    </p>
                    <div className={styles.heroMeta}>
                        <span className={styles.heroChip}>{total} khiếu nại</span>
                        <span className={styles.heroChip}>{pendingCount} đang mở</span>
                        <span className={styles.heroChip}>{resolvedCount} đã xử lý</span>
                    </div>
                </div>

                <div className={styles.heroActions}>
                    <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => void loadList()}>
                        Tải lại
                    </button>
                </div>
            </section>

            <div className={styles.statsRow}>
                <div className={styles.statCard}><div className={styles.label}>Tổng khiếu nại</div><div className={styles.value}>{total}</div></div>
                <div className={styles.statCard}><div className={styles.label}>Đang mở</div><div className={styles.value}>{pendingCount}</div></div>
                <div className={styles.statCard}><div className={styles.label}>Đã xử lý</div><div className={styles.value}>{resolvedCount}</div></div>
                <div className={styles.statCard}><div className={styles.label}>Bộ lọc</div><div className={styles.value}>{statusFilter ? 1 : 0}</div></div>
            </div>

            <div className={styles.layout}>
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.sectionLabel}>Tạo mới</p>
                            <h3>Tạo khiếu nại mới</h3>
                        </div>
                        <span className={styles.panelHint}>Đính kèm bằng chứng nếu cần</span>
                    </div>

                    <form className={styles.formGrid} onSubmit={handleCreate}>
                        <label>
                            Loại khiếu nại
                            <select
                                value={form.category}
                                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as ComplaintCategory }))}
                            >
                                <option value="ACTIVITY">Activity</option>
                                <option value="CHECKIN">Checkin Session</option>
                            </select>
                        </label>

                        <label>
                            Chọn hoạt động
                            <select
                                value={selectedActivityId}
                                onChange={(event) => {
                                    const nextActivityId = event.target.value;
                                    setSelectedActivityId(nextActivityId);

                                    if (form.category === 'ACTIVITY') {
                                        setForm((prev) => ({ ...prev, targetEntityId: nextActivityId }));
                                    } else {
                                        setForm((prev) => ({ ...prev, targetEntityId: '' }));
                                    }
                                }}
                                disabled={loadingTargets}
                            >
                                <option value="">{loadingTargets ? 'Đang tải hoạt động...' : 'Chọn hoạt động muốn khiếu nại'}</option>
                                {activityOptions.map((activity) => (
                                    <option key={activity.id} value={activity.id}>{activity.title}</option>
                                ))}
                            </select>
                        </label>

                        {form.category === 'ACTIVITY' && selectedActivityId && (
                            <div className={styles.targetHint}>Đối tượng khiếu nại: {selectedActivityTitle}</div>
                        )}

                        {form.category === 'CHECKIN' && (
                            <div className={styles.sessionPicker}>
                                <div className={styles.sessionPickerHeader}>
                                    <strong>Chọn phiên điểm danh để khiếu nại</strong>
                                    {!selectedActivityId && <span>Vui lòng chọn hoạt động trước</span>}
                                </div>

                                {selectedActivityId && loadingSessions && (
                                    <div className={styles.targetHint}>Đang tải danh sách phiên điểm danh...</div>
                                )}

                                {selectedActivityId && !loadingSessions && sessionOptions.length === 0 && (
                                    <div className={styles.targetHint}>Hoạt động này chưa có phiên điểm danh.</div>
                                )}

                                {selectedActivityId && !loadingSessions && sessionOptions.length > 0 && (
                                    <div className={styles.sessionList}>
                                        {sessionOptions.map((session) => {
                                            const sessionStatus = sessionStatusMap[session._id];
                                            const isSelected = form.targetEntityId === session._id;

                                            return (
                                                <button
                                                    key={session._id}
                                                    type="button"
                                                    className={`${styles.sessionItem} ${isSelected ? styles.sessionItemActive : ''}`}
                                                    onClick={() => setForm((prev) => ({ ...prev, targetEntityId: session._id }))}
                                                >
                                                    <div className={styles.sessionTopRow}>
                                                        <strong>{session.title}</strong>
                                                        {sessionStatus ? (
                                                            <span className={`${styles.sessionStatusBadge} ${sessionStatus.status === 'SUCCESS'
                                                                ? styles.sessionStatusSuccess
                                                                : sessionStatus.status === 'FAILED'
                                                                    ? styles.sessionStatusFailed
                                                                    : styles.sessionStatusLate
                                                                }`}>
                                                                {checkinStatusLabel[sessionStatus.status]}
                                                            </span>
                                                        ) : (
                                                            <span className={`${styles.sessionStatusBadge} ${styles.sessionStatusUnknown}`}>
                                                                Chưa check-in
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p>
                                                        {formatDate(session.startTime)} - {formatDate(session.endTime)}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <label>
                            Mức ưu tiên
                            <select
                                value={form.priority}
                                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as ComplaintPriority }))}
                            >
                                <option value="NORMAL">Thường</option>
                                <option value="HIGH">Cao</option>
                                <option value="URGENT">Khẩn cấp</option>
                            </select>
                        </label>

                        <label>
                            Tiêu đề
                            <input
                                value={form.title}
                                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                                placeholder="Nhập tiêu đề khiếu nại"
                            />
                        </label>

                        <label>
                            Nội dung khiếu nại
                            <textarea
                                value={form.description}
                                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                placeholder="Mô tả chi tiết vấn đề cần khiếu nại"
                            />
                        </label>

                        <div className={styles.uploadRow}>
                            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                            <span>{uploading ? 'Đang upload...' : 'Ảnh bằng chứng (tùy chọn)'}</span>
                        </div>

                        {(form.attachmentUrls || []).length > 0 && (
                            <div className={styles.attachmentList}>
                                {(form.attachmentUrls || []).map((url, index) => {
                                    const src = resolveImageSrc(url) || url;
                                    return (
                                        <div className={styles.attachmentItem} key={`${url}-${index}`}>
                                            <img src={src} alt={`attachment-${index + 1}`} />
                                            <a href={src} target="_blank" rel="noreferrer">{src}</a>
                                            <button
                                                type="button"
                                                className={`${styles.btn} ${styles.btnSecondary}`}
                                                onClick={() => setForm((prev) => ({
                                                    ...prev,
                                                    attachmentUrls: (prev.attachmentUrls || []).filter((_, idx) => idx !== index),
                                                }))}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={submitting}>
                            {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
                        </button>
                    </form>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.sectionLabel}>Theo dõi</p>
                            <h3>Danh sách khiếu nại</h3>
                        </div>
                        <select
                            className={styles.inlineSelect}
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as '' | ComplaintStatus)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="SUBMITTED">Mới gửi</option>
                            <option value="UNDER_REVIEW">Đang xử lý</option>
                            <option value="RESOLVED">Đã xử lý</option>
                            <option value="CLOSED">Đã đóng</option>
                        </select>
                    </div>

                    <div className={styles.stack}>
                        <div className={styles.list}>
                            {loading && <div className={styles.empty}>Đang tải danh sách khiếu nại...</div>}

                            {!loading && items.length === 0 && (
                                <div className={styles.empty}>Bạn chưa có khiếu nại nào.</div>
                            )}

                            {!loading && items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`${styles.listItem} ${selectedId === item.id ? styles.listItemActive : ''}`}
                                    onClick={() => setSelectedId(item.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setSelectedId(item.id);
                                        }
                                    }}
                                >
                                    <div className={styles.badgeRow}>
                                        <span className={`${styles.badge} ${item.status === 'SUBMITTED' ? styles.statusSubmitted
                                            : item.status === 'UNDER_REVIEW' ? styles.statusUnderReview
                                                : item.status === 'RESOLVED' ? styles.statusResolved : styles.statusClosed
                                            }`}>
                                            {statusLabel[item.status]}
                                        </span>
                                        <span className={`${styles.badge} ${item.priority === 'NORMAL' ? styles.priorityNormal
                                            : item.priority === 'HIGH' ? styles.priorityHigh : styles.priorityUrgent
                                            }`}>
                                            {priorityLabel[item.priority]}
                                        </span>
                                    </div>
                                    <h4>{item.title}</h4>
                                    <p>{item.targetEntityName}</p>
                                    <p>{formatDate(item.createdAt)}</p>
                                </div>
                            ))}
                        </div>

                        <div className={styles.detail}>
                            {!selectedDetail && <div className={styles.empty}>Chọn một khiếu nại để xem chi tiết.</div>}

                            {selectedDetail && (
                                <>
                                    <h3>{selectedDetail.title}</h3>
                                    <div className={styles.badgeRow}>
                                        <span className={`${styles.badge} ${selectedDetail.status === 'SUBMITTED' ? styles.statusSubmitted
                                            : selectedDetail.status === 'UNDER_REVIEW' ? styles.statusUnderReview
                                                : selectedDetail.status === 'RESOLVED' ? styles.statusResolved : styles.statusClosed
                                            }`}>
                                            {statusLabel[selectedDetail.status]}
                                        </span>
                                        <span className={`${styles.badge} ${selectedDetail.priority === 'NORMAL' ? styles.priorityNormal
                                            : selectedDetail.priority === 'HIGH' ? styles.priorityHigh : styles.priorityUrgent
                                            }`}>
                                            {priorityLabel[selectedDetail.priority]}
                                        </span>
                                    </div>
                                    <div className={styles.detailMeta}>
                                        <div><strong>Loại:</strong> {selectedDetail.category}</div>
                                        <div><strong>Đối tượng:</strong> {selectedDetail.targetEntityName}</div>
                                        <div><strong>Tạo lúc:</strong> {formatDate(selectedDetail.createdAt)}</div>
                                        <div><strong>Xử lý lúc:</strong> {formatDate(selectedDetail.reviewedAt)}</div>
                                    </div>
                                    <div className={styles.detailText}>{selectedDetail.description}</div>

                                    {selectedDetail.reviewNote && (
                                        <div className={styles.noteBox}>
                                            <strong>Phản hồi từ admin</strong>
                                            <p>{selectedDetail.reviewNote}</p>
                                        </div>
                                    )}

                                    <section className={styles.responseThread}>
                                        <div className={styles.responseThreadHeader}>
                                            <div>
                                                <p className={styles.responseEyebrow}>Trao đổi</p>
                                                <h4>Luồng phản hồi</h4>
                                            </div>
                                            <span className={styles.panelHint}>{selectedResponses.length} phản hồi</span>
                                        </div>

                                        {loadingResponses && <div className={styles.empty}>Đang tải phản hồi...</div>}

                                        {!loadingResponses && selectedResponses.length === 0 && (
                                            <div className={styles.empty}>Chưa có phản hồi nào từ ban tổ chức.</div>
                                        )}

                                        {!loadingResponses && selectedResponses.length > 0 && (
                                            <div className={styles.responseTimeline}>
                                                {selectedResponses.map((response, index) => (
                                                    <article
                                                        key={response.id}
                                                        className={`${styles.responseCard} ${response.isInternal ? styles.responseCardInternal : ''}`}
                                                    >
                                                        <div className={styles.responseCardTop}>
                                                            <div className={styles.responseCardMeta}>
                                                                <span className={styles.responseStep}>{index + 1}</span>
                                                                <div>
                                                                    <strong>{response.senderName || 'Ban tổ chức'}</strong>
                                                                    <small>{formatDate(response.createdAt)}</small>
                                                                </div>
                                                            </div>
                                                            <span className={`${styles.responseBadge} ${response.isInternal ? styles.responseBadgeInternal : styles.responseBadgePublic}`}>
                                                                {response.isInternal ? 'Nội bộ' : 'Công khai'}
                                                            </span>
                                                        </div>
                                                        <p>{response.message}</p>
                                                    </article>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    {selectedAttachments.length > 0 && (
                                        <div className={styles.attachmentList}>
                                            {selectedAttachments.map((url, index) => {
                                                const src = resolveImageSrc(url) || url;
                                                return (
                                                    <div className={styles.attachmentItem} key={`${url}-${index}`}>
                                                        <img src={src} alt={`detail-attachment-${index + 1}`} />
                                                        <a href={src} target="_blank" rel="noreferrer">{src}</a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Complaints;
