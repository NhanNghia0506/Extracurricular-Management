import type { LocationData } from './activity.types';

export interface CreateCheckinSession {
    activityId: string;
    location: LocationData;
    startTime: string;
    endTime: string;
    radiusMetters: number;
}
