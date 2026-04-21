import axios from "axios";

const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim();
const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
const authTokenKey = process.env.REACT_APP_AUTH_TOKEN_KEY || 'authToken';

const apiService = axios.create({
    baseURL: normalizedApiBaseUrl || undefined,
    timeout: 10000,
})

const isNgrokUrl = /https:\/\/.+\.ngrok[\w-]*\.dev$/i.test(apiBaseUrl);

// Tự động gửi token nếu có 
apiService.interceptors.request.use((config) => {
    const token = localStorage.getItem(authTokenKey);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';
    }

    // Bypass ngrok browser warning page when calling from browser
    if (isNgrokUrl) {
        config.headers['ngrok-skip-browser-warning'] = 'true';
    }

    return config;
}, (error) => Promise.reject(error));

apiService.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(authTokenKey);
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiService;