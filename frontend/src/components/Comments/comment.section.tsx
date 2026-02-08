import React from 'react';
import styles from './comments.module.scss';
import CommentItem from './comment.item';

interface CommentSectionProps {
    activityId: string;
}

const MOCK_COMMENTS = [
    {
        id: '1',
        author: 'Alex Thompson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        text: 'Will there be any recordings available for students who have classes during the keynote? Really looking forward to the AI workshop!',
        time: '2h',
        replies: [
            {
                id: '1-1',
                author: 'Marcus Chen',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
                text: "I asked Dr. Jenkins earlier and she said they'll post recordings on the student portal next week.",
                time: '1h'
            }
        ]
    },
    {
        id: '2',
        author: 'Sarah Miller',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        text: "Just registered! Can't wait to see the final year capstone projects. Does anyone know if there's a networking lunch provided?",
        time: '45m'
    }
];

const CommentSection: React.FC<CommentSectionProps> = ({ activityId }) => {
    return (
        <div className={styles.commentsContainer}>
            {/* Header */}
            <div className={styles.header}>
                <h5>Comments <span>12</span></h5>
                <div className={styles.sortDropdown}>
                    Most Relevant <i className="fa-solid fa-chevron-down"></i>
                </div>
            </div>

            {/* Input Field */}
            <div className={styles.inputWrapper}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="You" className={styles.userAvatar} />
                <div className={styles.fieldContainer}>
                    <div className={styles.inputBox}>
                        <input type="text" placeholder="Write a comment..." />
                        <div className={styles.iconActions}>
                            <i className="fa-regular fa-face-smile"></i>
                            <i className="fa-solid fa-camera"></i>
                        </div>
                    </div>
                    <p className={styles.hint}>Press Enter to post.</p>
                </div>
            </div>

            {/* List */}
            <div className={styles.commentList}>
                {MOCK_COMMENTS.map(comment => (
                    <CommentItem key={comment.id} data={comment} />
                ))}
            </div>

            {/* Footer Action */}
            <a href="#" className={styles.viewMore}>View more comments</a>
        </div>
    );
};

export default CommentSection;