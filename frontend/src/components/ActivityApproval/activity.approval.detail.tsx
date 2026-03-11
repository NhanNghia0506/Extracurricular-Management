import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faMapMarkerAlt,
    faUserFriends,
    faStar,
    faQrcode,
    faCheckCircle,
    faTimesCircle,
    faExclamationTriangle,
    faEdit,
    faSync,
} from '@fortawesome/free-solid-svg-icons';
import styles from './activity.approval.module.scss';
import { ApprovalActivity } from './activity.approval.types';

interface ActivityApprovalDetailProps {
    activity: ApprovalActivity | null;
    loading: boolean;
    submitting: boolean;
    reviewNote: string;
    isPriority: boolean;
    notifyOrganizer: boolean;
    onReviewNoteChange: (value: string) => void;
    onPriorityChange: (value: boolean) => void;
    onNotifyOrganizerChange: (value: boolean) => void;
    onApprove: () => void;
    onRequestEdit: () => void;
    onReject: () => void;
}

const ActivityApprovalDetail: React.FC<ActivityApprovalDetailProps> = ({
    activity,
    loading,
    submitting,
    reviewNote,
    isPriority,
    notifyOrganizer,
    onReviewNoteChange,
    onPriorityChange,
    onNotifyOrganizerChange,
    onApprove,
    onRequestEdit,
    onReject,
}) => {
    if (loading) {
        return (
            <main className={styles.detailView}>
                <div className={styles.emptyDetailState}>Đang tải chi tiết hoạt động...</div>
            </main>
        );
    }

    if (!activity) {
        return (
            <main className={styles.detailView}>
                <div className={styles.emptyDetailState}>Chọn một hoạt động để xem chi tiết.</div>
            </main>
        );
    }

    return (
        <main className={styles.detailView}>
            <div
                className={styles.banner}
                style={activity.imageUrl ? { backgroundImage: `url(${activity.imageUrl})` } : undefined}
            >
                <div className={styles.bannerOverlay}>
                    <span className={styles.statusBadge}>{activity.statusLabel}</span>
                    <h2>{activity.title}</h2>
                    <div className={styles.bannerMeta}>
                        <span><FontAwesomeIcon icon={faUserFriends} /> {activity.organizerDisplay}</span>
                        <span><FontAwesomeIcon icon={faSync} /> Gửi lúc: {activity.submittedAt}</span>
                    </div>
                </div>
            </div>

            <div className={styles.infoGrid}>
                <div className={styles.infoBox}>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <div><small>NGÀY TỔ CHỨC</small><p>{activity.eventDate}</p></div>
                </div>
                <div className={styles.infoBox}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <div><small>ĐỊA ĐIỂM</small><p>{activity.location}</p></div>
                </div>
                <div className={styles.infoBox}>
                    <FontAwesomeIcon icon={faStar} />
                    <div><small>ĐIỂM RÈN LUYỆN</small><p>{activity.scoreLabel}</p></div>
                </div>
                <div className={styles.infoBox}>
                    <FontAwesomeIcon icon={faQrcode} />
                    <div><small>ĐIỂM DANH</small><p>{activity.checkinMethod}</p></div>
                </div>
            </div>

            <div className={styles.contentSection}>
                <div className={styles.description}>
                    <h3>Nội dung chi tiết</h3>
                    <p>{activity.description || 'Hoạt động chưa có mô tả chi tiết.'}</p>
                    <div className={styles.reviewMeta}>
                        <span>Số lượng tham gia: {activity.participantCountLabel || 'Chưa cập nhật'}</span>
                        <span>Người duyệt: {activity.reviewedByLabel || 'Chưa được duyệt'}</span>
                        <span>Thời điểm duyệt: {activity.reviewedAtLabel || 'Chưa cập nhật'}</span>
                    </div>
                    <textarea
                        placeholder="Nhập ghi chú phản hồi cho ban tổ chức..."
                        value={reviewNote}
                        onChange={(event) => onReviewNoteChange(event.target.value)}
                    />
                </div>

                <aside className={styles.adminPanel}>
                    <div className={styles.checklist}>
                        <h4>DANH SÁCH KIỂM TRA</h4>
                        <ul>
                            {activity.checklist.map((item) => (
                                <li key={item.id}>
                                    <FontAwesomeIcon
                                        icon={item.tone === 'check' ? faCheckCircle : faExclamationTriangle}
                                        className={item.tone === 'check' ? styles.checkIcon : styles.warnIcon}
                                    />
                                    {item.content}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={styles.finalActions}>
                        <div className={styles.options}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isPriority}
                                    onChange={(event) => onPriorityChange(event.target.checked)}
                                />
                                Ưu tiên
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={notifyOrganizer}
                                    onChange={(event) => onNotifyOrganizerChange(event.target.checked)}
                                />
                                Gửi thông báo
                            </label>
                        </div>
                        <div className={styles.buttons}>
                            <button className={styles.btnReject} disabled={submitting} onClick={onReject}>
                                <FontAwesomeIcon icon={faTimesCircle} /> Từ chối
                            </button>
                            <button className={styles.btnEdit} disabled={submitting} onClick={onRequestEdit}>
                                <FontAwesomeIcon icon={faEdit} /> Yêu cầu chỉnh sửa
                            </button>
                            <button className={styles.btnApprove} disabled={submitting} onClick={onApprove}>
                                <FontAwesomeIcon icon={faCheckCircle} /> {submitting ? 'Đang gửi...' : 'Phê duyệt hoạt động'}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default memo(ActivityApprovalDetail);
