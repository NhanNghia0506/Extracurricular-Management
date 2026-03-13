import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuildingUser } from '@fortawesome/free-solid-svg-icons';
import styles from './organizer.approval.module.scss';
import { ApprovalOrganizer, OrganizerApprovalState } from './organizer.approval.types';

interface OrganizerApprovalSidebarProps {
    organizers: ApprovalOrganizer[];
    selectedOrganizerId: string | null;
    activeTab: OrganizerApprovalState;
    tabCounts: Record<OrganizerApprovalState, number>;
    onTabChange: (tab: OrganizerApprovalState) => void;
    onSelectOrganizer: (organizerId: string) => void;
}

const OrganizerApprovalSidebar: React.FC<OrganizerApprovalSidebarProps> = ({
    organizers,
    selectedOrganizerId,
    activeTab,
    tabCounts,
    onTabChange,
    onSelectOrganizer,
}) => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.tabs}>
                <button className={activeTab === 'pending' ? styles.active : ''} onClick={() => onTabChange('pending')}>
                    Chờ duyệt ({tabCounts.pending})
                </button>
                <button className={activeTab === 'needsEdit' ? styles.active : ''} onClick={() => onTabChange('needsEdit')}>
                    Cần bổ sung ({tabCounts.needsEdit})
                </button>
                <button className={activeTab === 'approved' ? styles.active : ''} onClick={() => onTabChange('approved')}>
                    Đã duyệt ({tabCounts.approved})
                </button>
            </div>
            <div className={styles.activityList}>
                {organizers.map((organizer) => (
                    <div
                        key={organizer.id}
                        className={`${styles.activityItem} ${selectedOrganizerId === organizer.id ? styles.selected : ''}`}
                        onClick={() => onSelectOrganizer(organizer.id)}
                    >
                        <div className={styles.itemThumb}>
                            {organizer.imageUrl ? (
                                <img src={organizer.imageUrl} alt={organizer.name} className={styles.itemThumbImage} />
                            ) : (
                                <FontAwesomeIcon icon={faBuildingUser} />
                            )}
                        </div>
                        <div className={styles.itemInfo}>
                            <span className={styles.idLabel}>Mã: {organizer.code}</span>
                            <h4>{organizer.name}</h4>
                            <p>{organizer.creatorLabel} • {organizer.submittedAt}</p>
                            {organizer.deadlineTag && <span className={styles.deadlineTag}>⚠️ {organizer.deadlineTag}</span>}
                        </div>
                    </div>
                ))}
                {organizers.length === 0 && <div className={styles.emptyState}>Không có ban tổ chức nào trong nhóm này.</div>}
            </div>
        </aside>
    );
};

export default memo(OrganizerApprovalSidebar);