import KnowledgeBase from '../models/KnowledgeBase.js';

// @desc    Listar todos os artigos
// @route   GET /api/kb
// @access  Private
export const getArticles = async (req, res, next) => {
    try {
        const { category, search } = req.query;

        let query = { published: true };

        if (category) query.category = category;

        if (search) {
            query.$text = { $search: search };
        }

        const articles = await KnowledgeBase.find(query)
            .populate('author', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter artigo por ID
// @route   GET /api/kb/:id
// @access  Private
export const getArticle = async (req, res, next) => {
    try {
        const article = await KnowledgeBase.findById(req.params.id)
            .populate('author', 'name email');

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Artigo não encontrado'
            });
        }

        // Incrementar visualizações
        article.views += 1;
        await article.save();

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar novo artigo
// @route   POST /api/kb
// @access  Private (Admin/Tecnico)
export const createArticle = async (req, res, next) => {
    try {
        const articleData = {
            ...req.body,
            author: req.user.id
        };

        const article = await KnowledgeBase.create(articleData);

        const populatedArticle = await KnowledgeBase.findById(article._id)
            .populate('author', 'name email');

        res.status(201).json({
            success: true,
            data: populatedArticle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar artigo
// @route   PUT /api/kb/:id
// @access  Private (Admin/Tecnico)
export const updateArticle = async (req, res, next) => {
    try {
        const article = await KnowledgeBase.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('author', 'name email');

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Artigo não encontrado'
            });
        }

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deletar artigo
// @route   DELETE /api/kb/:id
// @access  Private (Admin)
export const deleteArticle = async (req, res, next) => {
    try {
        const article = await KnowledgeBase.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Artigo não encontrado'
            });
        }

        await article.deleteOne();

        res.json({
            success: true,
            message: 'Artigo deletado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Incrementar visualizações de um artigo
// @route   PUT /api/kb/:id/views
// @access  Private
export const incrementViews = async (req, res, next) => {
    try {
        const article = await KnowledgeBase.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Artigo não encontrado'
            });
        }

        res.json({
            success: true,
            data: { views: article.views }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Buscar artigos relacionados
// @route   GET /api/kb/search/related
// @access  Private
export const searchRelated = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query de busca é obrigatória'
            });
        }

        const articles = await KnowledgeBase.find({
            $text: { $search: query },
            published: true
        })
            .select('title category tags views')
            .limit(5);

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });
    } catch (error) {
        next(error);
    }
};
