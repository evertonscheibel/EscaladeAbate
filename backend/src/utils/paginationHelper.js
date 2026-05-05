/**
 * Utilitário de paginação robusto para o Mongoose.
 * Padroniza a resposta de listagens em todo o sistema.
 * 
 * @param {import('mongoose').Model} model - Modelo Mongoose
 * @param {Object} query - Filtro da consulta
 * @param {Object} options - Opções de paginação (page, limit, sort, populate, select)
 * @returns {Promise<Object>} Resultado formatado: { data, total, page, pages, limit }
 */
export const paginate = async (model, query = {}, options = {}) => {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(options.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Executa contagem e busca em paralelo para performance
    const [total, data] = await Promise.all([
        model.countDocuments(query),
        model.find(query)
            .sort(options.sort || { createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate(options.populate || '')
            .select(options.select || '')
            .lean() // Melhora performance se não for editar o objeto depois
    ]);

    const pages = Math.ceil(total / limit);

    return {
        data,
        total,
        page,
        pages,
        limit
    };
};
