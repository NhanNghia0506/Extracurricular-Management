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