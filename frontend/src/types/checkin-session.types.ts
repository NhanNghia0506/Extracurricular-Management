import type { LocationData } from './activity.types';

export interface CreateCheckinSession {
    activityId: string;
    title: string;
    location: LocationData;
    startTime: string;
    endTime: string;
    radiusMetters: number;
}

export interface UpdateCheckinSession {
    title: string;
    location: LocationData;
    startTime: string;
    endTime: string;
    radiusMetters: number;
}

export interface CheckinSession {
    _id: string;
    activityId: string;
    title: string;
    location: LocationData;
    startTime: Date;
    endTime: Date;
    radiusMetters: number;
    createdAt?: Date;
    updatedAt?: Date;
}
