import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faTimes, faGraduationCap, faTag, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import styles from './create.conservation.module.scss';
import conversationService from '../../services/conversation.service';

interface CreateConservationProps {
    onClose: () => void;
    activityId?: string;
    activityTitle?: string;
    onSuccess?: () => void;
}

const CreatConservation: React.FC<CreateConservationProps> = ({ onClose, activityId, activityTitle, onSuccess }) => {
    const [title, setTitle] = useState(activityTitle || '');
    const [addAllMembers, setAddAllMembers] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreateChat = async () => {
        if (!activityId) {
            alert('Cần có ID hoạt động');
            return;
        }

        if (!title.trim()) {
            alert('Vui lòng nhập tên nhóm chat');
            return;
        }

        try {
            setLoading(true);
            await conversationService.create({
                activityId,
                title: title.trim(),
                addAllMembers
            });
            alert('Tạo nhóm chat thành công!');
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error: any) {
            console.error('Error creating conversation:', error);
            alert(error.response?.data?.message || 'Không thể tạo nhóm chat. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !loading) {
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContent}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerTitle}>
                        <div className={styles.iconBox}>
                            <FontAwesomeIcon icon={faUserPlus} />
                        </div>
                        <h2>Tạo Nhóm Chat Mới</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </header>

                {/* Body Form */}
                <div className={styles.formBody}>
                    {/* Section 1: Activity */}
                    <div className={styles.inputGroup}>
                        <label>
                            <FontAwesomeIcon icon={faGraduationCap} /> Hoạt động
                        </label>
                        <div className={styles.selectWrapper}>
                            <select defaultValue={activityId || ""} disabled={!!activityId}>
                                <option value="" disabled>Chọn một hoạt động</option>
                                {activityId && activityTitle && (
                                    <option value={activityId}>{activityTitle}</option>
                                )}
                            </select>
                        </div>
                        {/* <p className={styles.helperText}>Select which university activity this chat is related to.</p> */}
                    </div>

                    {/* Section 2: Chat Title */}
                    <div className={styles.inputGroup}>
                        <label>
                            <FontAwesomeIcon icon={faTag} /> Tên nhóm chat
                        </label>
                        <input
                            type="text"
                            placeholder="vd: Nhóm Dự án Alpha"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* Section 3: Automatic Members */}
                    <div className={styles.memberBanner}>
                        {/* <div className={styles.avatarStack}>
                            <span className={`${styles.avatar} ${styles.blue}`}>JD</span>
                            <span className={`${styles.avatar} ${styles.green}`}>SK</span>
                            <span className={`${styles.avatar} ${styles.yellow}`}>AM</span>
                        </div> */}
                        <span className={styles.memberText}>Thành viên tự động từ hoạt động</span>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={addAllMembers}
                                onChange={(e) => setAddAllMembers(e.target.checked)}
                                disabled={loading}
                            />
                            <span>Thêm tất cả</span>
                        </label>
                    </div>
                </div>

                {/* Footer Actions */}
                <footer className={styles.footer}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        className={styles.submitBtn}
                        onClick={handleCreateChat}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faCommentDots} />
                        {loading ? 'Đang tạo...' : 'Tạo nhóm chat'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CreatConservation;