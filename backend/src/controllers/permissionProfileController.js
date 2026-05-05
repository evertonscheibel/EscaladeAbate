import PermissionProfile from '../models/PermissionProfile.js';
import mongoose from 'mongoose';

/**
 * GET /api/permission-profiles
 */
export const getProfiles = async (req, res, next) => {
    try {
        const profiles = await PermissionProfile.find({ active: true })
            .populate('createdBy', 'name')
            .sort('name')
            .lean();

        res.json({ success: true, data: profiles });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/permission-profiles/:id
 */
export const getProfileById = async (req, res, next) => {
    try {
        const profile = await PermissionProfile.findById(req.params.id)
            .populate('createdBy', 'name')
            .lean();

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Perfil não encontrado' });
        }

        // Contar quantos usuários usam este perfil
        const usersCount = await mongoose.model('User').countDocuments({
            permissionProfile: profile._id
        });

        res.json({ success: true, data: { ...profile, usersCount } });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/permission-profiles
 */
export const createProfile = async (req, res, next) => {
    try {
        const { name, description, color, icon, defaultRole, modules, permissions } = req.body;

        const profile = await PermissionProfile.create({
            name,
            description,
            color,
            icon,
            defaultRole,
            modules,
            permissions: permissions ? new Map(Object.entries(permissions)) : new Map(),
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: profile, message: 'Perfil criado' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Já existe um perfil com este nome' });
        }
        next(error);
    }
};

/**
 * PUT /api/permission-profiles/:id
 */
export const updateProfile = async (req, res, next) => {
    try {
        const profile = await PermissionProfile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Perfil não encontrado' });
        }

        const { name, description, color, icon, defaultRole, modules, permissions } = req.body;

        if (name) profile.name = name;
        if (description !== undefined) profile.description = description;
        if (color) profile.color = color;
        if (icon) profile.icon = icon;
        if (defaultRole) profile.defaultRole = defaultRole;
        if (modules) profile.modules = modules;
        if (permissions) profile.permissions = new Map(Object.entries(permissions));

        await profile.save();

        res.json({ success: true, data: profile, message: 'Perfil atualizado' });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/permission-profiles/:id
 */
export const deleteProfile = async (req, res, next) => {
    try {
        const profile = await PermissionProfile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Perfil não encontrado' });
        }

        if (profile.isSystem) {
            return res.status(403).json({ success: false, message: 'Perfis de sistema não podem ser excluídos' });
        }

        // Verificar se há usuários usando este perfil
        const usersCount = await mongoose.model('User').countDocuments({
            permissionProfile: profile._id
        });

        if (usersCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Este perfil está vinculado a ${usersCount} usuário(s). Remova o vínculo antes de excluir.`
            });
        }

        profile.active = false;
        await profile.save();

        res.json({ success: true, message: 'Perfil desativado' });
    } catch (error) {
        next(error);
    }
};
