import Credential from '../models/Credential.js';

// @desc    Obter todas as credenciais (sem senhas)
// @route   GET /api/credentials
// @access  Private
export const getCredentials = async (req, res) => {
    try {
        const { category, status, search, tag } = req.query;
        
        const filter = {
            $or: [
                { visibility: 'all' },
                { visibility: 'team' },
                { owner: req.user._id },
                { allowedUsers: req.user._id }
            ]
        };
        
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (tag) filter.tags = tag;
        if (search) {
            filter.$and = [{
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { host: { $regex: search, $options: 'i' } }
                ]
            }];
        }
        
        // Não retornar campos sensíveis na listagem
        const credentials = await Credential.find(filter)
            .select('-passwordEncrypted -notesEncrypted -extraFields.valueEncrypted -accessLog')
            .populate('owner', 'name email')
            .populate('relatedAsset', 'assetId description')
            .populate('relatedNetworkDevice', 'name ipAddress')
            .sort({ category: 1, title: 1 });
        
        res.json({
            success: true,
            count: credentials.length,
            data: credentials
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar credenciais',
            error: error.message
        });
    }
};

// @desc    Obter uma credencial específica (com senha descriptografada)
// @route   GET /api/credentials/:id
// @access  Private
export const getCredential = async (req, res) => {
    try {
        const credential = await Credential.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('relatedAsset', 'assetId description location')
            .populate('relatedNetworkDevice', 'name ipAddress type location')
            .populate('relatedSupplier', 'name tradeName')
            .populate('allowedUsers', 'name email')
            .populate('accessLog.user', 'name email');
        
        if (!credential) {
            return res.status(404).json({
                success: false,
                message: 'Credencial não encontrada'
            });
        }
        
        // Verificar permissão de acesso
        const hasAccess = 
            credential.visibility === 'all' ||
            credential.owner._id.toString() === req.user._id.toString() ||
            credential.allowedUsers.some(u => u._id.toString() === req.user._id.toString()) ||
            req.user.role === 'admin';
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para acessar esta credencial'
            });
        }
        
        // Registrar acesso
        credential.logAccess(
            req.user._id,
            'view',
            req.ip,
            req.get('User-Agent')
        );
        await credential.save();
        
        // Retornar com dados descriptografados
        const response = credential.toObject();
        response.password = credential.getPassword();
        response.notes = credential.getNotes();
        response.extraFieldsDecrypted = credential.getExtraFields();
        
        // Remover campos criptografados do response
        delete response.passwordEncrypted;
        delete response.notesEncrypted;
        
        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar credencial',
            error: error.message
        });
    }
};

// @desc    Criar nova credencial
// @route   POST /api/credentials
// @access  Private
export const createCredential = async (req, res) => {
    try {
        const { password, notes, extraFields, ...rest } = req.body;
        
        const credential = new Credential({
            ...rest,
            owner: req.user._id
        });
        
        // Criptografar senha
        if (password) {
            credential.setPassword(password);
        }
        
        // Criptografar notas
        if (notes) {
            credential.setNotes(notes);
        }
        
        // Adicionar campos extras
        if (extraFields && Array.isArray(extraFields)) {
            extraFields.forEach(field => {
                credential.addExtraField(field.label, field.value, field.isSecret);
            });
        }
        
        // Definir data de expiração se política de rotação estiver ativa
        if (credential.passwordPolicy.requiresRotation) {
            credential.passwordPolicy.lastRotation = new Date();
            credential.passwordPolicy.expiresAt = new Date(
                Date.now() + credential.passwordPolicy.rotationDays * 24 * 60 * 60 * 1000
            );
        }
        
        await credential.save();
        
        // Registrar criação
        credential.logAccess(req.user._id, 'create', req.ip, req.get('User-Agent'));
        await credential.save();
        
        res.status(201).json({
            success: true,
            message: 'Credencial criada com sucesso',
            data: {
                _id: credential._id,
                title: credential.title,
                category: credential.category
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao criar credencial',
            error: error.message
        });
    }
};

// @desc    Atualizar credencial
// @route   PUT /api/credentials/:id
// @access  Private
export const updateCredential = async (req, res) => {
    try {
        const credential = await Credential.findById(req.params.id);
        
        if (!credential) {
            return res.status(404).json({
                success: false,
                message: 'Credencial não encontrada'
            });
        }
        
        // Verificar permissão
        const isOwner = credential.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para editar esta credencial'
            });
        }
        
        const { password, notes, extraFields, ...rest } = req.body;
        
        // Atualizar campos básicos
        Object.assign(credential, rest);
        
        // Atualizar senha se fornecida
        if (password) {
            credential.setPassword(password);
            credential.passwordPolicy.lastRotation = new Date();
            
            if (credential.passwordPolicy.requiresRotation) {
                credential.passwordPolicy.expiresAt = new Date(
                    Date.now() + credential.passwordPolicy.rotationDays * 24 * 60 * 60 * 1000
                );
            }
        }
        
        // Atualizar notas se fornecidas
        if (notes !== undefined) {
            credential.setNotes(notes);
        }
        
        // Atualizar campos extras se fornecidos
        if (extraFields && Array.isArray(extraFields)) {
            credential.extraFields = [];
            extraFields.forEach(field => {
                credential.addExtraField(field.label, field.value, field.isSecret);
            });
        }
        
        // Registrar edição
        credential.logAccess(req.user._id, 'edit', req.ip, req.get('User-Agent'));
        
        await credential.save();
        
        res.json({
            success: true,
            message: 'Credencial atualizada com sucesso',
            data: {
                _id: credential._id,
                title: credential.title,
                category: credential.category
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar credencial',
            error: error.message
        });
    }
};

// @desc    Excluir credencial
// @route   DELETE /api/credentials/:id
// @access  Private
export const deleteCredential = async (req, res) => {
    try {
        const credential = await Credential.findById(req.params.id);
        
        if (!credential) {
            return res.status(404).json({
                success: false,
                message: 'Credencial não encontrada'
            });
        }
        
        // Verificar permissão
        const isOwner = credential.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para excluir esta credencial'
            });
        }
        
        await credential.deleteOne();
        
        res.json({
            success: true,
            message: 'Credencial excluída com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir credencial',
            error: error.message
        });
    }
};

// @desc    Copiar senha (registra no log)
// @route   POST /api/credentials/:id/copy
// @access  Private
export const copyPassword = async (req, res) => {
    try {
        const credential = await Credential.findById(req.params.id);
        
        if (!credential) {
            return res.status(404).json({
                success: false,
                message: 'Credencial não encontrada'
            });
        }
        
        // Verificar permissão
        const hasAccess = 
            credential.visibility === 'all' ||
            credential.owner.toString() === req.user._id.toString() ||
            credential.allowedUsers.includes(req.user._id) ||
            req.user.role === 'admin';
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para acessar esta credencial'
            });
        }
        
        // Registrar cópia
        credential.logAccess(req.user._id, 'copy', req.ip, req.get('User-Agent'));
        await credential.save();
        
        res.json({
            success: true,
            data: {
                password: credential.getPassword()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao copiar senha',
            error: error.message
        });
    }
};

// @desc    Obter estatísticas de credenciais
// @route   GET /api/credentials/stats
// @access  Private (Admin)
export const getCredentialStats = async (req, res) => {
    try {
        // Total por categoria
        const byCategory = await Credential.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        // Total por status
        const byStatus = await Credential.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Credenciais que precisam de rotação
        const needingRotation = await Credential.countDocuments({
            'passwordPolicy.requiresRotation': true,
            $expr: {
                $gt: [
                    { $divide: [{ $subtract: [new Date(), '$passwordPolicy.lastRotation'] }, 1000 * 60 * 60 * 24] },
                    '$passwordPolicy.rotationDays'
                ]
            }
        });
        
        // Credenciais expiradas
        const expired = await Credential.countDocuments({
            'passwordPolicy.expiresAt': { $lt: new Date() }
        });
        
        // Mais acessadas
        const mostAccessed = await Credential.find()
            .sort({ accessCount: -1 })
            .limit(10)
            .select('title category accessCount lastAccessed');
        
        const total = await Credential.countDocuments();
        
        res.json({
            success: true,
            data: {
                total,
                needingRotation,
                expired,
                byCategory,
                byStatus,
                mostAccessed
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas',
            error: error.message
        });
    }
};

// @desc    Obter histórico de acesso de uma credencial
// @route   GET /api/credentials/:id/access-log
// @access  Private (Admin ou Owner)
export const getAccessLog = async (req, res) => {
    try {
        const credential = await Credential.findById(req.params.id)
            .select('accessLog owner title')
            .populate('accessLog.user', 'name email');
        
        if (!credential) {
            return res.status(404).json({
                success: false,
                message: 'Credencial não encontrada'
            });
        }
        
        // Verificar permissão
        const isOwner = credential.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para ver o histórico'
            });
        }
        
        res.json({
            success: true,
            data: {
                title: credential.title,
                accessLog: credential.accessLog.slice().reverse() // Mais recentes primeiro
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar histórico',
            error: error.message
        });
    }
};
