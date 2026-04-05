import axios from "axios";

const apiService = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    timeout: 10000,
})

const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim();
const isNgrokUrl = /https:\/\/.+\.ngrok[\w-]*\.dev$/i.test(apiBaseUrl);

// Tự động gửi token nếu có 
apiService.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
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
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiService;