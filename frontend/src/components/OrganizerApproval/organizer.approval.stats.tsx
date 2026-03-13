import React, { memo } from 'react';
import styles from './organizer.approval.module.scss';
import { OrganizerApprovalMetric } from './organizer.approval.types';

interface OrganizerApprovalStatsProps {
    metrics: OrganizerApprovalMetric[];
}

const OrganizerApprovalStats: React.FC<OrganizerApprovalStatsProps> = ({ metrics }) => {
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

export default memo(OrganizerApprovalStats);