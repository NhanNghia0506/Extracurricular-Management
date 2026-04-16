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

export enum ActivityApprovalStatus {
    PENDING = 'PENDING',
    NEEDS_EDIT = 'NEEDS_EDIT',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum OrganizerStatus {
    ACTIVE = 1,
    INACTIVE = 2
}

export enum OrganizerApprovalStatus {
    PENDING = 'PENDING',
    NEEDS_EDIT = 'NEEDS_EDIT',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum OrganizerMemberRole {
    MANAGER = 'MANAGER',
    MEMBER = 'MEMBER'
}

export enum CheckinStatus {
    SUCCESS = 'SUCCESS',   // Điểm danh đúng giờ
    FAILED = 'FAILED',     // Điểm danh thất bại (ngoài vùng)
    LATE = 'LATE',         // Điểm danh muộn
}

export enum NotificationType {
    OFFICE = 'OFFICE',        // Thông báo từ văn phòng
    CLASS = 'CLASS',          // Thông báo từ lớp học
    ALERT = 'ALERT',          // Cảnh báo hệ thống
    EVENT = 'EVENT',          // Thông báo sự kiện
    ACTIVITY = 'ACTIVITY',    // Thông báo hoạt động
    ORGANIZER = 'ORGANIZER',  // Thông báo ban tổ chức
    SYSTEM = 'SYSTEM',        // Thông báo hệ thống
}

export enum NotificationPriority {
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum ConversationRole {
    MEMBER = 'member',
    ADMIN = 'admin',
}

export enum CertificateStatus {
    ISSUED = 'ISSUED',
    REVOKED = 'REVOKED',
}

export enum ComplaintCategory {
    ACTIVITY = 'ACTIVITY',
    CHECKIN = 'CHECKIN',
}

export enum ComplaintStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

export enum ComplaintResolution {
    UPHELD = 'UPHELD',
    DISMISSED = 'DISMISSED',
}

export enum ComplaintPriority {
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum ComplaintActorRole {
    STUDENT = 'STUDENT',
    ADMIN = 'ADMIN',
    SYSTEM = 'SYSTEM',
}

export enum ComplaintHistoryAction {
    CREATED = 'CREATED',
    ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
    RESPONSE_ADDED = 'RESPONSE_ADDED',
    STATUS_CHANGED = 'STATUS_CHANGED',
}