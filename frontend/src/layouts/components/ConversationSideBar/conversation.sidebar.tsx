import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import styles from './conversation.sidebar.module.scss';
import conversationService from '../../../services/conversation.service';
import authService from '../../../services/auth.service';

interface ConversationItem {
    _id: string;
    title: string;
    lastMessageAt?: string;
    lastMessageContent?: string;
    lastMessageUserName?: string;
    participantsCount: number;
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
                        <div className={styles.avatarGroup}>
                            <img src={`https://i.pravatar.cc/150?u=${conversation._id}-1`} alt={conversation.title} />
                            <img src={`https://i.pravatar.cc/150?u=${conversation._id}-2`} alt={conversation.title} />
                        </div>
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