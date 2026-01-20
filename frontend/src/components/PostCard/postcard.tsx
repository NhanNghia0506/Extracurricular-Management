import React from 'react';
import styles from './postcard.module.scss';

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
}

interface PostCardProps {
    data: PostData;
}

const PostCard: React.FC<PostCardProps> = ({ data }) => {
    return (
        <div className={styles.cardWrapper}>

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
            <img src={data.image} alt={data.title} className={styles.bannerImage} />

            {/* 3. Nội dung mô tả */}
            <p className={styles.description}>
                {data.description}
            </p>

            {/* 4. Meta Info (Địa điểm & Điểm thưởng) */}
            <div className={styles.metaRow}>
                <span>
                    <i className="fa-solid fa-location-dot"></i>
                    {data.location}
                </span>
                <span className={styles.points}>
                    <i className="fa-solid fa-circle-check"></i>
                    {data.points} Training Points
                </span>
            </div>

            <hr style={{ borderColor: '#f1f5f9', margin: '0 0 1.5rem 0' }} />

            {/* 5. Footer: Avatar & Nút bấm */}
            <div className={styles.footer}>
                {/* Nhóm Avatar */}
                <div className={styles.participantGroup}>
                    {data.participants.map((url, index) => (
                        <img key={index} src={url} alt="User" className={styles.avatar} />
                    ))}
                    <span className={styles.moreCount}>+{data.participantCount}</span>
                </div>

                {/* Nút hành động */}
                {data.status === 'OPEN' ? (
                    <button className={`${styles.actionBtn} ${styles.primary}`}>
                        Register Now
                    </button>
                ) : (
                    <button className={`${styles.actionBtn} ${styles.secondary}`}>
                        Waitlist
                    </button>
                )}
            </div>

        </div>
    );
};

export default PostCard;