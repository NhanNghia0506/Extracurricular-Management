export interface CreateActivity {
    title: string;
    description: string;
    location: string;
    image?: string;
    organizerId: string;
    categoryId: string;
    startAt: string;
    endAt?: string;
    status?: string;
}