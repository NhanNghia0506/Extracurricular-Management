export interface LoginRequest {
    email: string;
    password: string;
}

export type UserType = 'STUDENT' | 'TEACHER';

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    userType: UserType;
    code: string;
    facultyId: string;
    classId?: string;
}

export interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export interface RegisterResponse {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}
