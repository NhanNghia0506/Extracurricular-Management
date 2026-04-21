import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import styles from './activity.approval.module.scss';
import ActivityApprovalDetail from './activity.approval.detail';
import ActivityApprovalSidebar from './activity.approval.sidebar';
import ActivityApprovalStats from './activity.approval.stats';
import { useToastActions } from '../../contexts/ToastContext';
import activityService from '../../services/activity.service';
import { ActivityApprovalStatsResponse } from '@/types/activity.types';
import {
    ApprovalActivity,
    ApprovalDecision,
    ApprovalState,
    buildApprovalMetrics,
    mapApprovalDetailToView,
    mapApprovalListItemToView,
} from './activity.approval.types';

const EMPTY_STATS: ActivityApprovalStatsResponse = {
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

const ActivityApproval: React.FC = () => {
    const { showToast } = useToastActions();
    const [activeTab, setActiveTab] = useState<ApprovalState>('pending');
    const [activities, setActivities] = useState<ApprovalActivity[]>([]);
    const [stats, setStats] = useState<ActivityApprovalStatsResponse>(EMPTY_STATS);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<ApprovalActivity | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [isPriority, setIsPriority] = useState(false);
    const [notifyOrganizer, setNotifyOrganizer] = useState(true);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const metrics = useMemo(() => buildApprovalMetrics(stats), [stats]);

    const tabCounts = useMemo(
        () => ({
            pending: stats.pending,
            needsEdit: stats.needsEdit,
            approved: stats.approved,
            rejected: stats.rejected,
        }),
        [stats],
    );

    const filteredActivities = useMemo(
        () => activities.filter((activity) => activity.approvalState === activeTab),
        [activities, activeTab],
    );

    const loadDashboard = useCallback(async () => {
        setIsLoadingDashboard(true);
        setLoadError(null);

        try {
            const response = await activityService.approvalDashboard();
            const dashboard = response.data.data;
            setActivities(dashboard.items.map(mapApprovalListItemToView).filter((item): item is ApprovalActivity => item !== null));
            setStats(dashboard.stats);
        } catch (error) {
            const message = getErrorMessage(error, 'Không thể tải danh sách hoạt động chờ duyệt.');
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
        const nextSelectedId = filteredActivities.find((activity) => activity.id === selectedActivityId)?.id
            ?? filteredActivities[0]?.id
            ?? null;

        if (nextSelectedId !== selectedActivityId) {
            setSelectedActivityId(nextSelectedId);
        }

        if (!nextSelectedId) {
            setSelectedActivity(null);
            setReviewNote('');
            setIsPriority(false);
            setNotifyOrganizer(true);
        }
    }, [filteredActivities, selectedActivityId]);

    useEffect(() => {
        let ignore = false;

        const loadDetail = async () => {
            if (!selectedActivityId) {
                return;
            }

            setIsLoadingDetail(true);

            try {
                const response = await activityService.approvalDetail(selectedActivityId);
                const detail = mapApprovalDetailToView(response.data.data);

                if (ignore || !detail) {
                    return;
                }

                setSelectedActivity(detail);
                setReviewNote(detail.reviewNote);
                setIsPriority(detail.isPriority);
                setNotifyOrganizer(detail.notifyOrganizer);
            } catch (error) {
                if (ignore) {
                    return;
                }

                const message = getErrorMessage(error, 'Không thể tải chi tiết hoạt động.');
                setSelectedActivity(null);
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
    }, [selectedActivityId, showToast]);

    const handleTabChange = useCallback((tab: ApprovalState) => {
        setActiveTab(tab);
    }, []);

    const handleSelectActivity = useCallback((activityId: string) => {
        setSelectedActivityId(activityId);
    }, []);

    const handleReview = useCallback(async (decision: ApprovalDecision) => {
        if (!selectedActivityId) {
            return;
        }

        if (decision !== 'APPROVED' && !reviewNote.trim()) {
            showToast({
                type: 'error',
                title: 'Thiếu ghi chú',
                message: 'Bạn cần nhập ghi chú khi từ chối hoặc yêu cầu chỉnh sửa.',
            });
            return;
        }

        setIsSubmittingReview(true);

        try {
            await activityService.reviewApproval(selectedActivityId, {
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
                    ? 'Hoạt động đã được phê duyệt.'
                    : decision === 'NEEDS_EDIT'
                        ? 'Đã gửi yêu cầu chỉnh sửa cho hoạt động.'
                        : 'Hoạt động đã bị từ chối.',
            });
        } catch (error) {
            showToast({
                type: 'error',
                title: 'Cập nhật thất bại',
                message: getErrorMessage(error, 'Không thể cập nhật trạng thái duyệt hoạt động.'),
            });
        } finally {
            setIsSubmittingReview(false);
        }
    }, [isPriority, loadDashboard, notifyOrganizer, reviewNote, selectedActivityId, showToast]);

    return (
        <div className={styles.container}>
            <ActivityApprovalStats metrics={metrics} />

            {loadError && !isLoadingDashboard && (
                <div className={styles.errorState}>{loadError}</div>
            )}

            <div className={styles.mainLayout}>
                <ActivityApprovalSidebar
                    activities={filteredActivities}
                    selectedActivityId={selectedActivityId}
                    activeTab={activeTab}
                    tabCounts={tabCounts}
                    onTabChange={handleTabChange}
                    onSelectActivity={handleSelectActivity}
                />
                <ActivityApprovalDetail
                    activity={selectedActivity}
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

export default ActivityApproval;