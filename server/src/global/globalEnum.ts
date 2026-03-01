export enum HttpStatus {
    ERROR = 404,
    SUCCESS = 200
}

export enum HttpMessage {
    ERROR = 'Server Internal Error',
    SUCCESS = 'Server Response Successful'
}

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export enum UserType {
    STUDENT = 'STUDENT',
    TEACHER = 'TEACHER',
}

export enum UserStatus {
    ACTIVE = 1,
    DELETED = 2
}

export enum ActivityStatus {
    OPEN = 'OPEN',            // Vừa tạo, SV đăng ký được
    CLOSED = 'CLOSED',        // Đóng đăng ký
    ONGOING = 'ONGOING',      // Đang diễn ra
    COMPLETED = 'COMPLETED',  // Đã kết thúc
    CANCELLED = 'CANCELLED',  // Bị hủy
}

export enum OrganizerStatus {
    ACTIVE = 1,
    INACTIVE = 2
}

export enum OrganizerMemberRole {
    MANAGER = 'MANAGER',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}

export enum CheckinStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

export enum NotificationType {
    OFFICE = 'OFFICE',        // Thông báo từ văn phòng
    CLASS = 'CLASS',          // Thông báo từ lớp học
    ALERT = 'ALERT',          // Cảnh báo hệ thống
    EVENT = 'EVENT',          // Thông báo sự kiện
    ACTIVITY = 'ACTIVITY',    // Thông báo hoạt động
    SYSTEM = 'SYSTEM',        // Thông báo hệ thống
}

export enum NotificationPriority {
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}