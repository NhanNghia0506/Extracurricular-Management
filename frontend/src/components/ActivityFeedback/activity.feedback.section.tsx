import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './activity.feedback.module.scss';
import feedbackService from '../../services/feedback.service';
import authService from '../../services/auth.service';
import {
    ActivityFeedbackDashboardResponse,
    ActivityFeedbackItem,
} from '../../types/feedback.types';

interface ActivityFeedbackSectionProps {
    activityId: string;
    participantStatus?: string | null;
}

const DEFAULT_LIMIT = 10;

const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
        const starNumber = index + 1;
        return (
            <i
                key={starNumber}
                className={`fa-star ${starNumber <= rating ? 'fa-solid' : 'fa-regular'}`}
            ></i>
        );
    });
};

const ActivityFeedbackSection: React.FC<ActivityFeedbackSectionProps> = ({
    activityId,
    participantStatus,
}) => {
    const currentUserId = authService.getCurrentUser()?.id as string | undefined;

    const [dashboard, setDashboard] = useState<ActivityFeedbackDashboardResponse | null>(null);
    const [feedbacks, setFeedbacks] = useState<ActivityFeedbackItem[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const myFeedback = useMemo(() => {
        if (!currentUserId) {
            return feedbacks.find((item) => item.canEdit) || null;
        }

        return (
            feedbacks.find((item) => item.authorId === currentUserId || item.canEdit) ||
            null
        );
    }, [feedbacks, currentUserId]);

    const canSubmitFeedback = useMemo(() => {
        return String(participantStatus || '').toUpperCase() === 'PARTICIPATED';
    }, [participantStatus]);

    const fetchDashboardAndList = useCallback(async () => {
        if (!activityId) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [dashboardResponse, listResponse] = await Promise.all([
                feedbackService.getDashboard(activityId),
                feedbackService.listByActivity(activityId, {
                    limit: DEFAULT_LIMIT,
                    skip: 0,
                    sort: 'newest',
                }),
            ]);

            setDashboard(dashboardResponse);
            setFeedbacks(listResponse.items);
            setTotal(listResponse.total);
            setSkip(listResponse.skip + listResponse.items.length);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải dữ liệu đánh giá hoạt động.');
        } finally {
            setLoading(false);
        }
    }, [activityId]);

    useEffect(() => {
        fetchDashboardAndList();
    }, [fetchDashboardAndList]);

    useEffect(() => {
        if (myFeedback) {
            setRating(myFeedback.rating);
            setComment(myFeedback.comment);
            return;
        }

        setRating(0);
        setComment('');
    }, [myFeedback]);

    const handleLoadMore = async () => {
        if (!activityId || loadingMore || feedbacks.length >= total) {
            return;
        }

        try {
            setLoadingMore(true);
            setError(null);

            const response = await feedbackService.listByActivity(activityId, {
                limit: DEFAULT_LIMIT,
                skip,
                sort: 'newest',
            });

            setFeedbacks((prev) => [...prev, ...response.items]);
            setTotal(response.total);
            setSkip(response.skip + response.items.length);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải thêm đánh giá.');
        } finally {
            setLoadingMore(false);
        }
    };

    const handleSubmit = async () => {
        const trimmedComment = comment.trim();

        if (!canSubmitFeedback) {
            setFormError('Chỉ sinh viên đã tham gia hoạt động mới có thể gửi đánh giá.');
            return;
        }

        if (rating < 1 || rating > 5) {
            setFormError('Vui lòng chọn số sao từ 1 đến 5.');
            return;
        }

        if (!trimmedComment) {
            setFormError('Vui lòng nhập nội dung đánh giá.');
            return;
        }

        if (trimmedComment.length > 300) {
            setFormError('Nội dung đánh giá tối đa 300 ký tự.');
            return;
        }

        try {
            setSubmitting(true);
            setFormError(null);

            if (myFeedback) {
                await feedbackService.update(myFeedback.id, {
                    rating,
                    comment: trimmedComment,
                });
            } else {
                await feedbackService.create(activityId, {
                    rating,
                    comment: trimmedComment,
                });
            }

            await fetchDashboardAndList();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const hasMore = feedbacks.length < total;

    return (
        <section id="feedback" className={styles.feedbackContainer}>
            <div className={styles.header}>
                <h5 className={styles.title}>Đánh giá hoạt động</h5>
                {myFeedback && <span className={styles.statusText}>Bạn đã gửi đánh giá và có thể chỉnh sửa.</span>}
            </div>

            {loading ? (
                <p className={styles.statusText}>Đang tải đánh giá...</p>
            ) : (
                <>
                    {error && <p className={styles.errorText}>{error}</p>}

                    {dashboard && (
                        <div className={styles.dashboard}>
                            <div className={styles.summaryBox}>
                                <div className={styles.avgRating}>{dashboard.averageRating.toFixed(1)}</div>
                                <div className={styles.starRow}>{renderStars(Math.round(dashboard.averageRating))}</div>
                                <div className={styles.totalText}>{dashboard.totalFeedbacks} đánh giá</div>
                            </div>

                            <div className={styles.distributionBox}>
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = dashboard.ratingDistribution[String(star) as '1' | '2' | '3' | '4' | '5'] || 0;
                                    const ratio = dashboard.totalFeedbacks > 0
                                        ? (count / dashboard.totalFeedbacks) * 100
                                        : 0;

                                    return (
                                        <div className={styles.distRow} key={star}>
                                            <span>{star}★</span>
                                            <div className={styles.distBar}>
                                                <div className={styles.distBarFill} style={{ width: `${ratio}%` }}></div>
                                            </div>
                                            <span>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={styles.form}>
                        <label className={styles.label}>Đánh sao</label>
                        <div className={styles.starRow}>
                            {Array.from({ length: 5 }, (_, index) => {
                                const starValue = index + 1;
                                return (
                                    <button
                                        key={starValue}
                                        type="button"
                                        className={`${styles.starBtn} ${starValue <= rating ? styles.active : ''}`}
                                        onClick={() => setRating(starValue)}
                                        disabled={submitting || !canSubmitFeedback}
                                        aria-label={`Chọn ${starValue} sao`}
                                    >
                                        <i className={`fa-star ${starValue <= rating ? 'fa-solid' : 'fa-regular'}`}></i>
                                    </button>
                                );
                            })}
                            <span className={styles.starHint}>{rating > 0 ? `${rating}/5 sao` : 'Chưa chọn sao'}</span>
                        </div>

                        <label className={styles.label}>Nội dung đánh giá</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Chia sẻ trải nghiệm của bạn sau khi tham gia hoạt động..."
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            maxLength={300}
                            disabled={submitting || !canSubmitFeedback}
                        />

                        <div className={styles.formFooter}>
                            <span className={styles.charCount}>{comment.trim().length}/300 ký tự</span>

                            <div className={styles.formActions}>
                                {myFeedback && (
                                    <button
                                        type="button"
                                        className={styles.btnSecondary}
                                        onClick={() => {
                                            setRating(myFeedback.rating);
                                            setComment(myFeedback.comment);
                                            setFormError(null);
                                        }}
                                        disabled={submitting || !canSubmitFeedback}
                                    >
                                        Hoàn tác
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={styles.btnPrimary}
                                    onClick={handleSubmit}
                                    disabled={submitting || !canSubmitFeedback}
                                >
                                    {submitting
                                        ? 'Đang lưu...'
                                        : myFeedback
                                            ? 'Cập nhật đánh giá'
                                            : 'Gửi đánh giá'}
                                </button>
                            </div>
                        </div>

                        {!canSubmitFeedback && (
                            <div className={styles.ctaWrap}>
                                <p className={styles.statusText}>
                                    Chỉ sinh viên đã tham gia hoạt động mới có thể gửi đánh giá.
                                </p>
                            </div>
                        )}

                        {formError && <p className={styles.errorText}>{formError}</p>}
                    </div>

                    <div className={styles.list}>
                        {feedbacks.length === 0 && (
                            <p className={styles.statusText}>Chưa có đánh giá nào cho hoạt động này.</p>
                        )}

                        {feedbacks.map((item) => (
                            <div className={styles.item} key={item.id}>
                                <div className={styles.itemHeader}>
                                    <div>
                                        <div className={styles.itemUser}>
                                            {item.canEdit ? 'Bạn' : `Người dùng #${item.authorId.slice(-6)}`}
                                        </div>
                                        <div className={styles.starRow}>{renderStars(item.rating)}</div>
                                    </div>
                                    <div className={styles.itemTime}>
                                        {new Date(item.updatedAt || item.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                                <p className={styles.itemComment}>{item.comment}</p>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <button
                            type="button"
                            className={styles.loadMoreBtn}
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Đang tải...' : 'Xem thêm đánh giá'}
                        </button>
                    )}
                </>
            )}
        </section>
    );
};

export default ActivityFeedbackSection;
