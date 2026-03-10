import React from 'react';
import styles from '../ChatWindow/chat.window.module.scss';
import UserAvatar from '../UserAvatar/user.avatar';

interface MessageItemProps {
    avatar?: string;
    senderName?: string;
    content: string;
    time: string;
    isSent?: boolean;
    isNew?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
    avatar,
    senderName,
    content,
    time,
    isSent = false,
    isNew = false,
}) => {
    return (
        <div className={`${styles.messageRow} ${isSent ? styles.sent : ''} ${isNew ? styles.newMessage : ''}`}>
            {!isSent && (
                <UserAvatar src={avatar} name={senderName} className={styles.msgAvatar} alt={senderName} />
            )}
            <div className={styles.msgBody}>
                {senderName && !isSent && (
                    <span className={styles.senderName}>{senderName}</span>
                )}
                <div className={styles.bubble}>{content}</div>
                <span className={styles.time}>{time}</span>
            </div>
            {isSent && (
                <UserAvatar src={avatar} name={senderName} className={styles.msgAvatar} alt={senderName || 'You'} />
            )}
        </div>
    );
};

export default MessageItem;
