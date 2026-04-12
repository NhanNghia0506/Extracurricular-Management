import React, { useEffect, useState } from 'react';
import styles from '../ChatWindow/chat.window.module.scss';
import UserAvatar from '../UserAvatar/user.avatar';

interface MessageItemProps {
    avatar?: string;
    senderName?: string;
    content: string;
    imageUrl?: string;
    messageType?: 'text' | 'image' | 'file';
    time: string;
    isSent?: boolean;
    isNew?: boolean;
}

const resolveMessageImageUrl = (value?: string): string => {
    const normalized = (value || '').trim();
    if (!normalized) {
        return '';
    }

    if (/^(https?:|data:|blob:)/i.test(normalized)) {
        return normalized;
    }

    const baseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const normalizedPath = normalized.startsWith('/')
        ? normalized
        : normalized.startsWith('uploads/')
            ? `/${normalized}`
            : `/uploads/${normalized}`;

    return `${baseUrl}${normalizedPath}`;
};

const isImagePathLikeContent = (value: string): boolean => {
    const normalized = value.trim();
    return /^(https?:\/\/|\/uploads\/|uploads\/)/i.test(normalized);
};

const MessageItem: React.FC<MessageItemProps> = ({
    avatar,
    senderName,
    content,
    imageUrl,
    messageType = 'text',
    time,
    isSent = false,
    isNew = false,
}) => {
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const isImageMessage = messageType === 'image'
        || Boolean((imageUrl || '').trim())
        || isImagePathLikeContent(content || '');
    const normalizedContent = (content || '').trim();
    const resolvedImageUrl = isImageMessage
        ? resolveMessageImageUrl(imageUrl) || resolveMessageImageUrl(content)
        : '';
    const hasImageCaption = isImageMessage
        && normalizedContent !== ''
        && normalizedContent !== 'Đã gửi một hình ảnh'
        && !isImagePathLikeContent(normalizedContent);

    useEffect(() => {
        if (!isImageViewerOpen) {
            return;
        }

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsImageViewerOpen(false);
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isImageViewerOpen]);

    return (
        <>
            <div className={`${styles.messageRow} ${isSent ? styles.sent : ''} ${isNew ? styles.newMessage : ''}`}>
                {!isSent && (
                    <UserAvatar src={avatar} name={senderName} className={styles.msgAvatar} alt={senderName} />
                )}
                <div className={styles.msgBody}>
                    {senderName && !isSent && (
                        <span className={styles.senderName}>{senderName}</span>
                    )}
                    <div className={`${styles.bubble} ${isImageMessage ? styles.imageBubble : ''}`}>
                        {isImageMessage ? (
                            <>
                                <img
                                    src={resolvedImageUrl}
                                    alt="Hình ảnh đã gửi"
                                    className={styles.messageImage}
                                    loading="lazy"
                                    onClick={() => setIsImageViewerOpen(true)}
                                />
                                {hasImageCaption && <div className={styles.imageCaption}>{normalizedContent}</div>}
                            </>
                        ) : (
                            content
                        )}
                    </div>
                    <span className={styles.time}>{time}</span>
                </div>
                {isSent && (
                    <UserAvatar src={avatar} name={senderName} className={styles.msgAvatar} alt={senderName || 'You'} />
                )}
            </div>

            {isImageViewerOpen && resolvedImageUrl && (
                <div className={styles.imageViewerOverlay} onClick={() => setIsImageViewerOpen(false)}>
                    <button
                        type="button"
                        className={styles.imageViewerClose}
                        onClick={() => setIsImageViewerOpen(false)}
                        aria-label="Đóng xem ảnh"
                    >
                        ×
                    </button>
                    <img
                        src={resolvedImageUrl}
                        alt="Xem ảnh phóng to"
                        className={styles.imageViewerContent}
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

export default MessageItem;
