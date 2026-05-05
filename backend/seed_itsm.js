import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const users = [
    {
        name: 'Gestor de TI',
        email: 'gestor@empresa.com',
        password: '123456',
        role: 'admin',
        supportLevel: 'N3',
        isMaster: true
    },
    {
        name: 'Atendente Nível 1',
        email: 'n1@empresa.com',
        password: '123456',
        role: 'tecnico',
        supportLevel: 'N1'
    },
    {
        name: 'Atendente Nível 2',
        email: 'n2@empresa.com',
        password: '123456',
        role: 'tecnico',
        supportLevel: 'N2'
    }
];

const seedITSM = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB');

        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                // Atualizar
                exists.role = u.role;
                exists.supportLevel = u.supportLevel;
                await exists.save();
                console.log(`Usuário atualizado: ${u.email}`);
            } else {
                await User.create(u);
                console.log(`Usuário criado: ${u.email}`);
            }
        }

        console.log('Seed concluído com sucesso');
        process.exit(0);
    } catch (error) {
        console.error('Erro no seed:', error);
        process.exit(1);
    }
};

seedITSM();
