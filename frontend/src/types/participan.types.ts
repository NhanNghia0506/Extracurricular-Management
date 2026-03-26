export type ParticipantStatus = 'REGISTERED' | 'CANCELLED' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
export interface ParticipantItem {
    _id: string;
    userId?: string;
    studentCode?: string;
    studentName?: string;
    status?: ParticipantStatus;
    className?: string;
    facultyName?: string;
    registeredAt?: string;
}