export interface Organizer {
    id: string;
    name: string;
    email: string;
    phone: string;
    status?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateOrganizer {
    name: string;
    email: string;
    phone: string;
}

export interface UpdateOrganizer {
    name?: string;
    email?: string;
    phone?: string;
    status?: number;
}
