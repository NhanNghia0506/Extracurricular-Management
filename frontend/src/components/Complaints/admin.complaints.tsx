import React, { useCallback, useEffect, useMemo, useState } from 'react';
import complaintService from '../../services/complaint.service';
import {
    CheckinStatus,
    ComplaintCategory,
    ComplaintItem,
    ComplaintPriority,
    ComplaintResolution,
    ComplaintStatus,
} from '../../types/complaint.types';
import { useToastActions } from '../../contexts/ToastContext';
import { resolveImageSrc } from '../../utils/image-url';
import styles from './complaints.module.scss';

interface AdminComplaintsProps {
    organizerId?: string;
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

const resolutionLabel: Record<ComplaintResolution, string> = {
    UPHELD: 'Chấp nhận khiếu nại',
    DISMISSED: 'Bác khiếu nại',
    PARTIAL: 'Chấp nhận một phần',
};

const checkinStatusLabel: Record<CheckinStatus, string> = {
    SUCCESS: 'Thành công',
    LATE: 'Đi muộn',
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

const AdminComplaints: React.FC<AdminComplaintsProps> = ({ organizerId }) => {
    const { showToast } = useToastActions();
    const [items, setItems] = useState<ComplaintItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<ComplaintItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState({ submitted: 0, underReview: 0, resolved: 0, closed: 0 });
    const [statusFilter, setStatusFilter] = useState<'' | ComplaintStatus>('');
    const [categoryFilter, setCategoryFilter] = useState<'' | ComplaintCategory>('');
    const [priorityFilter, setPriorityFilter] = useState<'' | ComplaintPriority>('');
    const [reviewStatus, setReviewStatus] = useState<Exclude<ComplaintStatus, 'SUBMITTED'>>('UNDER_REVIEW');
    const [reviewResolution, setReviewResolution] = useState<ComplaintResolution>('UPHELD');
    const [reviewNote, setReviewNote] = useState('');
    const [enableCheckinAdjustment, setEnableCheckinAdjustment] = useState(false);
    const [adjustCheckinStatus, setAdjustCheckinStatus] = useState<CheckinStatus>('SUCCESS');
    const [trainingScoreDelta, setTrainingScoreDelta] = useState<number>(0);
    const [reviewing, setReviewing] = useState(false);

    const isOrganizerScoped = Boolean(organizerId);

    const loadDashboard = useCallback(async () => {
        try {
            const data = organizerId
                ? await complaintService.getOrganizerDashboard(organizerId)
                : await complaintService.getAdminDashboard();
            setDashboard(data);
        } catch {
            setDashboard({ submitted: 0, underReview: 0, resolved: 0, closed: 0 });
        }
    }, [organizerId]);

    const loadList = useCallback(async () => {
        setLoading(true);
        try {
            const response = organizerId
                ? await complaintService.listOrganizer(organizerId, {
                    status: statusFilter || undefined,
                    category: categoryFilter || undefined,
                    priority: priorityFilter || undefined,
                    limit: 100,
                })
                : await complaintService.listAdmin({
                    status: statusFilter || undefined,
                    category: categoryFilter || undefined,
                    priority: priorityFilter || undefined,
                    limit: 100,
                });

            setItems(response.items || []);
            const nextId = response.items?.find((item) => item.id === selectedId)?.id
                || response.items?.[0]?.id
                || null;
            setSelectedId(nextId);
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Tải danh sách thất bại',
                message: error?.response?.data?.message || 'Không thể tải danh sách khiếu nại.',
            });
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, organizerId, priorityFilter, selectedId, showToast, statusFilter]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    useEffect(() => {
        let ignore = false;

        const loadDetail = async () => {
            if (!selectedId) {
                setSelectedDetail(null);
                return;
            }

            try {
                const detail = organizerId
                    ? await complaintService.getOrganizerById(organizerId, selectedId)
                    : await complaintService.getAdminById(selectedId);

                if (ignore) {
                    return;
                }

                setSelectedDetail(detail);
                setReviewStatus(detail.status === 'SUBMITTED' ? 'UNDER_REVIEW' : detail.status);
                setReviewResolution(detail.resolution || 'UPHELD');
                setReviewNote(detail.reviewNote || '');
                setEnableCheckinAdjustment(false);
                setAdjustCheckinStatus('SUCCESS');
                setTrainingScoreDelta(0);
            } catch (error: any) {
                if (ignore) {
                    return;
                }

                setSelectedDetail(null);
                showToast({
                    type: 'error',
                    title: 'Tải chi tiết thất bại',
                    message: error?.response?.data?.message || 'Không thể tải chi tiết khiếu nại.',
                });
            }
        };

        void loadDetail();
        return () => {
            ignore = true;
        };
    }, [organizerId, selectedId, showToast]);

    const handleReview = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedDetail) {
            return;
        }

        if (!reviewNote.trim()) {
            showToast({
                type: 'error',
                title: 'Thiếu ghi chú',
                message: 'Vui lòng nhập ghi chú xử lý khiếu nại.',
            });
            return;
        }

        setReviewing(true);
        try {
            const reviewPayload = {
                status: reviewStatus,
                resolution: reviewStatus === 'RESOLVED' || reviewStatus === 'CLOSED' ? reviewResolution : undefined,
                reviewNote: reviewNote.trim(),
                ...(enableCheckinAdjustment && selectedDetail.category === 'CHECKIN'
                    ? {
                        checkinAdjustment: {
                            status: adjustCheckinStatus,
                            trainingScoreDelta,
                            reason: reviewNote.trim(),
                        },
                    }
                    : {}),
            };

            if (organizerId) {
                await complaintService.reviewOrganizer(organizerId, selectedDetail.id, reviewPayload);
            } else {
                await complaintService.review(selectedDetail.id, reviewPayload);
            }

            showToast({
                type: 'success',
                title: 'Xử lý thành công',
                message: 'Trạng thái khiếu nại đã được cập nhật.',
            });

            await Promise.all([loadList(), loadDashboard()]);

            const refreshed = organizerId
                ? await complaintService.getOrganizerById(organizerId, selectedDetail.id)
                : await complaintService.getAdminById(selectedDetail.id);
            setSelectedDetail(refreshed);
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Xử lý thất bại',
                message: error?.response?.data?.message || 'Không thể cập nhật trạng thái khiếu nại.',
            });
        } finally {
            setReviewing(false);
        }
    };

    const selectedAttachments = useMemo(() => selectedDetail?.attachmentUrls || [], [selectedDetail]);

    const dashboardLabel = isOrganizerScoped ? 'Khiếu nại của tổ chức' : 'Quản trị khiếu nại';

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroCopy}>
                    <p className={styles.eyebrow}>{isOrganizerScoped ? 'Organizer complaints' : 'Complaint admin'}</p>
                    <h2>{dashboardLabel}</h2>
                    <p className={styles.heroDescription}>
                        {isOrganizerScoped
                            ? 'Lọc, theo dõi và xử lý khiếu nại trong phạm vi tổ chức này.'
                            : 'Lọc, theo dõi và xử lý khiếu nại trực tiếp từ dashboard.'}
                    </p>
                    <div className={styles.heroMeta}>
                        <span className={styles.heroChip}>Mới gửi {dashboard.submitted}</span>
                        <span className={styles.heroChip}>Đang xử lý {dashboard.underReview}</span>
                        <span className={styles.heroChip}>Đã xử lý {dashboard.resolved}</span>
                    </div>
                </div>

                <div className={styles.heroActions}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => {
                            void Promise.all([loadList(), loadDashboard()]);
                        }}
                    >
                        Tải lại
                    </button>
                </div>
            </section>

            <div className={styles.statsRow}>
                <div className={styles.statCard}><div className={styles.label}>Mới gửi</div><div className={styles.value}>{dashboard.submitted}</div></div>
                <div className={styles.statCard}><div className={styles.label}>Đang xử lý</div><div className={styles.value}>{dashboard.underReview}</div></div>
                <div className={styles.statCard}><div className={styles.label}>Đã xử lý</div><div className={styles.value}>{dashboard.resolved}</div></div>
                <div className={styles.statCard}><div className={styles.label}>Đã đóng</div><div className={styles.value}>{dashboard.closed}</div></div>
            </div>

            <div className={styles.layout}>
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.sectionLabel}>Điều phối</p>
                            <h3>{isOrganizerScoped ? 'Khiếu nại của tổ chức' : 'Danh sách khiếu nại'}</h3>
                        </div>
                        <span className={styles.panelHint}>{items.length} mục</span>
                    </div>

                    <div className={styles.toolbar}>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as '' | ComplaintStatus)}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="SUBMITTED">Mới gửi</option>
                            <option value="UNDER_REVIEW">Đang xử lý</option>
                            <option value="RESOLVED">Đã xử lý</option>
                            <option value="CLOSED">Đã đóng</option>
                        </select>
                        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as '' | ComplaintCategory)}>
                            <option value="">Tất cả loại</option>
                            <option value="ACTIVITY">Activity</option>
                            <option value="CHECKIN">Checkin</option>
                        </select>
                        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as '' | ComplaintPriority)}>
                            <option value="">Tất cả ưu tiên</option>
                            <option value="NORMAL">Thường</option>
                            <option value="HIGH">Cao</option>
                            <option value="URGENT">Khẩn cấp</option>
                        </select>
                    </div>

                    <div className={styles.list}>
                        {loading && <div className={styles.empty}>Đang tải dữ liệu...</div>}

                        {!loading && items.length === 0 && (
                            <div className={styles.empty}>Không có khiếu nại phù hợp bộ lọc hiện tại.</div>
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
                                    <span className={`${styles.badge} ${item.status === 'SUBMITTED'
                                        ? styles.statusSubmitted
                                        : item.status === 'UNDER_REVIEW'
                                            ? styles.statusUnderReview
                                            : item.status === 'RESOLVED'
                                                ? styles.statusResolved
                                                : styles.statusClosed
                                        }`}
                                    >
                                        {statusLabel[item.status]}
                                    </span>
                                    <span className={`${styles.badge} ${item.priority === 'NORMAL'
                                        ? styles.priorityNormal
                                        : item.priority === 'HIGH'
                                            ? styles.priorityHigh
                                            : styles.priorityUrgent
                                        }`}
                                    >
                                        {priorityLabel[item.priority]}
                                    </span>
                                </div>
                                <h4>{item.title}</h4>
                                <p>{item.targetEntityName}</p>
                                <p>{item.complainantName || item.complainantId}</p>
                                <p>{formatDate(item.createdAt)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.sectionLabel}>Xử lý</p>
                            <h3>Chi tiết khiếu nại</h3>
                        </div>
                        <span className={styles.panelHint}>Review panel</span>
                    </div>

                    {!selectedDetail && <div className={styles.empty}>Chọn một khiếu nại để xử lý.</div>}

                    {selectedDetail && (
                        <div className={styles.detail}>
                            <div className={styles.detailTitleRow}>
                                <h3>{selectedDetail.title}</h3>
                                <div className={styles.badgeRow}>
                                    <span className={`${styles.badge} ${selectedDetail.status === 'SUBMITTED'
                                        ? styles.statusSubmitted
                                        : selectedDetail.status === 'UNDER_REVIEW'
                                            ? styles.statusUnderReview
                                            : selectedDetail.status === 'RESOLVED'
                                                ? styles.statusResolved
                                                : styles.statusClosed
                                        }`}
                                    >
                                        {statusLabel[selectedDetail.status]}
                                    </span>
                                    <span className={`${styles.badge} ${selectedDetail.priority === 'NORMAL'
                                        ? styles.priorityNormal
                                        : selectedDetail.priority === 'HIGH'
                                            ? styles.priorityHigh
                                            : styles.priorityUrgent
                                        }`}
                                    >
                                        {priorityLabel[selectedDetail.priority]}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.detailMeta}>
                                <div><strong>Người gửi:</strong> {selectedDetail.complainantName || selectedDetail.complainantId}</div>
                                <div><strong>Loại:</strong> {selectedDetail.category}</div>
                                <div><strong>Đối tượng:</strong> {selectedDetail.targetEntityName}</div>
                                <div><strong>Tạo lúc:</strong> {formatDate(selectedDetail.createdAt)}</div>
                            </div>

                            <div className={styles.detailText}>{selectedDetail.description}</div>

                            {selectedAttachments.length > 0 && (
                                <div className={styles.attachmentList}>
                                    {selectedAttachments.map((url, index) => {
                                        const src = resolveImageSrc(url) || url;
                                        return (
                                            <div className={styles.attachmentItem} key={`${url}-${index}`}>
                                                <img src={src} alt={`attachment-${index + 1}`} />
                                                <a href={src} target="_blank" rel="noreferrer">{src}</a>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <form className={styles.reviewPanel} onSubmit={handleReview}>
                                <div className={styles.panelHeaderInner}>
                                    <h4>Xử lý khiếu nại</h4>
                                    <span className={styles.panelHint}>Chọn trạng thái và ghi chú</span>
                                </div>

                                <div className={styles.formGrid}>
                                    <label>
                                        Trạng thái mới
                                        <select
                                            value={reviewStatus}
                                            onChange={(event) => setReviewStatus(event.target.value as Exclude<ComplaintStatus, 'SUBMITTED'>)}
                                        >
                                            <option value="UNDER_REVIEW">Đang xử lý</option>
                                            <option value="RESOLVED">Đã xử lý</option>
                                            <option value="CLOSED">Đã đóng</option>
                                        </select>
                                    </label>

                                    {(reviewStatus === 'RESOLVED' || reviewStatus === 'CLOSED') && (
                                        <label>
                                            Kết quả xử lý
                                            <select
                                                value={reviewResolution}
                                                onChange={(event) => setReviewResolution(event.target.value as ComplaintResolution)}
                                            >
                                                <option value="UPHELD">{resolutionLabel.UPHELD}</option>
                                                <option value="DISMISSED">{resolutionLabel.DISMISSED}</option>
                                                <option value="PARTIAL">{resolutionLabel.PARTIAL}</option>
                                            </select>
                                        </label>
                                    )}

                                    <label>
                                        Ghi chú xử lý
                                        <textarea
                                            value={reviewNote}
                                            onChange={(event) => setReviewNote(event.target.value)}
                                            placeholder="Nhập ghi chú phản hồi cho người khiếu nại"
                                        />
                                    </label>

                                    {selectedDetail.category === 'CHECKIN' && (
                                        <label>
                                            <span>
                                                <input
                                                    type="checkbox"
                                                    checked={enableCheckinAdjustment}
                                                    onChange={(event) => setEnableCheckinAdjustment(event.target.checked)}
                                                />
                                                {' '}Điều chỉnh checkin + delta điểm
                                            </span>
                                        </label>
                                    )}

                                    {selectedDetail.category === 'CHECKIN' && enableCheckinAdjustment && (
                                        <>
                                            <label>
                                                Trạng thái checkin mới
                                                <select
                                                    value={adjustCheckinStatus}
                                                    onChange={(event) => setAdjustCheckinStatus(event.target.value as CheckinStatus)}
                                                >
                                                    <option value="SUCCESS">{checkinStatusLabel.SUCCESS}</option>
                                                    <option value="LATE">{checkinStatusLabel.LATE}</option>
                                                    <option value="FAILED">{checkinStatusLabel.FAILED}</option>
                                                </select>
                                            </label>

                                            <label>
                                                Delta điểm rèn luyện
                                                <input
                                                    type="number"
                                                    value={trainingScoreDelta}
                                                    onChange={(event) => setTrainingScoreDelta(Number(event.target.value || 0))}
                                                    placeholder="Ví dụ: -2 hoặc 3"
                                                />
                                            </label>
                                        </>
                                    )}
                                </div>

                                <div className={styles.actionsRow}>
                                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={reviewing}>
                                        {reviewing ? 'Đang cập nhật...' : 'Cập nhật xử lý'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default AdminComplaints;
