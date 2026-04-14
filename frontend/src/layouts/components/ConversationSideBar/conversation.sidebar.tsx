import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import styles from './conversation.sidebar.module.scss';
import conversationService from '../../../services/conversation.service';
import authService from '../../../services/auth.service';
import { socketService } from '../../../services/socket.service';
import { ConversationUpdatedPayload, SocketEvent } from '../../../types/socket.types';
import UserAvatar from '../../../components/UserAvatar/user.avatar';
import { resolveImageSrc } from '../../../utils/image-url';

interface ConversationItem {
    _id: string;
    title: string;
    lastMessageAt?: string;
    lastMessageContent?: string;
    lastMessageUserName?: string;
    participantsCount: number;
    activityId?: {
        _id?: string;
        title?: string;
        image?: string;
    };
    activityImage?: string;
}

const ConversationSidebar: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentConversationId = searchParams.get('Id');
    const currentUser = authService.getCurrentUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!currentUser?.id) {
                setConversations([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await conversationService.getUserConversations(currentUser.id);
                const conversationList = Array.isArray(response.data.data) ? response.data.data : [];
                setConversations(conversationList);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Không thể tải danh sách cuộc trò chuyện');
                setConversations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            return;
        }

        socketService.connect();

        const handleConversationUpdated = (updatedConversation: ConversationUpdatedPayload) => {
            setConversations((prevConversations) => {
                const hasConversation = prevConversations.some(
                    (conversation) => conversation._id === updatedConversation._id,
                );

                if (!hasConversation) {
                    return prevConversations;
                }

                return [...prevConversations]
                    .map((conversation) => conversation._id === updatedConversation._id
                        ? { ...conversation, ...updatedConversation }
                        : conversation)
                    .sort((left, right) => {
                        const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
                        const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
                        return rightTime - leftTime;
                    });
            });
        };

        socketService.on(SocketEvent.CONVERSATION_UPDATED, handleConversationUpdated);

        return () => {
            socketService.off(SocketEvent.CONVERSATION_UPDATED, handleConversationUpdated);
        };
    }, [currentUser?.id]);

    const filteredConversations = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        if (!normalizedSearch) {
            return conversations;
        }

        return conversations.filter((conversation) => {
            const title = conversation.title?.toLowerCase() || '';
            const lastMessage = conversation.lastMessageContent?.toLowerCase() || '';
            const lastSender = conversation.lastMessageUserName?.toLowerCase() || '';

            return title.includes(normalizedSearch)
                || lastMessage.includes(normalizedSearch)
                || lastSender.includes(normalizedSearch);
        });
    }, [conversations, searchTerm]);

    const formatConversationTime = (value?: string) => {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleOpenConversation = (conversationId: string) => {
        navigate(`/chat?Id=${conversationId}`);
    };

    const getActivityImageUrl = (conversation: ConversationItem) => {
        const imageName = conversation.activityImage || conversation.activityId?.image;

        if (!imageName) {
            return undefined;
        }

        return resolveImageSrc(imageName) || undefined;
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <h2>Conversations</h2>
                <button className={styles.iconBtn}>
                    <FontAwesomeIcon icon={faEdit} />
                </button>
            </div>

            <div className={styles.searchBox}>
                <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Tìm cuộc trò chuyện"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
            </div>

            <div className={styles.chatList}>
                {loading && (
                    <div className={styles.sidebarState}>Đang tải cuộc trò chuyện...</div>
                )}

                {!loading && error && (
                    <div className={styles.sidebarState}>{error}</div>
                )}

                {!loading && !error && filteredConversations.length === 0 && (
                    <div className={styles.sidebarState}>Bạn chưa tham gia cuộc trò chuyện nào</div>
                )}

                {!loading && !error && filteredConversations.map((conversation) => (
                    <button
                        key={conversation._id}
                        type="button"
                        className={`${styles.chatItem} ${currentConversationId === conversation._id ? styles.active : ''}`}
                        onClick={() => handleOpenConversation(conversation._id)}
                    >
                        <UserAvatar
                            src={getActivityImageUrl(conversation)}
                            name={conversation.activityId?.title || conversation.title}
                            alt={conversation.title}
                            className={styles.activityAvatar}
                        />
                        <div className={styles.chatMeta}>
                            <div className={styles.chatTop}>
                                <strong>{conversation.title}</strong>
                                <span>{formatConversationTime(conversation.lastMessageAt)}</span>
                            </div>
                            <p>
                                {conversation.lastMessageContent
                                    ? `${conversation.lastMessageUserName || 'Tin nhắn mới'}: ${conversation.lastMessageContent}`
                                    : `${conversation.participantsCount} thành viên`}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default ConversationSidebar;