import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutos

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Verificar se usuário já existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }

        // Criar usuário
        const user = await User.create({
            name,
            email,
            password,
            role: 'cliente',  // SEMPRE cliente, admin promove depois
            allowedModules: ['dashboard'],
            mustChangePassword: false
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isMaster: user.isMaster,
                    allowedModules: user.allowedModules
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }

        // Buscar usuário com senha e campos de lockout
        const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // Verificar se a conta está bloqueada
        if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesRemaining = Math.ceil((user.lockUntil - new Date()) / 60000);
            return res.status(423).json({
                success: false,
                message: `Conta bloqueada por excesso de tentativas. Tente novamente em ${minutesRemaining} minuto(s).`
            });
        }

        // Se lockUntil expirou, resetar contadores
        if (user.lockUntil && user.lockUntil <= new Date()) {
            user.loginAttempts = 0;
            user.lockUntil = null;
        }

        // Verificar senha
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Incrementar tentativas
            user.loginAttempts = (user.loginAttempts || 0) + 1;

            // Bloquear após MAX_LOGIN_ATTEMPTS tentativas
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
                await user.save();
                return res.status(423).json({
                    success: false,
                    message: `Conta bloqueada após ${MAX_LOGIN_ATTEMPTS} tentativas incorretas. Tente novamente em 15 minutos.`
                });
            }

            await user.save();
            const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
            return res.status(401).json({
                success: false,
                message: `Credenciais inválidas. ${remaining} tentativa(s) restante(s).`
            });
        }

        if (!user.active) {
            return res.status(401).json({
                success: false,
                message: 'Usuário inativo'
            });
        }

        // Login bem-sucedido — resetar contadores
        user.lastLogin = new Date();
        user.loginAttempts = 0;
        user.lockUntil = null;

        if (!user.loginHistory) user.loginHistory = [];
        user.loginHistory.unshift({
            at: new Date(),
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        user.loginHistory = user.loginHistory.slice(0, 10);
        await user.save();

        const token = generateToken(user._id);

        const effectivePermissions = await user.getAllEffectivePermissions();

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isMaster: user.isMaster,
                    allowedModules: user.allowedModules,
                    permissions: effectivePermissions
                },
                token,
                mustChangePassword: user.mustChangePassword
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter usuário logado
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        const effectivePermissions = await user.getAllEffectivePermissions();
        const userObj = user.toJSON();
        userObj.permissions = effectivePermissions;

        res.json({
            success: true,
            data: userObj
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar perfil
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Alterar senha
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                message: 'Senha atual incorreta'
            });
        }

        user.password = newPassword;
        await user.save();

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Senha atualizada com sucesso',
            data: { token }
        });
    } catch (error) {
        next(error);
    }
};
