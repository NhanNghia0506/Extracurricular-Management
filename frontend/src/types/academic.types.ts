export interface Faculty {
    _id: string;
    name: string;
    email?: string;
    facultyCode?: string;
    phone?: string;
}

export interface ClassItem {
    _id: string;
    name: string;
    code?: string;
    facultyId: string;
}

export interface CreateFacultyPayload {
    name: string;
    email: string;
    facultyCode: string;
    phone: string;
}

export interface CreateClassPayload {
    name: string;
    code: string;
    facultyId: string;
}
