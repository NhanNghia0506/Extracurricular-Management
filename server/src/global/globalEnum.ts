export enum HttpStatus {
    ERROR = 404,
    SUCCESS = 200
}

export enum HttpMessage {
    ERROR = 'Server Internal Error',
    SUCCESS = 'Server Response Successful'
}

export enum UserRole {
    ADMIN = 1,
    STUDENT = 2,
    TEACHER = 3,
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