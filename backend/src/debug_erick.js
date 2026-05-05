import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import PermissionProfile from './models/PermissionProfile.js';
import connectDB from './config/database.js';

dotenv.config();

const debugErick = async () => {
    try {
        await connectDB();

        console.log('Buscando usuário "Erick"...');
        const ericks = await User.find({
            $or: [
                { name: { $regex: 'Erick', $options: 'i' } },
                { email: { $regex: 'Erick', $options: 'i' } }
            ]
        }).select('-password').populate('permissionProfile');

        if (ericks.length === 0) {
            console.log('❌ Nenhum usuário encontrado com o nome "Erick".');
        } else {
            console.log(`✅ Foram encontrados ${ericks.length} usuários:`);
            ericks.forEach(u => {
                console.log('-----------------------------------');
                console.log(`ID: ${u._id}`);
                console.log(`Nome: ${u.name}`);
                console.log(`Email: ${u.email}`);
                console.log(`Role: ${u.role}`);
                console.log(`Ativo: ${u.active}`);
                console.log(`Departamento: ${u.department}`);
                console.log(`Perfil: ${u.permissionProfile?.name || 'Nenhum'}`);
                console.log(`Módulos Permitidos: ${u.allowedModules.join(', ')}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Erro ao buscar Erick:', error);
        process.exit(1);
    }
};

debugErick();
