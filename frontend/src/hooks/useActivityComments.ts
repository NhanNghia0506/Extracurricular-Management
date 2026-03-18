import { useCallback, useEffect, useMemo, useState } from 'react';
import commentService from '../services/comment.service';
import { socketService } from '../services/socket.service';
import {
    ActivityComment,
    DeleteActivityCommentResponse,
    ListActivityCommentsResponse,
} from '../types/comment.types';
import { SocketEvent } from '../types/socket.types';

const DEFAULT_LIMIT = 10;

const commentExists = (comments: ActivityComment[], commentId: string): boolean => {
    for (const comment of comments) {
        if (comment.id === commentId) {
            return true;
        }

        if (comment.replies.length > 0 && commentExists(comment.replies, commentId)) {
            return true;
        }
    }

    return false;
};

const insertComment = (comments: ActivityComment[], incoming: ActivityComment): ActivityComment[] => {
    if (commentExists(comments, incoming.id)) {
        return comments;
    }

    if (!incoming.parentCommentId) {
        return [incoming, ...comments];
    }

    return comments.map((comment) => {
        if (comment.id === incoming.parentCommentId) {
            return {
                ...comment,
                replies: [...comment.replies, incoming],
            };
        }

        if (comment.replies.length === 0) {
            return comment;
        }

        return {
            ...comment,
            replies: insertComment(comment.replies, incoming),
        };
    });
};

const updateComment = (comments: ActivityComment[], incoming: ActivityComment): ActivityComment[] => {
    return comments.map((comment) => {
        if (comment.id === incoming.id) {
            return {
                ...incoming,
                replies: comment.replies,
            };
        }

        if (comment.replies.length === 0) {
            return comment;
        }

        return {
            ...comment,
            replies: updateComment(comment.replies, incoming),
        };
    });
};

const removeComments = (comments: ActivityComment[], deletedIds: Set<string>): ActivityComment[] => {
    return comments
        .filter((comment) => !deletedIds.has(comment.id))
        .map((comment) => ({
            ...comment,
            replies: removeComments(comment.replies, deletedIds),
        }));
};

const countRootToDelete = (comments: ActivityComment[], deletedIds: Set<string>): number => {
    return comments.reduce((count, comment) => {
        if (deletedIds.has(comment.id)) {
            return count + 1;
        }

        return count;
    }, 0);
};

interface UseActivityCommentsResult {
    comments: ActivityComment[];
    total: number;
    loading: boolean;
    loadingMore: boolean;
    submitting: boolean;
    error: string | null;
    hasMore: boolean;
    createComment: (content: string, parentCommentId?: string) => Promise<void>;
    updateComment: (commentId: string, content: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
}

export const useActivityComments = (
    activityId: string,
    sort: 'newest' | 'oldest' = 'newest',
): UseActivityCommentsResult => {
    const [comments, setComments] = useState<ActivityComment[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasMore = useMemo(() => comments.length < total, [comments.length, total]);

    const applyListResponse = useCallback((data: ListActivityCommentsResponse, append: boolean) => {
        setTotal(data.total);
        setSkip(data.skip + data.items.length);
        setComments((prev) => (append ? [...prev, ...data.items] : data.items));
    }, []);

    const refresh = useCallback(async () => {
        if (!activityId) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await commentService.listByActivity(activityId, DEFAULT_LIMIT, 0, sort);
            applyListResponse(data, false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải bình luận.');
        } finally {
            setLoading(false);
        }
    }, [activityId, applyListResponse, sort]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (!activityId) {
            return;
        }

        const socket = socketService.connect();

        const joinRoom = () => {
            socketService.emit(SocketEvent.JOIN_ACTIVITY_COMMENTS, { activityId });
        };

        const handleCreated = (incoming: ActivityComment) => {
            if (incoming.activityId !== activityId) {
                return;
            }

            setComments((prev) => insertComment(prev, incoming));
            if (!incoming.parentCommentId) {
                setTotal((prevTotal) => prevTotal + 1);
            }
        };

        const handleUpdated = (incoming: ActivityComment) => {
            if (incoming.activityId !== activityId) {
                return;
            }

            setComments((prev) => updateComment(prev, incoming));
        };

        const handleDeleted = (payload: DeleteActivityCommentResponse) => {
            if (!payload?.deletedCommentIds?.length) {
                return;
            }

            const deletedIds = new Set(payload.deletedCommentIds);
            setComments((prev) => {
                const rootRemoved = countRootToDelete(prev, deletedIds);
                if (rootRemoved > 0) {
                    setTotal((prevTotal) => Math.max(0, prevTotal - rootRemoved));
                }

                return removeComments(prev, deletedIds);
            });
        };

        socketService.on(SocketEvent.ACTIVITY_COMMENT_CREATED, handleCreated);
        socketService.on(SocketEvent.ACTIVITY_COMMENT_UPDATED, handleUpdated);
        socketService.on(SocketEvent.ACTIVITY_COMMENT_DELETED, handleDeleted);

        if (socket.connected) {
            joinRoom();
        } else {
            socket.once(SocketEvent.CONNECT, joinRoom);
        }

        return () => {
            socket.off(SocketEvent.CONNECT, joinRoom);
            socketService.emit(SocketEvent.LEAVE_ACTIVITY_COMMENTS, { activityId });
            socketService.off(SocketEvent.ACTIVITY_COMMENT_CREATED, handleCreated);
            socketService.off(SocketEvent.ACTIVITY_COMMENT_UPDATED, handleUpdated);
            socketService.off(SocketEvent.ACTIVITY_COMMENT_DELETED, handleDeleted);
        };
    }, [activityId]);

    const createComment = useCallback(async (content: string, parentCommentId?: string) => {
        const trimmed = content.trim();
        if (!trimmed || !activityId) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const created = await commentService.create(activityId, {
                content: trimmed,
                parentCommentId,
            });

            setComments((prev) => insertComment(prev, created));
            if (!parentCommentId) {
                setTotal((prevTotal) => prevTotal + 1);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể gửi bình luận.');
            throw err;
        } finally {
            setSubmitting(false);
        }
    }, [activityId]);

    const updateCommentById = useCallback(async (commentId: string, content: string) => {
        const trimmed = content.trim();
        if (!trimmed) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const updated = await commentService.update(commentId, { content: trimmed });
            setComments((prev) => updateComment(prev, updated));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể cập nhật bình luận.');
            throw err;
        } finally {
            setSubmitting(false);
        }
    }, []);

    const deleteCommentById = useCallback(async (commentId: string) => {
        try {
            setSubmitting(true);
            setError(null);
            const deleted = await commentService.delete(commentId);
            const deletedIds = new Set(deleted.deletedCommentIds);

            setComments((prev) => {
                const rootRemoved = countRootToDelete(prev, deletedIds);
                if (rootRemoved > 0) {
                    setTotal((prevTotal) => Math.max(0, prevTotal - rootRemoved));
                }

                return removeComments(prev, deletedIds);
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể xóa bình luận.');
            throw err;
        } finally {
            setSubmitting(false);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (!activityId || loadingMore || !hasMore) {
            return;
        }

        try {
            setLoadingMore(true);
            setError(null);
            const data = await commentService.listByActivity(activityId, DEFAULT_LIMIT, skip, sort);
            applyListResponse(data, true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải thêm bình luận.');
        } finally {
            setLoadingMore(false);
        }
    }, [activityId, applyListResponse, hasMore, loadingMore, skip, sort]);

    return {
        comments,
        total,
        loading,
        loadingMore,
        submitting,
        error,
        hasMore,
        createComment,
        updateComment: updateCommentById,
        deleteComment: deleteCommentById,
        loadMore,
        refresh,
    };
};
