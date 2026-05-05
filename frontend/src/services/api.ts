import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL;

console.log('🔧 Debug API_URL (Raw):', API_URL);

// Se não houver URL, ou ela for curta demais, ou estiver faltando o IP (ex: http://:3000)
if (!API_URL || API_URL.length < 10 || API_URL.includes('://:')) {
    // Tenta usar o hostname atual para construir a URL da API
    const currentHost = window.location.hostname;
    // Se estiver rodando localmente (localhost), usa localhost, senão usa o IP da rede
    const hostname = currentHost === '127.0.0.1' ? 'localhost' : currentHost;

    API_URL = `http://${hostname}:5000/api`;
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
    timeout: 15000, // 15 segundos de timeout
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

// Interceptor para tratar erros com retry condicional
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response?.status;

        // 1. Tratamento específico de 429 (Rate Limit) -> Não fazer retry
        if (status === 429) {
            console.error('⚠️ Rate limit atingido. Requisição bloqueada pelo servidor.');
            return Promise.reject(error);
        }

        // 2. Tratamento específico de 401 (Não Autorizado) -> Redirecionar para login
        if (status === 401) {
            // Ignora se for o próprio endpoint de login para evitar loop
            if (!config.url.includes('/auth/login')) {
                console.warn('⚠️ Sessão expirada ou inválida. Redirecionando para login...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Evita múltiplos redirecionamentos simultâneos
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
            return Promise.reject(error);
        }

        // 3. Lógica de Retry condicional:
        // - Somente para erros de rede (sem error.response)
        // - Somente para o método GET
        // - Somente se não for a rota de login
        // - Somente 1 vez
        const isNetworkError = !error.response;
        const isGetMethod = config.method?.toUpperCase() === 'GET';
        const isLoginPath = config.url.includes('/auth/login');

        if (isNetworkError && isGetMethod && !isLoginPath && !config._retry) {
            config._retry = true;
            console.warn(`⚠️ Erro de rede em GET ${config.url}. Tentando novamente em 2s...`);

            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                return await api(config);
            } catch (retryError) {
                console.error('❌ Servidor indisponível após tentativa de retry.');
                return Promise.reject(retryError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
