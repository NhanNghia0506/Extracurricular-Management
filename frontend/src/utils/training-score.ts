import { AttendanceHistoryItem } from '../types/attendance-history.types';

export const isActivityEnded = (activityStatus?: string): boolean => {
    return String(activityStatus || '').toUpperCase() === 'COMPLETED';
};

export const getDisplayAwardedPoints = (item: AttendanceHistoryItem): number => {
    if (!isActivityEnded(item.activityStatus)) {
        return 0;
    }

    return Math.max(0, item.awardedPoints || 0);
};

export const sumAwardedPoints = (items: AttendanceHistoryItem[]): number => {
    const awardedByActivity = new Map<string, number>();

    for (const item of items) {
        const awardedPoints = getDisplayAwardedPoints(item);
        if (awardedPoints <= 0) {
            continue;
        }

        const activityId = String(item.activityId || '');
        if (!activityId) {
            continue;
        }

        if (!awardedByActivity.has(activityId)) {
            awardedByActivity.set(activityId, awardedPoints);
        }
    }

    return Array.from(awardedByActivity.values()).reduce((total, awardedPoints) => total + awardedPoints, 0);
};
