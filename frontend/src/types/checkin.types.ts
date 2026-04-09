export interface CheckinEvent {
    checkin: {
        _id: string;
        checkinSessionId: string;
        userId: string;
        status: 'SUCCESS' | 'LATE' | 'FAILED';
        latitude: number;
        longitude: number;
        distance: number;
        movementSpeed?: number | null;
        isAnomalous?: boolean;
        anomalyReason?: string | null;
        failReason?: string;
        deviceId: string;
        createdAt: Date;
    };
    student: {
        id: string;
        name: string;
        mssv: string;
        email: string;
        avatar: string;
        class: string;
        faculty: string;
    };
    timestamp: Date;
}

/**
 * Cấu trúc checkin từ API endpoint GET /checkins/session/:sessionId
 */
export interface CheckinResponse {
    _id: string;
    userId: string;
    latitude: number;
    longitude: number;
    distance: number;
    movementSpeed?: number | null;
    isAnomalous?: boolean;
    anomalyReason?: string | null;
    status: 'SUCCESS' | 'LATE' | 'FAILED';
    failReason?: string | null;
    createdAt: string; // ISO date string
    student: {
        id: string;
        mssv: string;
        name: string;
        email: string;
        avatar: string | null;
        class: string;
        faculty: string;
    };
}

export interface SessionStats {
    totalRegistered: number;
    totalCheckedIn: number;
    successCount: number;
    failedCount: number;
    percentage: number;
    recentCheckins: CheckinEvent[];
    velocityData: VelocityPoint[];
}

export interface VelocityPoint {
    timestamp: Date;
    count: number;
}

export interface CheckinData {
    _id: string;
    checkinSessionId: string;
    userId: string;
    status: 'SUCCESS' | 'LATE' | 'FAILED';
    latitude: number;
    longitude: number;
    distance: number;
    failReason?: string;
    deviceId: string;
    createdAt: Date;
    student?: {
        _id: string;
        fullName: string;
        studentId: string;
        avatar?: string;
    };
}
