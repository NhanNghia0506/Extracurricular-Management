import apiService from './api.service';
import { ApiResponse } from '../types/response.types';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserProfile } from '../types/auth.types';
import { getFingerPrintData } from '../utils/fingerprint';

class AuthService {
    private readonly AUTH_TOKEN_KEY = process.env.REACT_APP_AUTH_TOKEN_KEY || 'authToken';
    private readonly USER_INFO_KEY = process.env.REACT_APP_USER_INFO_KEY || 'userInfo';
    private readonly DEVICE_ID_KEY = 'deviceId';

    async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        const fingerprintData = getFingerPrintData();
        const response = await apiService.post<ApiResponse<LoginResponse>>(
            '/user/login',
            { ...credentials, fingerprintData }
        );

        if (response.data.success) {
            const { access_token, deviceId } = response.data.data;
            this.setToken(access_token);
            this.setDeviceId(deviceId);
            this.saveUserInfoFromToken(access_token);
        }

        return response.data;
    }

    async register(payload: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
        const response = await apiService.post<ApiResponse<RegisterResponse>>(
            '/user/register',
            payload
        );

        return response.data;
    }

    async getProfile(): Promise<ApiResponse<UserProfile>> {
        const response = await apiService.get<ApiResponse<UserProfile>>('/user/me');
        return response.data;
    }
    logout(): void {
        localStorage.removeItem(this.AUTH_TOKEN_KEY);
        localStorage.removeItem(this.USER_INFO_KEY);
        localStorage.removeItem(this.DEVICE_ID_KEY);
        window.location.href = '/login';
    }

    setToken(token: string): void {
        const cleanToken = token.trim();
        localStorage.setItem(this.AUTH_TOKEN_KEY, cleanToken);
    }

    setDeviceId(deviceId: string): void {
        localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }

    getDeviceId(): string | null {
        return localStorage.getItem(this.DEVICE_ID_KEY);
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
            const payload = this.parseJwtPayload(token);
            if (!payload) {
                return;
            }

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

    private getTokenPayload(token: string): { exp?: number } | null {
        try {
            return this.parseJwtPayload(token) as { exp?: number } | null;
        } catch (error) {
            return null;
        }
    }

    private parseJwtPayload(token: string): Record<string, any> | null {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const base64 = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const binary = atob(paddedBase64);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const payloadStr = new TextDecoder().decode(bytes);

        return JSON.parse(payloadStr) as Record<string, any>;
    }

    // Lấy role từ JWT token
    getRole(): string | null {
        const token = this.getToken();
        if (!token) {
            return null;
        }

        try {
            const payload = this.parseJwtPayload(token);
            if (!payload) {
                return null;
            }

            return payload.role || null;
        } catch (error) {
            return null;
        }
    }

    getCurrentUser(): any {
        return this.getUserInfoFromStorage();
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        const payload = this.getTokenPayload(token);
        if (!payload?.exp) return false;

        const nowInSeconds = Math.floor(Date.now() / 1000);
        return payload.exp > nowInSeconds;
    }
}


export default new AuthService();
