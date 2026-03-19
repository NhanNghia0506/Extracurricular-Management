import React from 'react';
import styles from './comments.module.scss';
import { ActivityComment } from '../../types/comment.types';
import UserAvatar from '../UserAvatar/user.avatar';

interface CommentItemProps {
    data: ActivityComment;
    getRelativeTime: (isoDate: string) => string;
    onReply: (parentCommentId: string, content: string) => Promise<void>;
    onEdit: (commentId: string, content: string) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
    submitting: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
    data,
    getRelativeTime,
    onReply,
    onEdit,
    onDelete,
    submitting,
}) => {
    const [showReplyEditor, setShowReplyEditor] = React.useState(false);
    const [showEditEditor, setShowEditEditor] = React.useState(false);
    const [replyText, setReplyText] = React.useState('');
    const [editText, setEditText] = React.useState(data.content);

    React.useEffect(() => {
        setEditText(data.content);
    }, [data.content]);

    const handleReplySubmit = async () => {
        const trimmed = replyText.trim();
        if (!trimmed) {
            return;
        }

        try {
            await onReply(data.id, trimmed);
            setReplyText('');
            setShowReplyEditor(false);
        } catch (_err) {
            // Error is surfaced by parent section.
        }
    };

    const handleEditSubmit = async () => {
        const trimmed = editText.trim();
        if (!trimmed || trimmed === data.content) {
            setShowEditEditor(false);
            setEditText(data.content);
            return;
        }

        try {
            await onEdit(data.id, trimmed);
            setShowEditEditor(false);
        } catch (_err) {
            // Error is surfaced by parent section.
        }
    };

    const handleDelete = async () => {
        const confirmed = window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?');
        if (!confirmed) {
            return;
        }

        try {
            await onDelete(data.id);
        } catch (_err) {
            // Error is surfaced by parent section.
        }
    };

    return (
        <div className={styles.commentItem}>
            <UserAvatar src={data.authorAvatar} name={data.authorName} alt={data.authorName} className={styles.avatar} />
            <div className={styles.commentContent}>
                <div className={styles.bubble}>
                    <span className={styles.authorName}>{data.authorName}</span>
                    <span className={styles.text}>{data.content}</span>
                </div>

                <div className={styles.actions}>
                    <span onClick={() => {
                        setShowReplyEditor((prev) => !prev);
                        setShowEditEditor(false);
                    }}>
                        Reply
                    </span>
                    {data.canEdit && (
                        <span onClick={() => {
                            setShowEditEditor((prev) => !prev);
                            setShowReplyEditor(false);
                        }}>
                            Edit
                        </span>
                    )}
                    {data.canDelete && (
                        <span onClick={handleDelete}>Delete</span>
                    )}
                    <span className={styles.time}>
                        {getRelativeTime(data.createdAt)}
                        {data.edited ? ' (đã sửa)' : ''}
                    </span>
                </div>

                {showReplyEditor && (
                    <div className={styles.inlineEditor}>
                        <input
                            type="text"
                            placeholder="Viết phản hồi..."
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    handleReplySubmit();
                                }
                            }}
                            disabled={submitting}
                        />
                        <button
                            type="button"
                            className={styles.inlineActionBtn}
                            onClick={handleReplySubmit}
                            disabled={submitting || !replyText.trim()}
                        >
                            Gửi
                        </button>
                    </div>
                )}

                {showEditEditor && (
                    <div className={styles.inlineEditor}>
                        <input
                            type="text"
                            placeholder="Chỉnh sửa bình luận..."
                            value={editText}
                            onChange={(event) => setEditText(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    handleEditSubmit();
                                }
                            }}
                            disabled={submitting}
                        />
                        <button
                            type="button"
                            className={styles.inlineActionBtn}
                            onClick={handleEditSubmit}
                            disabled={submitting || !editText.trim()}
                        >
                            Lưu
                        </button>
                    </div>
                )}

                {data.replies.length > 0 && (
                    <div className={styles.repliesContainer}>
                        {data.replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                data={reply}
                                getRelativeTime={getRelativeTime}
                                onReply={onReply}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                submitting={submitting}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentItem;