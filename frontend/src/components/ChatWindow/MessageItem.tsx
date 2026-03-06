import React from 'react';
import styles from '../ChatWindow/chat.window.module.scss';

interface MessageItemProps {
    avatar: string;
    senderName?: string;
    content: string;
    time: string;
    isSent?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
    avatar,
    senderName,
    content,
    time,
    isSent = false,
}) => {
    return (
        <div className={`${styles.messageRow} ${isSent ? styles.sent : ''}`}>
            {!isSent && (
                <img src={avatar} className={styles.msgAvatar} alt={senderName} />
            )}
            <div className={styles.msgBody}>
                {senderName && !isSent && (
                    <span className={styles.senderName}>{senderName}</span>
                )}
                <div className={styles.bubble}>{content}</div>
                <span className={styles.time}>{time}</span>
            </div>
            {isSent && (
                <img src={avatar} className={styles.msgAvatar} alt="You" />
            )}
        </div>
    );
};

export default MessageItem;
