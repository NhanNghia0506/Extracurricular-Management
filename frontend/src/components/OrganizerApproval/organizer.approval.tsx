import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import styles from './organizer.approval.module.scss';
import OrganizerApprovalDetail from './organizer.approval.detail';
import OrganizerApprovalSidebar from './organizer.approval.sidebar';
import OrganizerApprovalStats from './organizer.approval.stats';
import { useToastActions } from '../../contexts/ToastContext';
import organizerService from '../../services/organizer.service';
import { OrganizerApprovalStatsResponse } from '@/types/organizer.types';
import {
    ApprovalOrganizer,
    OrganizerApprovalDecision,
    OrganizerApprovalState,
    buildOrganizerApprovalMetrics,
    mapOrganizerApprovalDetailToView,
    mapOrganizerApprovalListItemToView,
} from './organizer.approval.types';

const EMPTY_STATS: OrganizerApprovalStatsResponse = {
    pending: 0,
    approved: 0,
    needsEdit: 0,
    rejected: 0,
    overdue: 0,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        return (error.response?.data as { message?: string } | undefined)?.message || fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
};

const OrganizerApproval: React.FC = () => {
    const { showToast } = useToastActions();
    const [activeTab, setActiveTab] = useState<OrganizerApprovalState>('pending');
    const [organizers, setOrganizers] = useState<ApprovalOrganizer[]>([]);
    const [stats, setStats] = useState<OrganizerApprovalStatsResponse>(EMPTY_STATS);
    const [selectedOrganizerId, setSelectedOrganizerId] = useState<string | null>(null);
    const [selectedOrganizer, setSelectedOrganizer] = useState<ApprovalOrganizer | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [isPriority, setIsPriority] = useState(false);
    const [notifyOrganizer, setNotifyOrganizer] = useState(true);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const metrics = useMemo(() => buildOrganizerApprovalMetrics(stats), [stats]);

    const tabCounts = useMemo(
        () => ({
            pending: stats.pending,
            needsEdit: stats.needsEdit,
            approved: stats.approved,
        }),
        [stats],
    );

    const filteredOrganizers = useMemo(
        () => organizers.filter((organizer) => organizer.approvalState === activeTab),
        [organizers, activeTab],
    );

    const loadDashboard = useCallback(async () => {
        setIsLoadingDashboard(true);
        setLoadError(null);

        try {
            const response = await organizerService.approvalDashboard();
            const dashboard = response.data.data;
            setOrganizers(dashboard.items.map(mapOrganizerApprovalListItemToView).filter((item): item is ApprovalOrganizer => item !== null));
            setStats(dashboard.stats);
        } catch (error) {
            const message = getErrorMessage(error, 'Không thể tải danh sách ban tổ chức chờ duyệt.');
            setLoadError(message);
            showToast({
                type: 'error',
                title: 'Tải dữ liệu thất bại',
                message,
            });
        } finally {
            setIsLoadingDashboard(false);
        }
    }, [showToast]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        const nextSelectedId = filteredOrganizers.find((organizer) => organizer.id === selectedOrganizerId)?.id
            ?? filteredOrganizers[0]?.id
            ?? null;

        if (nextSelectedId !== selectedOrganizerId) {
            setSelectedOrganizerId(nextSelectedId);
        }

        if (!nextSelectedId) {
            setSelectedOrganizer(null);
            setReviewNote('');
            setIsPriority(false);
            setNotifyOrganizer(true);
        }
    }, [filteredOrganizers, selectedOrganizerId]);

    useEffect(() => {
        let ignore = false;

        const loadDetail = async () => {
            if (!selectedOrganizerId) {
                return;
            }

            setIsLoadingDetail(true);

            try {
                const response = await organizerService.approvalDetail(selectedOrganizerId);
                const detail = mapOrganizerApprovalDetailToView(response.data.data);

                if (ignore || !detail) {
                    return;
                }

                setSelectedOrganizer(detail);
                setReviewNote(detail.reviewNote);
                setIsPriority(detail.isPriority);
                setNotifyOrganizer(detail.notifyOrganizer);
            } catch (error) {
                if (ignore) {
                    return;
                }

                const message = getErrorMessage(error, 'Không thể tải chi tiết ban tổ chức.');
                setSelectedOrganizer(null);
                showToast({
                    type: 'error',
                    title: 'Tải chi tiết thất bại',
                    message,
                });
            } finally {
                if (!ignore) {
                    setIsLoadingDetail(false);
                }
            }
        };

        void loadDetail();

        return () => {
            ignore = true;
        };
    }, [selectedOrganizerId, showToast]);

    const handleReview = useCallback(async (decision: OrganizerApprovalDecision) => {
        if (!selectedOrganizerId) {
            return;
        }

        if (decision !== 'APPROVED' && !reviewNote.trim()) {
            showToast({
                type: 'error',
                title: 'Thiếu ghi chú',
                message: 'Bạn cần nhập ghi chú khi từ chối hoặc yêu cầu bổ sung.',
            });
            return;
        }

        setIsSubmittingReview(true);

        try {
            await organizerService.reviewApproval(selectedOrganizerId, {
                approvalStatus: decision,
                reviewNote: reviewNote.trim() || undefined,
                isPriority,
                notifyOrganizer,
            });

            await loadDashboard();

            showToast({
                type: 'success',
                title: 'Cập nhật thành công',
                message: decision === 'APPROVED'
                    ? 'Ban tổ chức đã được phê duyệt.'
                    : decision === 'NEEDS_EDIT'
                        ? 'Đã gửi yêu cầu bổ sung thông tin cho ban tổ chức.'
                        : 'Ban tổ chức đã bị từ chối.',
            });
        } catch (error) {
            showToast({
                type: 'error',
                title: 'Cập nhật thất bại',
                message: getErrorMessage(error, 'Không thể cập nhật trạng thái duyệt ban tổ chức.'),
            });
        } finally {
            setIsSubmittingReview(false);
        }
    }, [isPriority, loadDashboard, notifyOrganizer, reviewNote, selectedOrganizerId, showToast]);

    return (
        <div className={styles.container}>
            <OrganizerApprovalStats metrics={metrics} />

            {loadError && !isLoadingDashboard && <div className={styles.errorState}>{loadError}</div>}

            <div className={styles.mainLayout}>
                <OrganizerApprovalSidebar
                    organizers={filteredOrganizers}
                    selectedOrganizerId={selectedOrganizerId}
                    activeTab={activeTab}
                    tabCounts={tabCounts}
                    onTabChange={setActiveTab}
                    onSelectOrganizer={setSelectedOrganizerId}
                />
                <OrganizerApprovalDetail
                    organizer={selectedOrganizer}
                    loading={isLoadingDashboard || isLoadingDetail}
                    submitting={isSubmittingReview}
                    reviewNote={reviewNote}
                    isPriority={isPriority}
                    notifyOrganizer={notifyOrganizer}
                    onReviewNoteChange={setReviewNote}
                    onPriorityChange={setIsPriority}
                    onNotifyOrganizerChange={setNotifyOrganizer}
                    onApprove={() => void handleReview('APPROVED')}
                    onRequestEdit={() => void handleReview('NEEDS_EDIT')}
                    onReject={() => void handleReview('REJECTED')}
                />
            </div>
        </div>
    );
};

export default OrganizerApproval;