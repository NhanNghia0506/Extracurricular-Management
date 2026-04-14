import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styles from './rightsidebar.module.scss';
import conversationService from '../../../services/conversation.service';
import authService from '../../../services/auth.service';
import UserAvatar from '../../../components/UserAvatar/user.avatar';
import { resolveImageSrc } from '../../../utils/image-url';

interface Club {
    id: string;
    name: string;
    members: string;
    conversationId: string;
    activityImage?: string;
}

interface ActiveConversation {
    id: string;
    conversationId: string;
    title: string;
    preview: string;
    activityImage?: string;
    lastMessageAt?: string;
}

const RightSidebar: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [isLoadingClubs, setIsLoadingClubs] = useState(true);
    const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [clubToJoin, setClubToJoin] = useState<Club | null>(null);

    const mapConversationToActiveItem = useCallback((conversation: any): ActiveConversation => ({
        id: conversation._id,
        conversationId: conversation._id,
        title: conversation.title,
        preview: conversation.lastMessageContent || 'Chưa có tin nhắn nào',
        activityImage: resolveImageSrc(conversation.activityId?.image),
        lastMessageAt: conversation.lastMessageAt,
    }), []);

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

    useEffect(() => {
        const fetchSidebarData = async () => {
            if (!currentUser?.id) {
                setClubs([]);
                setIsLoadingClubs(false);
                setActiveConversations([]);
                setIsLoadingMessages(false);
                return;
            }

            try {
                setIsLoadingClubs(true);
                setIsLoadingMessages(true);
                const [recommendedResponse, activeResponse] = await Promise.all([
                    conversationService.getRecommendedConversations(),
                    conversationService.getUserConversations(currentUser.id),
                ]);
                const recommendedConversations = Array.isArray(recommendedResponse.data.data)
                    ? recommendedResponse.data.data
                    : [];
                const joinedConversations = Array.isArray(activeResponse.data.data)
                    ? activeResponse.data.data
                    : [];

                setClubs(recommendedConversations.map((conversation: any) => ({
                    id: conversation._id,
                    conversationId: conversation._id,
                    name: conversation.title,
                    members: `${conversation.participantsCount || 0} thành viên`,
                    activityImage: resolveImageSrc(conversation.activityId?.image),
                })));
                setActiveConversations(joinedConversations.map(mapConversationToActiveItem));
            } catch (error) {
                console.error('Failed to load sidebar chat data:', error);
                setClubs([]);
                setActiveConversations([]);
            } finally {
                setIsLoadingClubs(false);
                setIsLoadingMessages(false);
            }
        };

        fetchSidebarData();
    }, [currentUser?.id, mapConversationToActiveItem]);

    const handleJoinConversation = async () => {
        if (!currentUser?.id) {
            return;
        }

        if (!clubToJoin) {
            return;
        }

        try {
            await conversationService.addMember(clubToJoin.conversationId, currentUser.id);
            setClubs((prevClubs) => prevClubs.filter((club) => club.conversationId !== clubToJoin.conversationId));
            setActiveConversations((prevConversations) => [
                {
                    id: clubToJoin.id,
                    conversationId: clubToJoin.conversationId,
                    title: clubToJoin.name,
                    preview: 'Chưa có tin nhắn nào',
                    activityImage: clubToJoin.activityImage,
                },
                ...prevConversations,
            ]);
            setClubToJoin(null);
        } catch (error) {
            console.error('Failed to join conversation:', error);
        }
    };

    const handleOpenConversation = (conversationId: string) => {
        navigate(`/chat?Id=${conversationId}`);
    };

    return (
        <aside className={styles.wrapper}>

            {/* --- Section 1: Recommended Clubs --- */}
            <div className="mb-5">
                <div className={styles.sectionTitle}>Nhóm đề xuất</div>

                {isLoadingClubs && <div className={styles.emptyState}>Đang tải nhóm đề xuất...</div>}

                {!isLoadingClubs && clubs.length === 0 && (
                    <div className={styles.emptyState}>Không có nhóm phù hợp để đề xuất</div>
                )}

                {!isLoadingClubs && clubs.map((club) => (
                    <div key={club.id} className={styles.clubItem}>
                        <div className={styles.clubInfo}>
                            <UserAvatar
                                src={club.activityImage}
                                name={club.name}
                                alt={club.name}
                                className={styles.clubIcon}
                            />
                            <div className={styles.clubMeta}>
                                <span className={styles.clubName}>{club.name}</span>
                                <span className={styles.memberCount}>{club.members}</span>
                            </div>
                        </div>
                        <button className={styles.joinBtn} onClick={() => setClubToJoin(club)}>Tham gia</button>
                    </div>
                ))}
            </div>

            {/* --- Section 2: Active Messages --- */}
            <div className="mb-5">
                <div className={styles.sectionTitle}>
                    Tin nhắn đang hoạt động
                    <span className={styles.badgeCount}>{activeConversations.length}</span>
                </div>

                {isLoadingMessages && <div className={styles.emptyState}>Đang tải tin nhắn...</div>}

                {!isLoadingMessages && activeConversations.length === 0 && (
                    <div className={styles.emptyState}>Bạn chưa tham gia nhóm chat nào</div>
                )}

                {!isLoadingMessages && activeConversations.map((conversation) => (
                    <button
                        key={conversation.id}
                        type="button"
                        className={styles.messageItem}
                        onClick={() => handleOpenConversation(conversation.conversationId)}
                    >
                        <UserAvatar
                            src={conversation.activityImage}
                            name={conversation.title}
                            alt={conversation.title}
                            className={styles.messageAvatar}
                        />
                        <div className={styles.messageMeta}>
                            <div className={styles.messageTop}>
                                <span className={styles.senderName}>{conversation.title}</span>
                                <span className={styles.messageTime}>{formatConversationTime(conversation.lastMessageAt)}</span>
                            </div>
                            <span className={styles.previewText}>{conversation.preview}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* --- Section 3: Pro Tip --- */}
            <div className={styles.proTipCard}>
                <h6>Pro Tip</h6>
                <p>
                    Hãy tham gia vào nhóm chat sau khi đăng ký tham gia hoạt động để nhận được các thông báo mới nhất <strong>Chúc thành công</strong>!
                </p>
            </div>

            <Modal show={Boolean(clubToJoin)} onHide={() => setClubToJoin(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận tham gia nhóm</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {clubToJoin
                        ? `Bạn có chắc muốn tham gia nhóm chat "${clubToJoin.name}" không?`
                        : 'Bạn có chắc muốn tham gia nhóm chat này không?'}
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className={styles.modalSecondaryBtn} onClick={() => setClubToJoin(null)}>
                        Hủy
                    </button>
                    <button type="button" className={styles.modalPrimaryBtn} onClick={handleJoinConversation}>
                        Tham gia
                    </button>
                </Modal.Footer>
            </Modal>

        </aside>
    );
};

export default RightSidebar;