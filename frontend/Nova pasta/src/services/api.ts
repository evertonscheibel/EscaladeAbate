import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL;

console.log('🔧 Debug API_URL (Raw):', API_URL);

// Se não houver URL, ou ela for curta demais, ou estiver faltando o IP (ex: http://:3000)
if (!API_URL || API_URL.length < 10 || API_URL.includes('://:')) {
    // Tenta usar o hostname atual para construir a URL da API
    const currentHost = window.location.hostname;
    // Se estiver rodando localmente (localhost), usa localhost, senão usa o IP da rede
    const hostname = currentHost === '127.0.0.1' ? 'localhost' : currentHost;

    API_URL = `http://${hostname}:3000/api`;
    console.log('⚠️ URL inválida detectada no .env. Usando fallback automático:', API_URL);
} else {
    // Limpeza agressiva de caracteres inválidos que podem vir do .env
    API_URL = String(API_URL).replace(/['";\s]/g, '').trim();

    // Garantir protocolo
    if (!API_URL.startsWith('http')) {
        API_URL = `http://${API_URL}`;
    }
}

// Garantir que não termina com barra
if (API_URL.endsWith('/')) {
    API_URL = API_URL.slice(0, -1);
}

console.log('✅ API_URL Final:', API_URL);
export { API_URL };

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
