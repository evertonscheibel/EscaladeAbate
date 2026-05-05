import User from '../models/User.js';
import PermissionProfile from '../models/PermissionProfile.js';
import PermissionAuditLog from '../models/PermissionAuditLog.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { paginate } from '../utils/paginationHelper.js';

// =============================================
// CONSTANTES
// =============================================

const ALL_MODULES = [
    'dashboard', 'tickets', 'metrics/my-performance', 'knowledge-base', 'documents',
    'assets', 'candidates', 'job-positions', 'gatehouse', 'noc',
    'network', 'credentials', 'purchase-requests', 'reports', 'problems', 'maintenance', 'settings', 'users', 'permission-profiles',
    'quality', 'quality/non-conformities', 'quality/audit-packages', 'quality/models',
    'slaughter', 'escala-abate', 'desossa', 'pcp', 'industria'
];

const ALL_ACTIONS = ['view', 'create', 'edit', 'close', 'reopen', 'delete', 'export', 'manage'];

const DEPARTMENTS = [
    'PRODUCAO', 'ADMINISTRATIVO', 'MANUTENCAO', 'TI',
    'RH', 'SEGURANCA', 'QUALIDADE', 'LOGISTICA',
    'COMERCIAL', 'FINANCEIRO', 'COMPRAS', 'DIRETORIA'
];

// =============================================
// HELPER: Criar log de auditoria
// =============================================

async function createAuditLog(data, req) {
    try {
        await PermissionAuditLog.create({
            ...data,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent']
        });
    } catch (err) {
        console.error('Erro ao criar audit log:', err.message);
    }
}

// =============================================
// CRUD DE USUÁRIOS
// =============================================

/**
 * GET /api/users
 * Listar todos os usuários (com filtros)
 */
export const getUsers = async (req, res, next) => {
    try {
        const {
            search,        // busca por nome ou email
            role,          // filtrar por role
            department,    // filtrar por departamento
            active,        // filtrar por ativo/inativo
            profileId,     // filtrar por perfil de permissão
            page = 1,
            limit = 50,
            sort = '-createdAt'
        } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) filter.role = role;
        if (department) filter.department = department;
        if (active !== undefined) filter.active = active === 'true';
        if (profileId) filter.permissionProfile = profileId;

        const options = {
            page: page,
            limit: limit,
            sort: sort,
            populate: [
                { path: 'permissionProfile', select: 'name color icon' }
            ],
            select: '-password -passwordHistory -emailVerificationToken -resetPasswordToken'
        };

        const result = await paginate(User, filter, options);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/users/:id
 * Detalhes do usuário (com permissões resolvidas)
 */
export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -passwordHistory -resetPasswordToken -emailVerificationToken')
            .select('+loginHistory')
            .populate('permissionProfile')
            .populate('deactivatedBy', 'name');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        // Resolver permissões efetivas
        const effectivePermissions = await user.getAllEffectivePermissions();

        res.json({
            success: true,
            data: {
                user,
                effectivePermissions,
                allModules: ALL_MODULES,
                allActions: ALL_ACTIONS,
                departments: DEPARTMENTS
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/users
 * Criar novo usuário (somente admin)
 */
export const createUser = async (req, res, next) => {
    try {
        const {
            name, email, password, role, department, position,
            phone, employeeId, permissionProfileId, allowedModules,
            permissions, mustChangePassword
        } = req.body;

        // Verificar email duplicado
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email já cadastrado' });
        }

        // SEGURANÇA: Apenas admin pode criar admin
        const safeRole = req.user.role === 'admin' ? (role || 'cliente') : 'cliente';

        // Se tem perfil, carregar para preencher modules
        let profileModules = [];
        if (permissionProfileId) {
            const profile = await PermissionProfile.findById(permissionProfileId);
            if (profile) {
                profileModules = profile.modules || [];
            }
        }

        const user = await User.create({
            name,
            email,
            password: password || generateTempPassword(),
            role: safeRole,
            department,
            position,
            phone,
            employeeId,
            permissionProfile: permissionProfileId || null,
            allowedModules: allowedModules || (profileModules.length > 0 ? profileModules : ['dashboard']),
            permissions: permissions ? new Map(Object.entries(permissions)) : new Map(),
            hasCustomPermissions: !!permissions && Object.keys(permissions).length > 0,
            mustChangePassword: mustChangePassword !== false, // default true
            active: true
        });

        // Audit log
        await createAuditLog({
            targetUser: user._id,
            targetUserName: user.name,
            changedBy: req.user._id,
            changedByName: req.user.name,
            action: 'USER_CREATED',
            after: {
                role: safeRole,
                department,
                allowedModules: user.allowedModules,
                permissionProfile: permissionProfileId,
                permissions: permissions || {}
            },
            details: `Usuário ${user.name} criado por ${req.user.name}`
        }, req);

        // Retornar sem senha
        const created = await User.findById(user._id)
            .select('-password -passwordHistory')
            .populate('permissionProfile', 'name color icon');

        res.status(201).json({ success: true, data: created, message: 'Usuário criado com sucesso' });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/users/:id
 * Atualizar dados do usuário
 */
export const updateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        const {
            name, department, position, phone, employeeId,
            role, allowedModules, avatar
        } = req.body;

        // Snapshot antes
        const before = {
            name: user.name, role: user.role,
            department: user.department, position: user.position,
            allowedModules: [...user.allowedModules]
        };

        // Atualizar campos
        if (name) user.name = name;
        if (department !== undefined) user.department = department;
        if (position !== undefined) user.position = position;
        if (phone !== undefined) user.phone = phone;
        if (employeeId !== undefined) user.employeeId = employeeId;
        if (avatar !== undefined) user.avatar = avatar;

        // Apenas admin muda role e modules
        if (req.user.role === 'admin') {
            if (role) user.role = role;
            if (allowedModules) user.allowedModules = allowedModules;
        }

        await user.save();

        // Audit
        const after = {
            name: user.name, role: user.role,
            department: user.department, position: user.position,
            allowedModules: [...user.allowedModules]
        };

        const changes = [];
        if (before.name !== after.name) changes.push(`Nome: ${before.name} → ${after.name}`);
        if (before.role !== after.role) changes.push(`Role: ${before.role} → ${after.role}`);
        if (before.department !== after.department) changes.push(`Depto: ${before.department || '-'} → ${after.department || '-'}`);

        if (changes.length > 0) {
            await createAuditLog({
                targetUser: user._id,
                targetUserName: user.name,
                changedBy: req.user._id,
                changedByName: req.user.name,
                action: before.role !== after.role ? 'ROLE_CHANGED' : 'USER_UPDATED',
                before, after,
                details: changes.join('; ')
            }, req);
        }

        const updated = await User.findById(user._id)
            .select('-password -passwordHistory')
            .populate('permissionProfile', 'name color icon');

        res.json({ success: true, data: updated, message: 'Usuário atualizado' });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/users/:id/permissions
 * Atualizar permissões granulares e/ou perfil de um usuário
 */
export const updateUserPermissions = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        const { permissionProfileId, permissions, allowedModules } = req.body;

        // Snapshot antes
        const before = {
            permissionProfile: user.permissionProfile,
            permissions: user.permissions instanceof Map
                ? Object.fromEntries(user.permissions)
                : user.permissions || {},
            allowedModules: [...user.allowedModules],
            hasCustomPermissions: user.hasCustomPermissions
        };

        // Atualizar perfil
        if (permissionProfileId !== undefined) {
            user.permissionProfile = permissionProfileId || null;

            // Se atribuiu perfil, atualizar allowedModules a partir do perfil
            if (permissionProfileId) {
                const profile = await PermissionProfile.findById(permissionProfileId);
                if (profile) {
                    user.allowedModules = profile.modules || ['dashboard'];
                    // Se não há customizações, limpar permissions
                    if (!permissions || Object.keys(permissions).length === 0) {
                        user.permissions = new Map();
                        user.hasCustomPermissions = false;
                    }
                }
            }
        }

        // Atualizar permissões customizadas
        if (permissions !== undefined) {
            user.permissions = new Map(Object.entries(permissions));
            user.hasCustomPermissions = Object.keys(permissions).length > 0;
        }

        // Override manual de módulos
        if (allowedModules) {
            user.allowedModules = allowedModules;
        }

        await user.save();

        // Snapshot depois
        const after = {
            permissionProfile: user.permissionProfile,
            permissions: user.permissions instanceof Map
                ? Object.fromEntries(user.permissions)
                : user.permissions || {},
            allowedModules: [...user.allowedModules],
            hasCustomPermissions: user.hasCustomPermissions
        };

        // Determinar tipo de ação
        let action = 'PERMISSIONS_CHANGED';
        let details = 'Permissões atualizadas';
        if (before.permissionProfile?.toString() !== after.permissionProfile?.toString()) {
            action = permissionProfileId ? 'PROFILE_ASSIGNED' : 'PROFILE_REMOVED';
            details = permissionProfileId
                ? `Perfil atribuído: ${permissionProfileId}`
                : 'Perfil removido';
        }

        await createAuditLog({
            targetUser: user._id,
            targetUserName: user.name,
            changedBy: req.user._id,
            changedByName: req.user.name,
            action, before, after, details
        }, req);

        const updated = await User.findById(user._id)
            .select('-password -passwordHistory')
            .populate('permissionProfile', 'name color icon');

        const effectivePermissions = await updated.getAllEffectivePermissions();

        res.json({
            success: true,
            data: { user: updated, effectivePermissions },
            message: 'Permissões atualizadas'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/users/:id/deactivate
 */
export const deactivateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Não é possível desativar seu próprio usuário' });
        }

        const { reason } = req.body;

        user.active = false;
        user.deactivatedAt = new Date();
        user.deactivatedBy = req.user._id;
        user.deactivationReason = reason || 'Sem motivo informado';
        await user.save();

        await createAuditLog({
            targetUser: user._id,
            targetUserName: user.name,
            changedBy: req.user._id,
            changedByName: req.user.name,
            action: 'USER_DEACTIVATED',
            details: `Motivo: ${reason || 'Não informado'}`
        }, req);

        res.json({ success: true, message: `Usuário ${user.name} desativado` });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/users/:id/reactivate
 */
export const reactivateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        user.active = true;
        user.deactivatedAt = null;
        user.deactivatedBy = null;
        user.deactivationReason = null;
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        await createAuditLog({
            targetUser: user._id,
            targetUserName: user.name,
            changedBy: req.user._id,
            changedByName: req.user.name,
            action: 'USER_REACTIVATED',
            details: `Reativado por ${req.user.name}`
        }, req);

        res.json({ success: true, message: `Usuário ${user.name} reativado` });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/users/:id/reset-password
 */
export const resetPasswordByAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        const tempPassword = generateTempPassword();
        user.password = tempPassword;
        user.mustChangePassword = true;
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        await createAuditLog({
            targetUser: user._id,
            targetUserName: user.name,
            changedBy: req.user._id,
            changedByName: req.user.name,
            action: 'PASSWORD_RESET_BY_ADMIN',
            details: `Senha resetada por ${req.user.name}. Troca obrigatória no próximo login.`
        }, req);

        res.json({
            success: true,
            data: { tempPassword },
            message: 'Senha resetada. Informe a senha temporária ao usuário.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/users/:id/audit-log
 */
export const getUserAuditLog = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const logs = await PermissionAuditLog.find({ targetUser: req.params.id })
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await PermissionAuditLog.countDocuments({ targetUser: req.params.id });

        res.json({
            success: true,
            data: logs,
            pagination: { total, page: parseInt(page), limit: parseInt(limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/users/stats
 */
export const getUserStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            activeUsers,
            inactiveUsers,
            byRole,
            byDepartment,
            recentLogins,
            lockedUsers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ active: true }),
            User.countDocuments({ active: false }),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            User.aggregate([
                { $match: { department: { $ne: null } } },
                { $group: { _id: '$department', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            User.find({ lastLogin: { $ne: null } })
                .sort('-lastLogin')
                .limit(10)
                .select('name email lastLogin role')
                .lean(),
            User.countDocuments({ lockUntil: { $gt: new Date() } })
        ]);

        res.json({
            success: true,
            data: {
                totalUsers, activeUsers, inactiveUsers, lockedUsers,
                byRole, byDepartment, recentLogins
            }
        });
    } catch (error) {
        next(error);
    }
};

// =============================================
// HELPER: gerar senha temporária
// =============================================

function generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
