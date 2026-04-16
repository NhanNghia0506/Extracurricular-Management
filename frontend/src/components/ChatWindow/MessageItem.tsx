import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faTrash } from '@fortawesome/free-solid-svg-icons';
import styles from '../ChatWindow/chat.window.module.scss';
import UserAvatar from '../UserAvatar/user.avatar';
import { resolveImageSrc } from '../../utils/image-url';

const REVOKED_MESSAGE_TEXT = 'Tin nhắn đã bị thu hồi';

interface MessageItemProps {
    avatar?: string;
    senderName?: string;
    content: string;
    imageUrl?: string;
    messageType?: 'text' | 'image' | 'file';
    time: string;
    isSent?: boolean;
    isNew?: boolean;
    isDeleted?: boolean;
    onDelete?: () => Promise<void> | void;
}

const resolveMessageImageUrl = (value?: string): string => resolveImageSrc(value) || '';

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
    isDeleted = false,
    onDelete,
}) => {
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    const isImageMessage = !isDeleted && (
        messageType === 'image'
        || Boolean((imageUrl || '').trim())
        || isImagePathLikeContent(content || '')
    );
    const normalizedContent = isDeleted ? REVOKED_MESSAGE_TEXT : (content || '').trim();
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!actionMenuRef.current) {
                return;
            }

            if (!actionMenuRef.current.contains(event.target as Node)) {
                setIsActionMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async () => {
        setIsActionMenuOpen(false);

        if (!onDelete) {
            return;
        }

        await onDelete();
    };

    return (
        <>
            <div className={`${styles.messageRow} ${isSent ? styles.sent : ''} ${isNew ? styles.newMessage : ''}`}>
                {!isSent && (
                    <UserAvatar src={avatar} name={senderName} className={styles.msgAvatar} alt={senderName} />
                )}
                <div className={styles.msgBody}>
                    {isSent && onDelete && !isDeleted && (
                        <div className={styles.messageActions} ref={actionMenuRef}>
                            <button
                                type="button"
                                className={styles.messageActionButton}
                                aria-label="Mở tuỳ chọn tin nhắn"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setIsActionMenuOpen((currentValue) => !currentValue);
                                }}
                            >
                                <FontAwesomeIcon icon={faEllipsisVertical} />
                            </button>
                            {isActionMenuOpen && (
                                <div className={styles.messageActionMenu}>
                                    <button
                                        type="button"
                                        className={styles.messageActionMenuItem}
                                        onClick={handleDelete}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                        <span>Thu hồi tin nhắn</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {senderName && !isSent && (
                        <span className={styles.senderName}>{senderName}</span>
                    )}
                    <div className={`${styles.bubble} ${isImageMessage ? styles.imageBubble : ''} ${isDeleted ? styles.deletedBubble : ''}`}>
                        {isDeleted ? (
                            <span>{REVOKED_MESSAGE_TEXT}</span>
                        ) : isImageMessage ? (
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
