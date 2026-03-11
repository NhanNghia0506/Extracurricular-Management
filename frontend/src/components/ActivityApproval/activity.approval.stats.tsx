import React, { memo } from 'react';
import styles from './activity.approval.module.scss';
import { ApprovalMetric } from './activity.approval.types';

interface ActivityApprovalStatsProps {
    metrics: ApprovalMetric[];
}

const ActivityApprovalStats: React.FC<ActivityApprovalStatsProps> = ({ metrics }) => {
    return (
        <div className={styles.statsGrid}>
            {metrics.map((metric) => (
                <div key={metric.id} className={`${styles.statCard} ${styles[metric.cardTone]}`}>
                    <label>{metric.label}</label>
                    <div className={styles.value}>
                        {metric.value} <span className={styles[metric.trendTone]}>{metric.trendLabel}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default memo(ActivityApprovalStats);
