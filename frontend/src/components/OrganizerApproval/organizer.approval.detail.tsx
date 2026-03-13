import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faAt,
    faBuilding,
    faCheckCircle,
    faEdit,
    faExclamationTriangle,
    faPhone,
    faSync,
    faTimesCircle,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import styles from './organizer.approval.module.scss';
import { ApprovalOrganizer } from './organizer.approval.types';

interface OrganizerApprovalDetailProps {
    organizer: ApprovalOrganizer | null;
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

const OrganizerApprovalDetail: React.FC<OrganizerApprovalDetailProps> = ({
    organizer,
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
                <div className={styles.emptyDetailState}>Đang tải chi tiết ban tổ chức...</div>
            </main>
        );
    }

    if (!organizer) {
        return (
            <main className={styles.detailView}>
                <div className={styles.emptyDetailState}>Chọn một ban tổ chức để xem chi tiết.</div>
            </main>
        );
    }

    return (
        <main className={styles.detailView}>
            <div className={styles.banner} style={organizer.imageUrl ? { backgroundImage: `url(${organizer.imageUrl})` } : undefined}>
                <div className={styles.bannerOverlay}>
                    <span className={styles.statusBadge}>{organizer.statusLabel}</span>
                    <h2>{organizer.name}</h2>
                    <div className={styles.bannerMeta}>
                        <span><FontAwesomeIcon icon={faUser} /> {organizer.creatorLabel}</span>
                        <span><FontAwesomeIcon icon={faSync} /> Gửi lúc: {organizer.submittedAt}</span>
                    </div>
                </div>
            </div>

            <div className={styles.infoGrid}>
                <div className={styles.infoBox}>
                    <FontAwesomeIcon icon={faAt} />
                    <div><small>EMAIL</small><p>{organizer.email}</p></div>
                </div>
                <div className={styles.infoBox}>
                    <FontAwesomeIcon icon={faPhone} />
                    <div><small>SỐ ĐIỆN THOẠI</small><p>{organizer.phone}</p></div>
                </div>
                <div className={styles.infoBox}>
                    <FontAwesomeIcon icon={faUser} />
                    <div><small>NGƯỜI TẠO</small><p>{organizer.creatorLabel}</p></div>
                </div>
                <div className={styles.infoBox}>
                    <FontAwesomeIcon icon={faBuilding} />
                    <div><small>LIÊN HỆ CHÍNH</small><p>{organizer.contactLabel}</p></div>
                </div>
            </div>

            <div className={styles.contentSection}>
                <div className={styles.description}>
                    <h3>Nội dung chi tiết</h3>
                    <p>{organizer.description}</p>
                    <div className={styles.reviewMeta}>
                        <span>Người duyệt: {organizer.reviewedByLabel || 'Chưa được duyệt'}</span>
                        <span>Thời điểm duyệt: {organizer.reviewedAtLabel || 'Chưa cập nhật'}</span>
                    </div>
                    <textarea
                        placeholder="Nhập ghi chú phản hồi cho người tạo ban tổ chức..."
                        value={reviewNote}
                        onChange={(event) => onReviewNoteChange(event.target.value)}
                    />
                </div>

                <aside className={styles.adminPanel}>
                    <div className={styles.checklist}>
                        <h4>DANH SÁCH KIỂM TRA</h4>
                        <ul>
                            {organizer.checklist.map((item) => (
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
                                <input type="checkbox" checked={isPriority} onChange={(event) => onPriorityChange(event.target.checked)} />
                                Ưu tiên
                            </label>
                            <label>
                                <input type="checkbox" checked={notifyOrganizer} onChange={(event) => onNotifyOrganizerChange(event.target.checked)} />
                                Gửi thông báo
                            </label>
                        </div>
                        <div className={styles.buttons}>
                            <button className={styles.btnReject} disabled={submitting} onClick={onReject}>
                                <FontAwesomeIcon icon={faTimesCircle} /> Từ chối
                            </button>
                            <button className={styles.btnEdit} disabled={submitting} onClick={onRequestEdit}>
                                <FontAwesomeIcon icon={faEdit} /> Yêu cầu bổ sung
                            </button>
                            <button className={styles.btnApprove} disabled={submitting} onClick={onApprove}>
                                <FontAwesomeIcon icon={faCheckCircle} /> {submitting ? 'Đang gửi...' : 'Phê duyệt ban tổ chức'}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default memo(OrganizerApprovalDetail);