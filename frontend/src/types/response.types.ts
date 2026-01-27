export interface SuccessResponse<T> {
    success: true;
    statusCode: number;
    message: string;
    data: T;
}

export interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    path: string;
    timestamp: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;