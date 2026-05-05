import NodeCache from 'node-cache';

/**
 * Serviço de cache centralizado usando node-cache.
 * TTL padrão: 5 minutos (300 segundos).
 */
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Wrapper para buscar do cache ou executar uma função e salvar o resultado.
 * 
 * @param {string} key - Chave do cache
 * @param {Function} fetchFn - Função que busca os dados se não estiverem no cache
 * @param {number} [ttl] - Tempo de vida opcional em segundos
 * @returns {Promise<any>} Dados cacheados ou novos
 */
export const getCachedData = async (key, fetchFn, ttl) => {
    const cached = cache.get(key);
    if (cached !== undefined) {
        return cached;
    }

    const freshData = await fetchFn();
    if (freshData !== undefined && freshData !== null) {
        if (ttl) {
            cache.set(key, freshData, ttl);
        } else {
            cache.set(key, freshData);
        }
    }

    return freshData;
};

/**
 * Invalida chaves específicas ou limpa todo o cache se nenhuma chave for passada.
 * 
 * @param {string|string[]} [keys] - Chave ou array de chaves a invalidar
 */
export const invalidateCache = (keys) => {
    if (!keys) {
        cache.flushAll();
        return;
    }

    if (Array.isArray(keys)) {
        cache.del(keys);
    } else {
        cache.del(keys);
    }
};

export default cache;
