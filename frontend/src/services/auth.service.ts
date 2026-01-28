import apiService from './api.service';
import { ApiResponse } from '../types/response.types';
import { LoginRequest, LoginResponse } from '../types/auth.types';

class AuthService {
    private readonly AUTH_TOKEN_KEY = 'authToken';
    private readonly USER_INFO_KEY = 'userInfo';

    async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        const response = await apiService.post<ApiResponse<LoginResponse>>(
            '/user/login',
            credentials
        );

        if (response.data.success) {
            const { access_token } = response.data.data;
            this.setToken(access_token);
            this.saveUserInfoFromToken(access_token);
        }

        return response.data;
    }
    logout(): void {
        localStorage.removeItem(this.AUTH_TOKEN_KEY);
        localStorage.removeItem(this.USER_INFO_KEY);
        window.location.href = '/login';
    }

    setToken(token: string): void {
        const cleanToken = token.trim();
        localStorage.setItem(this.AUTH_TOKEN_KEY, cleanToken);
    }

    setUserInfo(user: any): void {
        if (user) {
            const userInfo = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
        }
    }

    saveUserInfoFromToken(token: string): void {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return;

            const payloadStr = atob(parts[1]);
            const payload = JSON.parse(payloadStr);

            const userInfo = {
                id: payload.sub,
                name: payload.name,
                email: payload.email
            };
            localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
        } catch (error) {
            console.error('Failed to save user info from token:', error);
        }
    }

    getUserInfoFromStorage(): any {
        const userInfo = localStorage.getItem(this.USER_INFO_KEY);
        return userInfo ? JSON.parse(userInfo) : null;
    }

    getToken(): string | null {
        const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
        return token;
    }

    // Lấy role từ JWT token
    getRole(): string | null {
        const token = this.getToken();
        if (!token) {
            return null;
        }

        try {
            const parts = token.split('.');

            if (parts.length !== 3) {
                return null;
            }

            const payloadStr = atob(parts[1]);
            const payload = JSON.parse(payloadStr);
            return payload.role || null;
        } catch (error) {
            return null;
        }
    }

    getCurrentUser(): any {
        return this.getUserInfoFromStorage();
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}


export default new AuthService();
