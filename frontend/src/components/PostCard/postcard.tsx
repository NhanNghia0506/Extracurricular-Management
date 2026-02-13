import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import styles from './postcard.module.scss';
import CommentSection from '../Comments/comment.section';

// Định nghĩa kiểu dữ liệu cho một bài viết
export interface PostData {
    id: string;
    title: string;
    organization: string;
    orgIcon: string; // FontAwesome class
    orgColor: 'blue' | 'orange'; // Theme màu logo
    status: 'OPEN' | 'WAITLIST';
    image: string;
    description: string;
    location: string;
    points: number;
    participants: string[]; // Mảng chứa URL ảnh avatar
    participantCount: number; // Tổng số người tham gia (để hiện +42)
    isMine?: boolean;
}

interface PostCardProps {
    data: PostData;
}

const PostCard: React.FC<PostCardProps> = ({ data }) => {
    const navigate = useNavigate();
    const [showCommentModal, setShowCommentModal] = useState(false);

    const handleCardClick = () => {
        navigate(`/detail/${data.id}`);
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn trigger cardClick
        setShowCommentModal(true);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/create-activity?editId=${data.id}`);
    };

    return (
        <div
            className={styles.cardWrapper}
        >
            {/* 1. Header: Logo, Tên tổ chức, Trạng thái */}
            <div className={styles.header}>
                <div className="d-flex gap-3 align-items-center">
                    <div className={`${styles.orgIconBox} ${styles[data.orgColor]}`}>
                        <i className={data.orgIcon}></i>
                    </div>
                    <div className={styles.titleSection}>
                        <h5>{data.title}</h5>
                        <small>{data.organization}</small>
                    </div>
                </div>

                <span className={`${styles.statusBadge} ${data.status === 'OPEN' ? styles.open : styles.waitlist}`}>
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
            <p className={styles.description}>
                {data.description}
            </p>

            {/* 4. Meta Info (Địa điểm & Điểm thưởng) */}
            <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                    <i className="fa-solid fa-location-dot"></i>
                    {data.location}
                </span>
                <span className={`${styles.metaItem} ${styles.points}`}>
                    <i className="fa-solid fa-award"></i>
                    {data.points} Điểm rèn luyện
                </span>
            </div>

            <hr style={{ borderColor: '#f1f5f9', margin: '0 0 1.5rem 0' }} />

            {/* 5. Footer: Avatar & Icon bình luận */}
            <div className={styles.footer}>
                {/* Nhóm Avatar */}
                <div className={styles.participantGroup}>
                    {data.participants.map((url, index) => (
                        <img key={index} src={url} alt="User" className={styles.avatar} />
                    ))}
                    <span className={styles.moreCount}>+{data.participantCount}</span>
                </div>

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