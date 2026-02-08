import React from 'react';
import styles from './comments.module.scss';

interface CommentData {
    id: string;
    author: string;
    avatar: string;
    text: string;
    time: string;
    replies?: CommentData[];
}

const CommentItem: React.FC<{ data: CommentData }> = ({ data }) => {
    return (
        <div className={styles.commentItem}>
            <img src={data.avatar} alt={data.author} className={styles.avatar} />
            <div className={styles.commentContent}>
                <div className={styles.bubble}>
                    <span className={styles.authorName}>{data.author}</span>
                    <span className={styles.text}>{data.text}</span>
                </div>

                <div className={styles.actions}>
                    <span>Like</span>
                    <span>Reply</span>
                    <span className={styles.time}>{data.time}</span>
                </div>

                {/* Render danh sách câu trả lời nếu có */}
                {data.replies && data.replies.length > 0 && (
                    <div className={styles.repliesContainer}>
                        {data.replies.map(reply => (
                            <CommentItem key={reply.id} data={reply} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentItem;