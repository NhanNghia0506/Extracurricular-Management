import React, { useEffect, useMemo, useState } from 'react';
import PostCard, { PostData } from '../../../components/PostCard/postcard';
import activityService from '../../../services/activity.service';
import { ActivityListItem } from '../../../types/activity.types';
import { ApiResponse } from '../../../types/response.types';

const Feed: React.FC = () => {
    const [activities, setActivities] = useState<ActivityListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const response = await activityService.list();
                const payload = response.data as ApiResponse<ActivityListItem[]>;
                if (payload.success) {
                    setActivities(payload.data || []);
                } else {
                    setError(payload.message || 'Không thể tải hoạt động');
                }
            } catch (err) {
                console.error('Lỗi fetch activities:', err);
                setError('Không thể tải hoạt động');
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
        []
    );

    const posts: PostData[] = useMemo(() => {
        return activities.map((activity, index) => {
            const organizerName = typeof activity.organizerId === 'string'
                ? 'Unknown Organizer'
                : activity.organizerId?.name || 'Unknown Organizer';

            const locationText = activity.location?.address || 'Unknown location';
            const imageUrl = activity.image
                ? `${baseUrl}/uploads/${activity.image}`
                : 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2071&auto=format&fit=crop';

            const status = activity.status === 'OPEN' ? 'OPEN' : 'WAITLIST';

            return {
                id: activity._id,
                title: activity.title,
                organization: organizerName,
                orgIcon: 'fa-solid fa-building',
                orgColor: index % 2 === 0 ? 'blue' : 'orange',
                status,
                image: imageUrl,
                description: activity.description,
                location: locationText,
                trainingScore: activity.trainingScore || 0,
                participants: [],
                participantCount: 0,
                isMine: Boolean(activity.isMine),
            };
        });
    }, [activities, baseUrl]);

    return (
        <div className="container-fluid p-0" style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                    Chưa có hoạt động nào.
                </div>
            )}
        </div>
    );
};

export default Feed;