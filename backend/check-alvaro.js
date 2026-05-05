import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import PermissionProfile from './src/models/PermissionProfile.js';
import connectDB from './src/config/database.js';

dotenv.config();

async function checkUser() {
    try {
        await connectDB();
        const user = await User.findOne({ email: 'alvaro.comercial@frizelo.com.br' }).populate('permissionProfile');
        if (!user) {
            console.log('Usuário não encontrado');
        } else {
            console.log('--- USUÁRIO ---');
            console.log('Nome:', user.name);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Módulos Permitidos:', user.allowedModules);
            console.log('Tem Permissões Customizadas:', user.hasCustomPermissions);
            console.log('Perfil de Permissão:', user.permissionProfile ? user.permissionProfile.name : 'Nenhum');
            if (user.permissionProfile) {
                console.log('Módulos do Perfil:', user.permissionProfile.modules);
            }
            console.log('Permissões (Map):', Object.fromEntries(user.permissions || new Map()));
        }
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

checkUser();
