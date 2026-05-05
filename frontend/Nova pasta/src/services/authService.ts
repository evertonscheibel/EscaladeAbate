import api from './api';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role?: string;
}

export interface User {
    id?: string;
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'tecnico' | 'cliente';
    supportLevel?: string;
    isMaster?: boolean;
    allowedModules?: string[];
}

export const authService = {
    async login(data: LoginData) {
        const response = await api.post('/auth/login', data);
        if (response.data.success) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    async register(data: RegisterData) {
        const response = await api.post('/auth/register', data);
        if (response.data.success) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    async getMe() {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }
};

export default authService;
