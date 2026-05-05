import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testLogin() {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado');

        const email = 'admin@gestao.com';
        const password = 'admin123';

        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('❌ Usuário não encontrado');
            process.exit(1);
        }

        console.log('Usuário encontrado:', user.email);
        console.log('Hash no banco:', user.password);

        const isMatch = await user.comparePassword(password);
        console.log('Bcrypt compare result:', isMatch);

        if (!isMatch) {
            // Teste manual com bcrypt.compare
            const manualMatch = await bcrypt.compare(password, user.password);
            console.log('Manual bcrypt compare result:', manualMatch);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

testLogin();
