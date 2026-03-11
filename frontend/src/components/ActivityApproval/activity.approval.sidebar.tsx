import React, { memo } from 'react';
import styles from './activity.approval.module.scss';
import { ApprovalActivity, ApprovalState } from './activity.approval.types';

interface ActivityApprovalSidebarProps {
    activities: ApprovalActivity[];
    selectedActivityId: string | null;
    activeTab: ApprovalState;
    tabCounts: Record<ApprovalState, number>;
    onTabChange: (tab: ApprovalState) => void;
    onSelectActivity: (activityId: string) => void;
}

const ActivityApprovalSidebar: React.FC<ActivityApprovalSidebarProps> = ({
    activities,
    selectedActivityId,
    activeTab,
    tabCounts,
    onTabChange,
    onSelectActivity,
}) => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.tabs}>
                <button
                    className={activeTab === 'pending' ? styles.active : ''}
                    onClick={() => onTabChange('pending')}
                >
                    Chờ duyệt ({tabCounts.pending})
                </button>
                <button
                    className={activeTab === 'needsEdit' ? styles.active : ''}
                    onClick={() => onTabChange('needsEdit')}
                >
                    Cần sửa ({tabCounts.needsEdit})
                </button>
                <button
                    className={activeTab === 'approved' ? styles.active : ''}
                    onClick={() => onTabChange('approved')}
                >
                    Đã duyệt ({tabCounts.approved})
                </button>
            </div>
            <div className={styles.activityList}>
                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className={`${styles.activityItem} ${selectedActivityId === activity.id ? styles.selected : ''}`}
                        onClick={() => onSelectActivity(activity.id)}
                    >
                        <div className={styles.itemThumb}>
                            {activity.imageUrl ? (
                                <img src={activity.imageUrl} alt={activity.title} className={styles.itemThumbImage} />
                            ) : (
                                <span>📄</span>
                            )}
                        </div>
                        <div className={styles.itemInfo}>
                            <span className={styles.idLabel}>Mã: {activity.code}</span>
                            <h4>{activity.title}</h4>
                            <p>{activity.organizer} • {activity.eventDate.split(' • ')[0]}</p>
                            {activity.deadlineTag && (
                                <span className={styles.deadlineTag}>⚠️ {activity.deadlineTag}</span>
                            )}
                        </div>
                    </div>
                ))}
                {activities.length === 0 && (
                    <div className={styles.emptyState}>Không có hoạt động nào trong nhóm này.</div>
                )}
            </div>
        </aside>
    );
};

export default memo(ActivityApprovalSidebar);
