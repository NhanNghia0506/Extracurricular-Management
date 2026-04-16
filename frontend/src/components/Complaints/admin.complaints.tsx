import React, { useCallback, useEffect, useMemo, useState } from 'react';
import complaintService from '../../services/complaint.service';
import {
    ComplaintItem,
    ComplaintResponseItem,
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

const resolutionLabel: Record<ComplaintResolution, string> = {
    UPHELD: 'Chấp nhận khiếu nại',
    DISMISSED: 'Bác bỏ khiếu nại',
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
    const [reviewStatus, setReviewStatus] = useState<Exclude<ComplaintStatus, 'SUBMITTED'>>('UNDER_REVIEW');
    const [reviewResolution, setReviewResolution] = useState<ComplaintResolution>('UPHELD');
    const [reviewNote, setReviewNote] = useState('');
    const [reviewing, setReviewing] = useState(false);
    const [responses, setResponses] = useState<ComplaintResponseItem[]>([]);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const [sendingResponse, setSendingResponse] = useState(false);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [evidenceModalImages, setEvidenceModalImages] = useState<Array<{ id: string; fileName: string; fileUrl: string }>>([]);

    const normalizedOrganizerId = organizerId?.trim() || '';

    const isOrganizerScoped = Boolean(normalizedOrganizerId);

    const loadDashboard = useCallback(async () => {
        if (!normalizedOrganizerId) {
            setDashboard({ submitted: 0, underReview: 0, resolved: 0, closed: 0 });
            return;
        }

        try {
            const data = await complaintService.getOrganizerDashboard(normalizedOrganizerId);
            setDashboard(data);
        } catch {
            setDashboard({ submitted: 0, underReview: 0, resolved: 0, closed: 0 });
        }
    }, [normalizedOrganizerId]);

    const loadList = useCallback(async () => {
        if (!normalizedOrganizerId) {
            setItems([]);
            setSelectedId(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await complaintService.listOrganizer(normalizedOrganizerId, {
                status: statusFilter || undefined,
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
    }, [normalizedOrganizerId, selectedId, showToast, statusFilter]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    useEffect(() => {
        if (!normalizedOrganizerId) {
            return;
        }

        let ignore = false;

        const loadDetail = async () => {
            if (!selectedId) {
                setSelectedDetail(null);
                return;
            }

            try {
                const detail = await complaintService.getOrganizerById(normalizedOrganizerId, selectedId);

                if (ignore) {
                    return;
                }

                setSelectedDetail(detail);
                setReviewStatus(detail.status === 'SUBMITTED' ? 'UNDER_REVIEW' : detail.status);
                setReviewResolution(detail.resolution || 'UPHELD');
                setReviewNote(detail.reviewNote || '');
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
    }, [normalizedOrganizerId, selectedId, showToast]);

    useEffect(() => {
        if (!normalizedOrganizerId || !selectedId) {
            setResponses([]);
            return;
        }

        let ignore = false;

        const loadResponses = async () => {
            setLoadingResponses(true);

            try {
                const response = await complaintService.listOrganizerResponses(normalizedOrganizerId, selectedId);

                if (!ignore) {
                    setResponses(response || []);
                }
            } catch (error: any) {
                if (!ignore) {
                    setResponses([]);
                    showToast({
                        type: 'error',
                        title: 'Tải phản hồi thất bại',
                        message: error?.response?.data?.message || 'Không thể tải danh sách phản hồi của khiếu nại này.',
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
    }, [normalizedOrganizerId, selectedId, showToast]);

    useEffect(() => {
        if (!selectedDetail) {
            setIsResponseModalOpen(false);
        }
    }, [selectedDetail]);

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
            };

            if (!normalizedOrganizerId) {
                throw new Error('Thiếu organizerId để xử lý khiếu nại theo tổ chức');
            }

            await complaintService.reviewOrganizer(normalizedOrganizerId, selectedDetail.id, reviewPayload);

            showToast({
                type: 'success',
                title: 'Xử lý thành công',
                message: 'Trạng thái khiếu nại đã được cập nhật.',
            });

            await Promise.all([loadList(), loadDashboard()]);

            const refreshed = await complaintService.getOrganizerById(normalizedOrganizerId, selectedDetail.id);
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

    const handleSendResponse = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedDetail || !normalizedOrganizerId) {
            return;
        }

        if (!responseMessage.trim()) {
            showToast({
                type: 'error',
                title: 'Thiếu nội dung phản hồi',
                message: 'Vui lòng nhập nội dung phản hồi trước khi gửi.',
            });
            return;
        }

        setSendingResponse(true);

        try {
            await complaintService.addOrganizerResponse(normalizedOrganizerId, selectedDetail.id, {
                message: responseMessage.trim(),
            });

            showToast({
                type: 'success',
                title: 'Gửi phản hồi thành công',
                message: 'Phản hồi đã được gửi cho người khiếu nại.',
            });

            setResponseMessage('');

            const refreshedResponses = await complaintService.listOrganizerResponses(normalizedOrganizerId, selectedDetail.id);
            setResponses(refreshedResponses || []);
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Gửi phản hồi thất bại',
                message: error?.response?.data?.message || 'Không thể gửi phản hồi cho khiếu nại này.',
            });
        } finally {
            setSendingResponse(false);
        }
    };

    const openResponseModal = () => {
        if (!selectedDetail) {
            return;
        }

        setIsResponseModalOpen(true);
    };

    const closeResponseModal = () => {
        if (sendingResponse) {
            return;
        }

        setIsResponseModalOpen(false);
    };

    const openEvidenceModal = (response: ComplaintResponseItem) => {
        const images = (response.attachments || []).map((attachment) => ({
            id: attachment.id,
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
        }));
        setEvidenceModalImages(images);
    };

    const closeEvidenceModal = () => {
        setEvidenceModalImages([]);
    };

    const selectedAttachments = useMemo(() => selectedDetail?.attachmentUrls || [], [selectedDetail]);
    const hasActiveFilters = Boolean(statusFilter);
    const activeFilterCount = [statusFilter].filter(Boolean).length;

    const dashboardLabel = 'Khiếu nại của tổ chức';

    if (!isOrganizerScoped) {
        return (
            <div className={styles.page}>
                <section className={styles.hero}>
                    <div className={styles.heroCopy}>
                        <p className={styles.eyebrow}>Organizer complaints</p>
                        <h2>Khiếu nại của tổ chức</h2>
                        <p className={styles.heroDescription}>
                            Thiếu organizerId. Chỉ MANAGER của tổ chức mới được xử lý khiếu nại trong phạm vi tổ chức của mình.
                        </p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroCopy}>
                    <p className={styles.eyebrow}>Organizer complaints</p>
                    <h2>{dashboardLabel}</h2>
                    <p className={styles.heroDescription}>
                        Lọc, theo dõi và xử lý khiếu nại trong phạm vi tổ chức này.
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
                            <h3>Khiếu nại của tổ chức</h3>
                        </div>
                        <span className={styles.panelHint}>{items.length} mục</span>
                    </div>

                    <div className={styles.filterPanel}>
                        <div className={styles.filterPanelHeader}>
                            <div>
                                <p className={styles.filterEyebrow}>Bộ lọc nâng cao</p>
                                <h4>Lọc nhanh khiếu nại</h4>
                            </div>
                            <button
                                type="button"
                                className={styles.filterResetBtn}
                                disabled={!hasActiveFilters}
                                onClick={() => {
                                    setStatusFilter('');
                                }}
                            >
                                Xóa lọc
                                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                            </button>
                        </div>

                        <div className={styles.filterGrid}>
                            <label className={styles.filterControl}>
                                <span>Trạng thái</span>
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as '' | ComplaintStatus)}>
                                    <option value="">Tất cả</option>
                                    <option value="SUBMITTED">Mới gửi</option>
                                    <option value="UNDER_REVIEW">Đang xử lý</option>
                                    <option value="RESOLVED">Đã xử lý</option>
                                    <option value="CLOSED">Đã đóng</option>
                                </select>
                            </label>
                        </div>

                        <div className={styles.filterPills}>
                            <button
                                type="button"
                                className={`${styles.filterPill} ${statusFilter === '' ? styles.filterPillActive : ''}`}
                                onClick={() => setStatusFilter('')}
                            >
                                Tất cả ({items.length})
                            </button>
                            <button
                                type="button"
                                className={`${styles.filterPill} ${statusFilter === 'SUBMITTED' ? styles.filterPillActive : ''}`}
                                onClick={() => setStatusFilter('SUBMITTED')}
                            >
                                Mới gửi ({dashboard.submitted})
                            </button>
                            <button
                                type="button"
                                className={`${styles.filterPill} ${statusFilter === 'UNDER_REVIEW' ? styles.filterPillActive : ''}`}
                                onClick={() => setStatusFilter('UNDER_REVIEW')}
                            >
                                Đang xử lý ({dashboard.underReview})
                            </button>
                            <button
                                type="button"
                                className={`${styles.filterPill} ${statusFilter === 'RESOLVED' ? styles.filterPillActive : ''}`}
                                onClick={() => setStatusFilter('RESOLVED')}
                            >
                                Đã xử lý ({dashboard.resolved})
                            </button>
                            <button
                                type="button"
                                className={`${styles.filterPill} ${statusFilter === 'CLOSED' ? styles.filterPillActive : ''}`}
                                onClick={() => setStatusFilter('CLOSED')}
                            >
                                Đã đóng ({dashboard.closed})
                            </button>
                        </div>
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
                                </div>
                                <div className={styles.listItemTop}>
                                    <h4>{item.title}</h4>
                                    <span className={styles.listItemDate}>{formatDate(item.createdAt)}</span>
                                </div>
                                <div className={styles.listItemMeta}>
                                    <p><strong>Đối tượng:</strong> {item.targetEntityName}</p>
                                    <p><strong>Người gửi:</strong> {item.complainantName || item.complainantId}</p>
                                </div>
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
                                </div>
                            </div>

                            <div className={styles.detailMeta}>
                                <div><strong>Người gửi:</strong> {selectedDetail.complainantName || selectedDetail.complainantId}</div>
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

                            <div className={styles.responseSectionHeaderRow}>
                                <div className={styles.responseSectionSummary}>
                                    <p className={styles.responseEyebrow}>Trao đổi</p>
                                    <h4>Phản hồi</h4>
                                    <span>{responses.length} phản hồi đã ghi nhận</span>
                                </div>

                                <button
                                    type="button"
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={openResponseModal}
                                >
                                    Phản hồi
                                </button>
                            </div>

                            <div className={styles.responseListWrap}>
                                {loadingResponses && <div className={styles.empty}>Đang tải phản hồi...</div>}

                                {!loadingResponses && responses.length === 0 && (
                                    <div className={styles.empty}>Chưa có phản hồi nào cho khiếu nại này.</div>
                                )}

                                {!loadingResponses && responses.length > 0 && (
                                    <div className={styles.responseList}>
                                        {responses.map((response) => (
                                            <article key={response.id} className={styles.responseItem}>
                                                <div className={styles.responseItemHeader}>
                                                    <div>
                                                        <strong>{response.senderName || response.senderId}</strong>
                                                        <span>{formatDate(response.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <p>{response.message}</p>
                                                {response.attachments.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className={styles.evidenceButton}
                                                        onClick={() => openEvidenceModal(response)}
                                                    >
                                                        Xem minh chứng ({response.attachments.length})
                                                    </button>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>

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
                                            </select>
                                        </label>
                                    )}

                                    <label>
                                        Ghi chú xử lý
                                        <textarea
                                            value={reviewNote}
                                            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setReviewNote(event.target.value)}
                                            placeholder="Nhập ghi chú phản hồi cho người khiếu nại"
                                        />
                                    </label>
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

            {isResponseModalOpen && selectedDetail && (
                <div className={styles.modalBackdrop} role="presentation" onClick={closeResponseModal}>
                    <div
                        className={styles.modalCard}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="manager-response-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <p className={styles.filterEyebrow}>Phản hồi</p>
                                <h3 id="manager-response-title">Gửi phản hồi cho khiếu nại</h3>
                                <p className={styles.modalSubtitle}>{selectedDetail.title}</p>
                            </div>
                            <button type="button" className={styles.modalCloseBtn} onClick={closeResponseModal}>×</button>
                        </div>

                        <form className={styles.modalBody} onSubmit={handleSendResponse}>
                            <label className={styles.responseComposerLabel}>
                                Nội dung phản hồi
                                <textarea
                                    value={responseMessage}
                                    onChange={(event) => setResponseMessage(event.target.value)}
                                    placeholder="Nhập phản hồi gửi cho sinh viên"
                                />
                            </label>

                            <div className={styles.modalActions}>
                                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeResponseModal}>
                                    Hủy
                                </button>
                                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={sendingResponse}>
                                    {sendingResponse ? 'Đang gửi...' : 'Gửi phản hồi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {evidenceModalImages.length > 0 && (
                <div className={styles.modalBackdrop} role="presentation" onClick={closeEvidenceModal}>
                    <div
                        className={styles.modalCard}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="response-evidence-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <p className={styles.filterEyebrow}>Minh chứng phản hồi</p>
                                <h3 id="response-evidence-title">Hình ảnh minh chứng</h3>
                                <p className={styles.modalSubtitle}>{evidenceModalImages.length} tệp</p>
                            </div>
                            <button type="button" className={styles.modalCloseBtn} onClick={closeEvidenceModal}>×</button>
                        </div>

                        <div className={styles.evidenceGrid}>
                            {evidenceModalImages.map((item) => {
                                const src = resolveImageSrc(item.fileUrl) || item.fileUrl;
                                return (
                                    <a
                                        key={item.id}
                                        className={styles.responseAttachmentItem}
                                        href={src}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <img src={src} alt={item.fileName} />
                                        <span>{item.fileName}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminComplaints;
