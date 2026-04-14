import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import styles from './postcard.module.scss';
import CommentSection from '../Comments/comment.section';
import activityService from '../../services/activity.service';

// Định nghĩa kiểu dữ liệu cho một bài viết
export interface PostData {
    id: string;
    title: string;
    organization: string;
    organizationImage?: string;
    orgIcon: string; // FontAwesome class
    orgColor: 'blue' | 'orange'; // Theme màu logo
    status: string;
    statusTone?: 'open' | 'ongoing' | 'completed' | 'cancelled' | 'closed' | 'default';
    image: string;
    description: string;
    location: string;
    trainingScore: number;
    participants: string[]; // Mảng chứa URL ảnh avatar
    participantCount: number; // Tổng số người tham gia (để hiện +42)
    isMine?: boolean;
    showRegisterButton?: boolean;
}

interface PostCardProps {
    data: PostData;
}

const PostCard: React.FC<PostCardProps> = ({ data }) => {
    const navigate = useNavigate();
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    // Kiểm tra description có dài hơn 150 ký tự không
    const isLongDescription = data.description.length > 150;
    const displayText = isExpanded ? data.description : data.description.slice(0, 150);

    const handleCardClick = () => {
        navigate(`/activity-detail?id=${data.id}`);
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn trigger cardClick
        setShowCommentModal(true);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/update-activity?activityId=${data.id}`);
    };

    const handleRegisterClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isRegistered || isRegistering) {
            return;
        }

        try {
            setIsRegistering(true);
            await activityService.register(data.id);
            setIsRegistered(true);
            alert('Đăng ký tham gia thành công!');
        } catch (err: any) {
            const rawMessage = err?.response?.data?.message;
            const message = Array.isArray(rawMessage)
                ? rawMessage.join(', ')
                : (rawMessage || 'Không thể đăng ký. Vui lòng thử lại!');
            alert(message);
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div
            className={styles.cardWrapper}
        >
            {/* 1. Header: Logo, Tên tổ chức, Trạng thái */}
            <div className={styles.header}>
                <div className={`d-flex gap-3 align-items-center ${styles.headerMain}`}>
                    {data.organizationImage ? (
                        <img
                            src={data.organizationImage}
                            alt={data.organization}
                            className={styles.orgAvatar}
                        />
                    ) : (
                        <div className={`${styles.orgIconBox} ${styles[data.orgColor]}`}>
                            <i className={data.orgIcon}></i>
                        </div>
                    )}
                    <div className={styles.titleSection}>
                        <h5>{data.title}</h5>
                        <small>{data.organization}</small>
                    </div>
                </div>

                <span className={`${styles.statusBadge} ${styles[data.statusTone || 'default']}`}>
                    {data.status}
                </span>
            </div>

            {/* 2. Ảnh Banner */}
            <img
                src={data.image}
                alt={data.title}
                className={styles.bannerImage}
                onClick={handleCardClick}
                style={{ cursor: 'pointer' }}
            />

            {/* 3. Nội dung mô tả */}
            <div className={styles.descriptionWrapper}>
                <p className={`${styles.description} ${isExpanded ? styles.expanded : styles.collapsed}`}>
                    {displayText}
                    {!isExpanded && isLongDescription && '...'}
                </p>
                {isLongDescription && (
                    <button
                        className={styles.toggleBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                )}
            </div>

            {/* 4. Meta Info (Địa điểm & Điểm thưởng) */}
            <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                    <i className="fa-solid fa-location-dot"></i>
                    {data.location}
                </span>
                <span className={`${styles.metaItem} ${styles.points}`}>
                    <i className="fa-solid fa-award"></i>
                    {data.trainingScore} điểm rèn luyện
                </span>
            </div>

            <hr style={{ borderColor: '#f1f5f9', margin: '0 0 1.5rem 0' }} />

            {/* 5. Footer: Đăng ký & Icon hành động */}
            <div className={styles.footer}>
                {data.showRegisterButton !== false && !isRegistered && (
                    <button
                        className={styles.registerBtn}
                        onClick={handleRegisterClick}
                        disabled={isRegistering || Boolean(data.isMine)}
                        title={data.isMine ? 'Không thể tự đăng ký hoạt động của bạn' : 'Đăng ký tham gia'}
                    >
                        {data.isMine
                            ? 'Hoạt động của bạn'
                            : isRegistering
                                ? 'Đang đăng ký...'
                                : 'Đăng ký'}
                    </button>
                )}

                <div className={styles.actionGroup}>
                    {data.isMine && (
                        <button
                            className={styles.editBtn}
                            onClick={handleEditClick}
                            title="Chỉnh sửa"
                        >
                            <i className="fa-solid fa-pen"></i>
                        </button>
                    )}
                    <button
                        className={styles.commentBtn}
                        onClick={handleCommentClick}
                        title="Bình luận"
                    >
                        <i className="fa-solid fa-comment"></i>
                    </button>
                </div>
            </div>

            {/* Modal Comment */}
            <Modal
                show={showCommentModal}
                onHide={() => setShowCommentModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>{data.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CommentSection activityId={data.id} />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default PostCard;