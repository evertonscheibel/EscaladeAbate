import User from '../models/User.js';

// @desc    Listar todos os usuários
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter usuário por ID
// @route   GET /api/users/:id
// @access  Private (Admin)
export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar novo usuário
// @route   POST /api/users
// @access  Private (Admin)
export const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, isMaster, allowedModules } = req.body;

        // Verificar se usuário já existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'cliente',
            isMaster: isMaster || false,
            allowedModules: allowedModules || ['dashboard', 'tickets', 'knowledge-base', 'documents']
        });

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                role: user.role,
                active: user.active,
                isMaster: user.isMaster
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar usuário
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res, next) => {
    try {
        const { name, email, password, role, active, isMaster, allowedModules } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Atualizar campos
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password; // Será hasheado pelo pre-save hook
        if (role) user.role = role;
        if (active !== undefined) user.active = active;
        if (isMaster !== undefined) user.isMaster = isMaster;
        if (allowedModules) user.allowedModules = allowedModules;

        await user.save();

        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deletar usuário
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Não permitir deletar a si mesmo
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Você não pode deletar sua própria conta'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'Usuário deletado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Alternar status ativo/inativo
// @route   PATCH /api/users/:id/toggle-active
// @access  Private (Admin)
export const toggleUserActive = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Não permitir desativar a si mesmo
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Você não pode desativar sua própria conta'
            });
        }

        user.active = !user.active;
        await user.save();

        res.json({
            success: true,
            data: {
                id: user._id,
                active: user.active
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Sincronizar módulos de todos os usuários baseado em roles
// @route   POST /api/users/sync-modules
// @access  Private (Admin)
export const syncUserModules = async (req, res, next) => {
    try {
        const users = await User.find();

        const moduleMapping = {
            admin: [
                'dashboard', 'tickets', 'assets', 'documents',
                'knowledge-base', 'purchase-requests',
                'metrics/my-performance', 'reports', 'users',
                'network', 'credentials', 'problems',
                'gestao-ti', 'gep', 'escala-abate', 'gestao-ativos',
                'candidates', 'gatehouse', 'slaughter'
            ],
            tecnico: [
                'dashboard', 'tickets', 'assets', 'documents', 'knowledge-base',
                'metrics/my-performance', 'network', 'credentials', 'problems',
                'gestao-ti', 'gep', 'escala-abate', 'gestao-ativos',
                'candidates', 'gatehouse', 'slaughter'
            ],
            cliente: [
                'dashboard', 'tickets', 'knowledge-base', 'documents'
            ]
        };

        let updatedCount = 0;
        for (const user of users) {
            const defaultModules = moduleMapping[user.role] || moduleMapping.cliente;

            // Apenas atualizamos se for diferente ou se estiver vazio
            // Para admin, sempre garantimos acesso total se solicitado "aplicar a todos"
            user.allowedModules = defaultModules;
            await user.save();
            updatedCount++;
        }

        res.json({
            success: true,
            message: `${updatedCount} usuários sincronizados com sucesso`,
            updatedCount
        });
    } catch (error) {
        next(error);
    }
};
