import axios from "axios";

const apiService = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
    timeout: 10000,
})

// Tự động gửi token nếu có 
apiService.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if(token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if(!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';
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