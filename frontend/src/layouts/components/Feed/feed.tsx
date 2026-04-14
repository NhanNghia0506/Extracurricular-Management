import React, { useEffect, useMemo, useState } from 'react';
import PostCard, { PostData } from '../../../components/PostCard/postcard';
import activityService, { RecommendedActivityItem } from '../../../services/activity.service';
import { ActivityListItem } from '../../../types/activity.types';
import { ApiResponse } from '../../../types/response.types';
import { resolveAvatarSrc } from '../../../utils/avatar';
import { resolveImageSrc } from '../../../utils/image-url';

interface FeedProps {
    searchTerm?: string;
}

const getStatusPresentation = (status?: string): { label: string; tone: 'open' | 'ongoing' | 'completed' | 'cancelled' | 'closed' | 'default' } => {
    switch (status) {
        case 'OPEN':
            return { label: 'Đang mở đăng ký', tone: 'open' };
        case 'ONGOING':
            return { label: 'Đang diễn ra', tone: 'ongoing' };
        case 'COMPLETED':
            return { label: 'Đã kết thúc', tone: 'completed' };
        case 'CANCELLED':
            return { label: 'Đã hủy', tone: 'cancelled' };
        case 'CLOSED':
            return { label: 'Đã đóng đăng ký', tone: 'closed' };
        default:
            return { label: 'Chưa cập nhật', tone: 'default' };
    }
};

const getActivitySortTimestamp = (activity: ActivityListItem): number => {
    const dateValue = activity.startAt || activity.createdAt || activity.updatedAt;
    if (!dateValue) {
        return 0;
    }

    const parsed = new Date(dateValue).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

const Feed: React.FC<FeedProps> = ({ searchTerm = '' }) => {
    const [activities, setActivities] = useState<ActivityListItem[]>([]);
    const [recommendedActivities, setRecommendedActivities] = useState<RecommendedActivityItem[]>([]);
    const [registeredActivityIds, setRegisteredActivityIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const [allResponse, recommendedResponse] = await Promise.all([
                    activityService.list(),
                    activityService.recommended(6).catch(() => null),
                ]);
                const payload = allResponse.data as ApiResponse<ActivityListItem[]>;
                if (payload.success) {
                    setActivities(payload.data || []);
                } else {
                    setError(payload.message || 'Không thể tải hoạt động');
                }

                if (recommendedResponse?.data?.success) {
                    setRecommendedActivities(recommendedResponse.data.data?.items || []);
                } else {
                    setRecommendedActivities([]);
                }

                const myActivitiesResponse = await activityService.myActivities().catch(() => null);
                const myActivitiesData = myActivitiesResponse?.data?.data;
                const myItems = Array.isArray(myActivitiesData)
                    ? myActivitiesData
                    : [];
                const registeredIds = new Set<string>();

                myItems.forEach((item: any) => {
                    const relation = item?.relation;
                    const participantStatus = item?.participantStatus;
                    const isRegistered =
                        relation === 'participated'
                        && participantStatus !== 'CANCELLED'
                        && participantStatus !== 'REJECTED';

                    if (isRegistered) {
                        const id = String(item?.activityId || item?._id || '').trim();
                        if (id) {
                            registeredIds.add(id);
                        }
                    }
                });

                setRegisteredActivityIds(registeredIds);
            } catch (err) {
                console.error('Lỗi fetch activities:', err);
                setError('Không thể tải hoạt động');
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredActivities = useMemo(() => {
        if (!normalizedSearchTerm) {
            return activities;
        }

        return activities.filter((activity) => {
            const organizerName = typeof activity.organizerId === 'string'
                ? activity.organizerId
                : activity.organizerId?.name || '';

            return [
                activity.title,
                activity.description,
                activity.location?.address,
                organizerName,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedSearchTerm));
        });
    }, [activities, normalizedSearchTerm]);

    const sortedActivities = useMemo(() => {
        return [...filteredActivities].sort((a, b) => {
            const aIsOngoing = a.status === 'ONGOING';
            const bIsOngoing = b.status === 'ONGOING';
            if (aIsOngoing !== bIsOngoing) {
                return aIsOngoing ? -1 : 1;
            }

            const aIsCompleted = a.status === 'COMPLETED';
            const bIsCompleted = b.status === 'COMPLETED';
            if (aIsCompleted !== bIsCompleted) {
                return aIsCompleted ? 1 : -1;
            }

            return getActivitySortTimestamp(b) - getActivitySortTimestamp(a);
        });
    }, [filteredActivities]);

    const posts: PostData[] = useMemo(() => {
        return sortedActivities.map((activity, index) => {
            const organizerName = typeof activity.organizerId === 'string'
                ? 'Unknown Organizer'
                : activity.organizerId?.name || 'Unknown Organizer';
            const organizerAvatar = typeof activity.organizerId === 'string'
                ? undefined
                : resolveAvatarSrc(activity.organizerId?.image);

            const locationText = activity.location?.address || 'Unknown location';
            const imageUrl = resolveImageSrc(activity.image)
                || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2071&auto=format&fit=crop';

            const statusPresentation = getStatusPresentation(activity.status);

            return {
                id: activity._id,
                title: activity.title,
                organization: organizerName,
                organizationImage: organizerAvatar,
                orgIcon: 'fa-solid fa-building',
                orgColor: index % 2 === 0 ? 'blue' : 'orange',
                status: statusPresentation.label,
                statusTone: statusPresentation.tone,
                image: imageUrl,
                description: activity.description,
                location: locationText,
                trainingScore: activity.trainingScore || 0,
                participants: [],
                participantCount: 0,
                isMine: Boolean(activity.isMine),
                showRegisterButton: !registeredActivityIds.has(activity._id) && activity.status !== 'COMPLETED',
            };
        });
    }, [sortedActivities, registeredActivityIds]);

    const recommendedPosts: Array<{ post: PostData; reason: string }> = useMemo(() => {
        return recommendedActivities.map((activity, index) => {
            const activityId = activity.id || activity._id;
            const organizerName = typeof activity.organizerId === 'string'
                ? 'Unknown Organizer'
                : activity.organizerId?.name || 'Unknown Organizer';
            const organizerAvatar = typeof activity.organizerId === 'string'
                ? undefined
                : resolveAvatarSrc(activity.organizerId?.image);

            const locationText = activity.location?.address || 'Unknown location';
            const imageUrl = resolveImageSrc(activity.image)
                || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2071&auto=format&fit=crop';

            const statusPresentation = getStatusPresentation(activity.status);

            return {
                post: {
                    id: activityId,
                    title: activity.title,
                    organization: organizerName,
                    organizationImage: organizerAvatar,
                    orgIcon: 'fa-solid fa-building',
                    orgColor: index % 2 === 0 ? 'blue' : 'orange',
                    status: statusPresentation.label,
                    statusTone: statusPresentation.tone,
                    image: imageUrl,
                    description: activity.description,
                    location: locationText,
                    trainingScore: activity.trainingScore || 0,
                    participants: [],
                    participantCount: activity.participantCount || 0,
                    isMine: Boolean(activity.isMine),
                    showRegisterButton: !registeredActivityIds.has(activityId) && activity.status !== 'COMPLETED',
                },
                reason: activity.reason,
            };
        });
    }, [recommendedActivities, registeredActivityIds]);

    return (
        <div className="container-fluid p-0" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {recommendedPosts.length > 0 && (
                <section style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h5 style={{ margin: 0, fontWeight: 700 }}>
                            <i className="fa-solid fa-wand-magic-sparkles me-2 text-primary"></i>
                            Gợi ý cho bạn
                        </h5>
                    </div>
                    {recommendedPosts.map((item, index) => (
                        <div key={`${item.post.id}-recommended-${index}`}>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                {item.reason}
                            </div>
                            <PostCard data={item.post} />
                        </div>
                    ))}
                </section>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {posts.map((post, index) => (
                <PostCard key={`${post.id}-${index}`} data={post} />
            ))}

            {loading && (
                <div className="text-center py-4 text-muted">
                    <i className="fa-solid fa-spinner fa-spin me-2"></i>
                    Loading more activities...
                </div>
            )}

            {!loading && posts.length === 0 && !error && (
                <div className="text-center py-4 text-muted">
                    {normalizedSearchTerm
                        ? `Không tìm thấy hoạt động phù hợp với "${searchTerm.trim()}".`
                        : 'Chưa có hoạt động nào.'}
                </div>
            )}
        </div>
    );
};

export default Feed;