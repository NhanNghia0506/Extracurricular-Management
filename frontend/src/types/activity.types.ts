export interface LocationData {
    address: string;
    latitude: number;
    longitude: number;
}

export interface CreateActivity {
    title: string;
    description: string;
    location: LocationData;
    image?: string;
    organizerId: string;
    categoryId: string;
    startAt: string;
    endAt?: string;
    status?: string;
}

export interface ActivityListItem {
    _id: string;
    title: string;
    description: string;
    location: LocationData;
    status: string;
    image?: string;
    organizerId?: {
        _id?: string;
        name?: string;
    } | string;
    categoryId?: {
        _id?: string;
        name?: string;
    } | string;
    startAt: string;
    endAt?: string;
    createdAt?: string;
    updatedAt?: string;
    isMine?: boolean;
}

export interface ActivityDetailResponse {
    id: string;
    title: string;
    description: string;
    startAt: string;
    endAt?: string;
    location: LocationData;
    status: string;
    image?: string;
    trainingScore?: number;
    participantCount?: number;
    organizer: {
        _id: string;
        name: string;
    };
    category: {
        _id: string;
        name: string;
    };
    registeredCount: number;
    isRegistered: boolean;
}