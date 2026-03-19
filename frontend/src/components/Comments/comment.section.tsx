import React from 'react';
import styles from './comments.module.scss';
import CommentItem from './comment.item';
import authService from '../../services/auth.service';
import { useActivityComments } from '../../hooks/useActivityComments';
import UserAvatar from '../UserAvatar/user.avatar';

interface CommentSectionProps {
    activityId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ activityId }) => {
    const [newComment, setNewComment] = React.useState('');
    const currentUser = authService.getCurrentUser();

    const {
        comments,
        total,
        loading,
        loadingMore,
        submitting,
        error,
        hasMore,
        createComment,
        updateComment,
        deleteComment,
        loadMore,
    } = useActivityComments(activityId);

    const getRelativeTime = React.useCallback((isoDate: string): string => {
        const createdAt = new Date(isoDate);
        const now = new Date();
        const diffMs = Math.max(0, now.getTime() - createdAt.getTime());

        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;

        if (diffMs < minute) {
            return 'Vừa xong';
        }

        if (diffMs < hour) {
            return `${Math.floor(diffMs / minute)}m`;
        }

        if (diffMs < day) {
            return `${Math.floor(diffMs / hour)}h`;
        }

        return `${Math.floor(diffMs / day)}d`;
    }, []);

    const handleSubmitComment = async () => {
        const trimmed = newComment.trim();
        if (!trimmed) {
            return;
        }

        await createComment(trimmed);
        setNewComment('');
    };

    return (
        <div className={styles.commentsContainer}>
            <div className={styles.header}>
                <h5>Comments <span>{total}</span></h5>
                <div className={styles.sortDropdown}>
                    Newest <i className="fa-solid fa-chevron-down"></i>
                </div>
            </div>

            <div className={styles.inputWrapper}>
                <UserAvatar
                    src={currentUser?.avatar || undefined}
                    name={currentUser?.name || 'You'}
                    alt="You"
                    className={styles.userAvatar}
                />
                <div className={styles.fieldContainer}>
                    <div className={styles.inputBox}>
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    handleSubmitComment();
                                }
                            }}
                            disabled={submitting}
                        />
                        <div className={styles.iconActions}>
                            <i className="fa-regular fa-face-smile"></i>
                            <button
                                type="button"
                                className={styles.submitBtn}
                                onClick={handleSubmitComment}
                                disabled={submitting || !newComment.trim()}
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                    <p className={styles.hint}>Press Enter to post.</p>
                </div>
            </div>

            {loading && <p className={styles.statusText}>Đang tải bình luận...</p>}
            {!loading && error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.commentList}>
                {!loading && comments.length === 0 && (
                    <p className={styles.statusText}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                )}

                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        data={comment}
                        getRelativeTime={getRelativeTime}
                        onReply={(parentCommentId, content) => createComment(content, parentCommentId)}
                        onEdit={updateComment}
                        onDelete={deleteComment}
                        submitting={submitting}
                    />
                ))}
            </div>

            {hasMore && (
                <button
                    type="button"
                    className={styles.viewMore}
                    onClick={loadMore}
                    disabled={loadingMore}
                >
                    {loadingMore ? 'Đang tải...' : 'View more comments'}
                </button>
            )}
        </div>
    );
};

export default CommentSection;